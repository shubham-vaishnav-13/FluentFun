import api from '../config/api.config';
import { API_PATHS } from '../config/apiPaths';

// Admin API Service
class AdminAPI {
  // Dashboard Stats
  static async getDashboardStats() {
    try {
      const response = await api.get(API_PATHS.ADMIN.DASHBOARD_STATS);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // User Management
  static async getAllUsers(params = {}) {
    try {
      const response = await api.get(API_PATHS.ADMIN.GET_USERS, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async updateUserStatus(userId, statusData) {
    try {
      const response = await api.patch(API_PATHS.ADMIN.UPDATE_USER_STATUS(userId), statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async deleteUser(userId) {
    try {
      const response = await api.delete(API_PATHS.ADMIN.DELETE_USER(userId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Quiz Management
  static async getAllQuizzes(params = {}) {
    try {
      const response = await api.get(API_PATHS.ADMIN.GET_QUIZZES, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async createQuiz(quizData) {
    try {
      const response = await api.post(API_PATHS.ADMIN.CREATE_QUIZ, quizData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async updateQuiz(quizId, quizData) {
    try {
      const response = await api.patch(API_PATHS.ADMIN.UPDATE_QUIZ(quizId), quizData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async deleteQuiz(quizId) {
    try {
      const response = await api.delete(API_PATHS.ADMIN.DELETE_QUIZ(quizId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Writing Challenge Management
  static async getAllWritingChallenges(params = {}) {
    try {
      const response = await api.get(API_PATHS.ADMIN.GET_WRITING_CHALLENGES, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async createWritingChallenge(challengeData) {
    try {
      const response = await api.post(API_PATHS.ADMIN.CREATE_WRITING_CHALLENGE, challengeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async updateWritingChallenge(challengeId, challengeData) {
    try {
      const response = await api.patch(API_PATHS.ADMIN.UPDATE_WRITING_CHALLENGE(challengeId), challengeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async deleteWritingChallenge(challengeId) {
    try {
      const response = await api.delete(API_PATHS.ADMIN.DELETE_WRITING_CHALLENGE(challengeId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  // Generators (n8n)
  static async generateQuizzes(payload = {}) {
    try {
      const response = await api.post(API_PATHS.ADMIN.GENERATE_QUIZZES, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }

  static async generateWritingChallenges(payload = {}) {
    try {
      const response = await api.post(API_PATHS.ADMIN.GENERATE_WRITING_CHALLENGES, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
}

export default AdminAPI;
