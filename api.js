import axios from "axios";
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get API base URL from environment variables
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || process.env.API_BASE_URL || "https://mimamsabackend.onrender.com/api";

console.log("🌐 API Base URL:", API_BASE_URL);

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to inject X-User-ID header (matching web app pattern)
API.interceptors.request.use(
  async (config) => {
    try {
      const userJson = await AsyncStorage.getItem('@user_session');
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user.id) {
          config.headers['X-User-ID'] = user.id;
        }
      }
    } catch (error) {
      console.error('Error reading user session for interceptor:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔒 Unauthorized - clearing session');
      await AsyncStorage.removeItem('@user_session');
      // Note: Navigation redirect should be handled by the app layer
    }
    return Promise.reject(error);
  }
);

// Cloudinary Upload Functions - Dynamic URLs
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_BASE_URL}/upload/image/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const uploadPDF = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_BASE_URL}/upload/pdf/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const uploadText = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `${API_BASE_URL}/upload/text/`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export { API_BASE_URL };
export default API;
