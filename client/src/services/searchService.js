import axios from 'axios';

const API_URL = '/api/search';

const globalSearch = async (query) => {
  const response = await axios.get(`${API_URL}?q=${encodeURIComponent(query)}`, {
    withCredentials: true,
  });
  return response.data;
};

const searchService = {
  globalSearch,
};

export default searchService;
