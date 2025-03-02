import axios from "axios";

const API_URL = "http://localhost:5050/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add JWT token to all requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/users/login", { email, password });
    return response.data;
  },
  register: async (username, email, password) => {
    const response = await api.post("/users/register", {
      username,
      email,
      password,
    });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};

export const userService = {
  getUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },
};

export const conversationService = {
  getConversations: async () => {
    const response = await api.get("/conversations");
    return response.data;
  },
  createConversation: async (participantId) => {
    const response = await api.post("/conversations", { participantId });
    return response.data;
  },
  getMessages: async (conversationId) => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data;
  },
};

export const messageService = {
  sendMessage: async (conversationId, content) => {
    const response = await api.post("/messages", { conversationId, content });
    return response.data;
  },
  markAsRead: async (messageId) => {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
  },
};

export default api;
