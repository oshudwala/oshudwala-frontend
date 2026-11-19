// Compatibility layer: Re-export centralized API client
export { apiClient, API_BASE_URL, tokenStorage, onSessionExpired } from './api/client';
import { apiClient } from './api/client';
export default apiClient;
