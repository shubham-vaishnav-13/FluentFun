export const LEVEL_XP_GAP = 250;

// Compute current level (Level 1 starts at 0 XP; each level requires +250 XP)
export function computeLevel(xp = 0) {
  const safeXP = Number.isFinite(xp) ? xp : 0;
  return Math.floor(Math.max(0, safeXP) / LEVEL_XP_GAP) + 1;
}

// Return boundaries and progress of current level
export function levelBoundaries(xp = 0) {
  const level = computeLevel(xp);
  const currentLevelXP = (level - 1) * LEVEL_XP_GAP;
  const nextLevelXP = level * LEVEL_XP_GAP;
  const span = nextLevelXP - currentLevelXP || LEVEL_XP_GAP;
  const progressPercent = Math.min(100, Math.max(0, ((xp - currentLevelXP) / span) * 100));
  return { level, currentLevelXP, nextLevelXP, progressPercent };
}

// Convenience for UI chips
export function xpToNextLevel(xp = 0) {
  const { nextLevelXP } = levelBoundaries(xp);
  return Math.max(0, nextLevelXP - xp);
}
