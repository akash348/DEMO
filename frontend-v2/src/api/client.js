import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/pragati-api/v1",
  timeout: 10000
});

export default api;
