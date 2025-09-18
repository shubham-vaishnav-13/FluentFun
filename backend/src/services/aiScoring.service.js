import { GoogleGenerativeAI } from "@google/generative-ai";

// Lazy init (so dev without key can still run with heuristic fallback)
let genAI = null;
function getGenAI() {
    if (genAI) return genAI;
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[AI] GEMINI_API_KEY not set – using heuristic fallback scoring');
            return null;
        }
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    genAI = new GoogleGenerativeAI(key);
    return genAI;
}

// Validate AI response schema
function validateAIResponse(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('AI response must be an object');
    }

    if (!Array.isArray(data.categories)) {
        throw new Error('AI response must include categories array');
    }

    // Validate each category
    data.categories.forEach((cat, idx) => {
        if (!cat.key && !cat.label) {
            throw new Error(`Category ${idx} missing both key and label`);
        }
        if (typeof cat.score !== 'number' || cat.score < 0 || cat.score > 100) {
            throw new Error(`Category ${idx} (${cat.key || cat.label}) has invalid score: ${cat.score}`);
        }
    });

    // Ensure required fields
    if (typeof data.overallFeedback !== 'string' || !data.overallFeedback.trim()) {
        throw new Error('AI response missing overallFeedback');
    }

    return true;
}

async function retryWithBackoff(fn, retries = 2, baseDelay = 1000) {
    let lastError;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i === retries) break;
            
            // Exponential backoff
            const delay = baseDelay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

/**
 * Evaluate a writing submission according to challenge rubric.
 * @param {Object} params
 * @param {import('../models/writingChallenge.models.js').WritingChallenge} params.challenge
 * @param {string} params.essayText
 * @returns {Promise<{model:string,categories:Array<{key:string,label?:string,score:number,comment?:string}>,overallFeedback:string,processingTimeMs:number}>}
 */
export async function evaluateSubmission({ challenge, essayText }) {
    if (!challenge?.rubric?.length) {
        throw new Error('Challenge must have a rubric defined');
    }

    if (!essayText?.trim()) {
        throw new Error('Essay text is required');
    }

    const rubricLines = challenge.rubric
        .map(r => `${r.name}|${r.weight}|${r.description || r.name}`)
        .join('\n');

    const systemPrompt = [
        "You are an impartial writing evaluator. Your task is to evaluate the essay according to the rubric.",
        "Return ONLY a JSON object with exactly these fields:",
        "- model: string (your model name)",
        "- categories: array of objects, each with:",
        "  - key: string (matching rubric name)",
        "  - score: number (0-100)",
        "  - comment: string (specific feedback)",
        "- overallFeedback: string (general advice)",
        "IMPORTANT: No markdown, no extra text, ONLY valid JSON"
    ].join('\n');

    const userPrompt = [
        `Challenge: ${challenge.title}`,
        `Language: ${challenge.language}`,
        `Category: ${challenge.category}`,
        `Difficulty: ${challenge.difficulty}`,
        '',
        'Original Prompt:',
        challenge.prompt,
        '',
        'Rubric (name|weight|description):',
        rubricLines,
        '',
        'Essay:',
        `"""${essayText}"""`
    ].join('\n');

    const started = Date.now();

    try {
        // Pre-validate the rubric
        const invalidRubric = challenge.rubric.find(r => 
            !r.name || typeof r.weight !== 'number' || r.weight < 0 || r.weight > 100
        );
        if (invalidRubric) {
            throw new Error(`Invalid rubric item: ${JSON.stringify(invalidRubric)}`);
        }

        const evalFn = async () => {
            const client = getGenAI();
            if (!client) {
                // Heuristic fallback: distribute pseudo-random but deterministic scores based on text hash & rubric weights
                const hash = [...essayText].reduce((a, c) => (a + c.charCodeAt(0)) % 1000, 0);
                const categories = challenge.rubric.map((r, i) => {
                    const base = (hash + (i * 37)) % 101; // 0-100
                    // Light weighting: nudge toward weight proportion
                    const adjusted = Math.round((base * 0.7) + (r.weight * 0.3));
                    return {
                        key: r.name,
                        label: r.name,
                        score: Math.min(100, Math.max(0, adjusted)),
                        comment: `Provisional heuristic score for ${r.name}. Provide a real API key to enable AI feedback.`
                    };
                });
                return {
                    model: 'heuristic-fallback',
                    categories,
                    overallFeedback: 'Heuristic fallback used (no GEMINI_API_KEY). Add API key for real AI evaluation.',
                };
            }

            const model = client.getGenerativeModel({ 
                model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }
                ]
            });

            const result = await model.generateContent([
                { text: systemPrompt },
                { text: userPrompt }
            ]);

            if (!result.response) {
                throw new Error('AI model returned empty response');
            }

            const response = result.response;
            const content = response.text() || '';

            // Try to extract JSON even if there's surrounding text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in AI response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            validateAIResponse(parsed);

            // Normalize category keys to match rubric
            const rubricMap = new Map(challenge.rubric.map(r => [r.name.toLowerCase(), r]));
            parsed.categories = parsed.categories.map(cat => ({
                ...cat,
                key: cat.key || cat.label || 'unknown',
                label: cat.label || cat.key || 'Unknown',
                score: Math.min(100, Math.max(0, Math.round(cat.score)))
            })).filter(cat => rubricMap.has(cat.key.toLowerCase()));

            return parsed;
        };

        const result = await retryWithBackoff(evalFn);
        return { ...result, processingTimeMs: Date.now() - started };

    } catch (error) {
        // Add context to the error
        const enhancedError = new Error(`AI evaluation failed: ${error.message}`);
        enhancedError.code = 'AI_EVAL_ERROR';
        enhancedError.originalError = error;
        enhancedError.context = {
            challengeId: challenge._id,
            essayLength: essayText.length,
            rubricSize: challenge.rubric.length
        };
        throw enhancedError;
    }
}
