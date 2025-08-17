import { useAuth } from '../components/AuthContext';
import config from './Configuration';

export default function useApi() {
  const { token, logout } = useAuth();

  const authFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const isAbsoluteUrl = url.startsWith('http');
    const fullUrl = isAbsoluteUrl ? url : `${config.apiBaseUrl}${url}`;
    
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : null,
      });

      if (response.status === 401) {
        logout();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch (e) {
          errorBody = { message: await response.text() };
        }
        throw new Error(errorBody.message || `Request failed (${response.status})`);
      }

      return response.json();
    } catch (err) {
      console.error('API request failed:', err.message);
      throw err;
    }
  };

  return { authFetch };
}