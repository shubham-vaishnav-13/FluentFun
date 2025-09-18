import api from '../config/api.config';

export const writingAPI = {
    // Admin Endpoints
    createChallenge: async (data) => {
        const res = await api.post('/admin/writing-challenges', data);
        return res.data.data;
    },

    updateChallenge: async (id, data) => {
        const res = await api.patch(`/admin/writing-challenges/${id}`, data);
        return res.data.data;
    },

    deleteChallenge: async (id) => {
        const res = await api.delete(`/admin/writing-challenges/${id}`);
        return res.data.data;
    },

    listAllChallenges: async () => {
        const res = await api.get('/admin/writing-challenges');
        return res.data.data.challenges || [];
    },

    // User Endpoints
    listAvailableChallenges: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const res = await api.get(`/content/writing-challenges?${params}`);
        return res.data.data.challenges || [];
    },

    getChallenge: async (id) => {
        const res = await api.get(`/content/writing-challenges/${id}`);
        return res.data.data;
    },

    submitChallenge: async (challengeId, text) => {
        const res = await api.post(`/challenges/${challengeId}/submissions`, { text });
        return res.data.data;
    },

    listMySubmissions: async (challengeId) => {
        const res = await api.get(`/challenges/${challengeId}/submissions/mine`);
        return res.data.data;
    },

    getLeaderboard: async (challengeId) => {
        const res = await api.get(`/challenges/${challengeId}/leaderboard`);
        return res.data.data;
    },

    listAvailableWritingLanguages: async () => {
        const res = await api.get('/content/writing-challenges/languages/available');
        return res.data.data.languages || [];
    }
};