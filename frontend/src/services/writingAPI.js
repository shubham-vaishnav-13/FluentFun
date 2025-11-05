import api from '../config/api.config';
import { API_PATHS } from '../config/apiPaths';

export const writingAPI = {
    // Admin Endpoints
    createChallenge: async (data) => {
        const res = await api.post(API_PATHS.ADMIN.CREATE_WRITING_CHALLENGE, data);
        return res.data.data;
    },

    updateChallenge: async (id, data) => {
        const res = await api.patch(API_PATHS.ADMIN.UPDATE_WRITING_CHALLENGE(id), data);
        return res.data.data;
    },

    deleteChallenge: async (id) => {
        const res = await api.delete(API_PATHS.ADMIN.DELETE_WRITING_CHALLENGE(id));
        return res.data.data;
    },

    listAllChallenges: async () => {
        const res = await api.get(API_PATHS.ADMIN.GET_WRITING_CHALLENGES);
        return res.data.data.challenges || [];
    },

    // User Endpoints
    listAvailableChallenges: async (filters = {}) => {
        const params = new URLSearchParams(filters);
        const res = await api.get(`${API_PATHS.CONTENT.GET_WRITING_CHALLENGES}?${params}`);
        return res.data.data.challenges || [];
    },

    getChallenge: async (id) => {
        const res = await api.get(`${API_PATHS.CONTENT.GET_WRITING_CHALLENGES}/${id}`);
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