const LEVEL_XP_GAP = 250;

export function computeLevel(xp = 0) {
  return Math.floor(Math.max(0, xp) / LEVEL_XP_GAP) + 1;
}

export function levelBoundaries(xp = 0) {
  const level = computeLevel(xp);
  const currentLevelXP = (level - 1) * LEVEL_XP_GAP;
  const nextLevelXP = level * LEVEL_XP_GAP;
  const progressPercent = Math.min(100, ((xp - currentLevelXP) / LEVEL_XP_GAP) * 100);
  return { level, currentLevelXP, nextLevelXP, progressPercent };
}

export function xpToNextLevel(xp = 0) {
  return Math.max(0, computeLevel(xp) * LEVEL_XP_GAP - xp);
}
