import { useAuth } from '@clerk/clerk-react';
import { useCustomAuth } from '../context/AuthContext';

/**
 * Custom hook that returns the authentication token
 * Works with both Clerk and custom auth
 * @returns {Function} getAuthToken - Async function that returns the current auth token
 */
export const useAuthToken = () => {
  const { getToken: getClerkToken } = useAuth();
  const { token: customToken } = useCustomAuth();

  const getAuthToken = async () => {
    const clerkToken = await getClerkToken();
    return clerkToken || customToken;
  };

  return { getAuthToken };
};
