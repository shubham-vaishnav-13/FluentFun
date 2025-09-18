import api from '../config/api.config';

export async function fetchLeaderboard({ limit = 50 } = {}) {
  const { data } = await api.get(`/users/leaderboard`, { params: { limit } });
  return data?.data || { leaderboard: [], currentUserRank: null };
}
