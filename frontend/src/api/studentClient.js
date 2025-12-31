import axios from "axios";
import { clearStudentToken, getStudentToken } from "../utils/studentAuth.js";

const studentApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1",
  timeout: 10000
});

studentApi.interceptors.request.use((config) => {
  const token = getStudentToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

studentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStudentToken();
    }
    return Promise.reject(error);
  }
);

export default studentApi;
