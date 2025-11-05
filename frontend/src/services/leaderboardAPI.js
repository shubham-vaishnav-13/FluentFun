import api from '../config/api.config';
import { API_PATHS } from '../config/apiPaths';

export async function fetchLeaderboard({ limit = 50 } = {}) {
  const { data } = await api.get(API_PATHS.LEADERBOARD.GET, { params: { limit } });
  return data?.data || { leaderboard: [], currentUserRank: null };
}
