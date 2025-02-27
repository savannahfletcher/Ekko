import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000'; // Change this if needed

export const fetchMessage = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api`);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
};