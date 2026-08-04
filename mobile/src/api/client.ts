import axios from 'axios';
import { Platform } from 'react-native';

const baseURL = 'http://10.252.145.66:5001/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
