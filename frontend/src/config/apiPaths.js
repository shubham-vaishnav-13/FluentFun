export const API_PATHS = {
  AUTH: {
    LOGIN: '/users/login',
    REGISTER: '/users/register',
    LOGOUT: '/users/logout',
    GET_PROFILE: '/users/me',
    UPDATE_PROFILE: '/users/me',
    UPLOAD_IMAGE: '/users/upload-image',
  },
  CONTENT: {
    GET_QUIZZES: '/content/quizzes',
    GET_QUIZ: (id) => `/content/quizzes/${id}`,
    GET_RANDOM_QUIZ: '/content/quizzes/random',
    ATTEMPT_QUIZ: (id) => `/content/quizzes/${id}/attempt`,
    GET_PROGRESSION: '/content/quizzes/progression',
    GET_NEXT_QUIZ: (id) => `/content/quizzes/${id}/next`,
    GET_LANGUAGES: '/content/languages',
    GET_WRITING_CHALLENGES: '/content/writing-challenges',
    GET_WRITING_CHALLENGE: (id) => `/content/writing-challenges/${id}`,
    SUBMIT_WRITING: (id) => `/content/writing-challenges/${id}/submit`,
  },
  ADMIN: {
    DASHBOARD_STATS: '/admin/dashboard/stats',
    // User Management
    GET_USERS: '/admin/users',
    UPDATE_USER_STATUS: (id) => `/admin/users/${id}/status`,
    DELETE_USER: (id) => `/admin/users/${id}`,
    // Quiz Management
    GET_QUIZZES: '/admin/quizzes',
    CREATE_QUIZ: '/admin/quizzes',
    UPDATE_QUIZ: (id) => `/admin/quizzes/${id}`,
    DELETE_QUIZ: (id) => `/admin/quizzes/${id}`,
    // Writing Challenge Management
    GET_WRITING_CHALLENGES: '/admin/writing-challenges',
    CREATE_WRITING_CHALLENGE: '/admin/writing-challenges',
    UPDATE_WRITING_CHALLENGE: (id) => `/admin/writing-challenges/${id}`,
    DELETE_WRITING_CHALLENGE: (id) => `/admin/writing-challenges/${id}`,
    // Generators (n8n)
    GENERATE_QUIZZES: '/admin/generator/quizzes',
    GENERATE_WRITING_CHALLENGES: '/admin/generator/writing',
  },
  LEADERBOARD: {
    GET: '/users/leaderboard',
  },
  SUBMISSION: {
    GET_ALL: '/submissions',
    GET_ONE: (id) => `/submissions/${id}`,
    CREATE: '/submissions',
    UPDATE: (id) => `/submissions/${id}`,
  },
};
