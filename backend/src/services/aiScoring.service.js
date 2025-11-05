import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({
    path: './.env',
    quiet: true
});

let genAI = null;

function getGenAI() {
    if (genAI) return genAI;
    
    const key = process.env.GEMINI_API_KEY?.trim();
    
    if (!key || key === 'undefined') {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[AI] GEMINI_API_KEY not configured - heuristic fallback enabled');
            return null;
        }
        throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    
    genAI = new GoogleGenerativeAI(key);
    return genAI;
}

/**
 * Clean JSON response from AI model
 * Removes markdown code blocks and extracts pure JSON
 */

function cleanAIResponse(rawText) {
    if (typeof rawText !== 'string') return null;
    
    // Remove markdown code blocks
    let cleaned = rawText.replace(/^```json\s*/i, '')
                        .replace(/^```\s*/i, '')
                        .replace(/```\s*$/i, '')
                        .trim();
    
    // Extract JSON array/object by finding first { or [ and last } or ]
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    const firstBracket = cleaned.indexOf('[');
    const lastBracket = cleaned.lastIndexOf(']');
    
    // Determine if we have an object or array
    if (firstBrace !== -1 && lastBrace !== -1 && 
        (firstBracket === -1 || firstBrace < firstBracket)) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    } else if (firstBracket !== -1 && lastBracket !== -1) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
    }
    
    return cleaned;
}

/**
 * Safely parse JSON with cleanup
 */
function safeParseJSON(text) {
    try {
        const cleaned = cleanAIResponse(text);
        if (!cleaned) return null;
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('[AI] JSON Parse Error:', error.message);
        console.error('[AI] Raw text:', text.substring(0, 500));
        return null;
    }
}

/**
 * Create evaluation prompt for writing challenge
 */
function createEvaluationPrompt(challenge, essayText) {
    const rubricLines = challenge.rubric
        .map(r => `${r.name} (${r.weight}%): ${r.description || 'No description'}`)
        .join('\n');
    
    return `You are an AI trained to evaluate writing submissions for language learning.

Task:
- Evaluate the essay based on the rubric provided
- Provide scores (0-100) for each rubric category
- Give constructive feedback

Context:
- Challenge: ${challenge.title}
- Language: ${challenge.language}
- Category: ${challenge.category}
- Difficulty: ${challenge.difficulty}
- Word Limit: ${challenge.wordLimit.min}-${challenge.wordLimit.max} words

Rubric:
${rubricLines}

Essay to evaluate:
"""
${essayText}
"""

CRITICAL RULES:
1. Return ONLY valid JSON - no extra text before or after
2. Use double quotes for all strings
3. Escape any double quotes inside strings with backslash
4. The response must be a single JSON object
5. For on-topic, coherent essays, most scores should be 55-75
6. Reserve scores below 30 only for off-topic or incoherent content
7. Avoid being overly harsh - grade proportionally

Required JSON format:
{
    "categories": [
        {
            "key": "rubric category name",
            "score": 70,
            "comment": "Brief feedback for this category"
        }
    ],
    "overallFeedback": "Comprehensive feedback on the essay"
}

Important: Return ONLY the JSON object. No additional text.`;
}

/**
 * Generate heuristic fallback scores when AI is unavailable
 */
function generateHeuristicScores(challenge, essayText) {
    const hash = [...essayText].reduce((a, c) => (a + c.charCodeAt(0)) % 1000, 0);
    
    const categories = challenge.rubric.map((r, i) => {
        const base = (hash + (i * 37)) % 101;
        const adjusted = Math.round((base * 0.7) + (r.weight * 0.3));
        const score = Math.min(100, Math.max(35, adjusted));
        
        return {
            key: r.name,
            label: r.name,
            score,
            comment: `Heuristic score for ${r.name}. Enable GEMINI_API_KEY for AI evaluation.`
        };
    });
    
    return {
        model: 'heuristic-fallback',
        categories,
        overallFeedback: 'Heuristic fallback used. Add GEMINI_API_KEY environment variable for real AI evaluation.',
        fallbackReason: 'NO_API_KEY'
    };
}

/**
 * Validate AI response structure
 */
function validateAIResponse(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('AI response must be an object');
    }

    if (!Array.isArray(data.categories)) {
        throw new Error('AI response must include categories array');
    }

    data.categories.forEach((cat, idx) => {
        if (!cat.key) {
            throw new Error(`Category ${idx} missing key`);
        }
        if (typeof cat.score !== 'number' || cat.score < 0 || cat.score > 100) {
            throw new Error(`Category ${idx} (${cat.key}) has invalid score: ${cat.score}`);
        }
    });

    if (typeof data.overallFeedback !== 'string' || !data.overallFeedback.trim()) {
        throw new Error('AI response missing overallFeedback');
    }

    return true;
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff(fn, retries = 2, baseDelay = 1000) {
    let lastError;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i === retries) break;
            
            const delay = baseDelay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

/**
 * Main evaluation function
 * @param {Object} params
 * @param {Object} params.challenge - Writing challenge object
 * @param {string} params.essayText - User's essay text
 * @returns {Promise<Object>} Evaluation result
 */
export async function evaluateSubmission({ challenge, essayText }) {
    const started = Date.now();
    
    try {
        // Validate rubric
        const invalidRubric = challenge.rubric.find(r => 
            !r.name || typeof r.weight !== 'number' || r.weight < 0 || r.weight > 100
        );
        if (invalidRubric) {
            throw new Error(`Invalid rubric item: ${JSON.stringify(invalidRubric)}`);
        }

        const client = getGenAI();
        
        // Use heuristic fallback if no API key
        if (!client) {
            console.log('[AI] Using heuristic fallback - no API key configured');
            return {
                ...generateHeuristicScores(challenge, essayText),
                processingTimeMs: Date.now() - started
            };
        }

        // Try AI evaluation with retry
        const result = await retryWithBackoff(async () => {
            const prompt = createEvaluationPrompt(challenge, essayText);
            
            const model = client.getGenerativeModel({ 
                model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp"
            });
            
            const generationConfig = {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 4096,
            };
            
            const aiResult = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                generationConfig
            });
            
            const response = aiResult.response;
            const rawText = response.text();
            
            //console.log('[AI] Received response from Gemini');
            
            const parsed = safeParseJSON(rawText);
            
            if (!parsed) {
                throw new Error('Failed to parse AI response as JSON');
            }
            
            validateAIResponse(parsed);
            
            return {
                model: process.env.GEMINI_MODEL || "gemini-2.0-flash-exp",
                categories: parsed.categories.map(cat => ({
                    key: cat.key,
                    label: cat.key,
                    score: Math.round(cat.score),
                    comment: cat.comment || ''
                })),
                overallFeedback: parsed.overallFeedback,
                processingTimeMs: Date.now() - started
            };
        }, 2, 1000);
        
        return result;
        
    } catch (error) {
        //console.error('[AI] Evaluation failed:', error.message);
        
        // Fallback to heuristic on any error
        console.log('[AI] Falling back to heuristic scoring due to error');
        return {
            ...generateHeuristicScores(challenge, essayText),
            processingTimeMs: Date.now() - started,
            error: error.message
        };
    }
}

export default { evaluateSubmission };
