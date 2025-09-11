import api from '../config/api.config';

// Admin API Service
class AdminAPI {
  // Dashboard Stats
  static async getDashboardStats() {
    try {
      const response = await api.get('/admin/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // User Management
  static async getAllUsers(params = {}) {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async updateUserStatus(userId, statusData) {
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async deleteUser(userId) {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Quiz Management
  static async getAllQuizzes(params = {}) {
    try {
      const response = await api.get('/admin/quizzes', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async createQuiz(quizData) {
    try {
      const response = await api.post('/admin/quizzes', quizData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async updateQuiz(quizId, quizData) {
    try {
      const response = await api.patch(`/admin/quizzes/${quizId}`, quizData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async deleteQuiz(quizId) {
    try {
      const response = await api.delete(`/admin/quizzes/${quizId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Speaking Challenge Management
  static async getAllSpeakingChallenges(params = {}) {
    try {
      const response = await api.get('/admin/speaking-challenges', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async createSpeakingChallenge(challengeData) {
    try {
      const response = await api.post('/admin/speaking-challenges', challengeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async updateSpeakingChallenge(challengeId, challengeData) {
    try {
      const response = await api.patch(`/admin/speaking-challenges/${challengeId}`, challengeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async deleteSpeakingChallenge(challengeId) {
    try {
      const response = await api.delete(`/admin/speaking-challenges/${challengeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Writing Challenge Management
  static async getAllWritingChallenges(params = {}) {
    try {
      const response = await api.get('/admin/writing-challenges', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async createWritingChallenge(challengeData) {
    try {
      const response = await api.post('/admin/writing-challenges', challengeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async updateWritingChallenge(challengeId, challengeData) {
    try {
      const response = await api.patch(`/admin/writing-challenges/${challengeId}`, challengeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async deleteWritingChallenge(challengeId) {
    try {
      const response = await api.delete(`/admin/writing-challenges/${challengeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default AdminAPI;
