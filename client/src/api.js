import axios from 'axios';

const api = axios.create({
  // IF we are in production (online), use the online URL.
  // IF we are local, use localhost.
  // For now, we keep localhost until we deploy the server.
  baseURL: 'http://localhost:5000/api', 
});

export default api;