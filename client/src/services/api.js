import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  withCredentials: true, // ensure cookies (JWT) are sent with every request
});

export default api;
