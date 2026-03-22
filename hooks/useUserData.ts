// hooks/useUserData.ts
'use client';

import { useState, useEffect } from 'react';

interface UserData {
  doctors: any[];
  locations: any[];
  staff: any[];
  topics: any[];
  user: any[];
}

interface UseUserDataReturn {
  data: UserData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  isAuthenticated: boolean;
}

export function useUserData(): UseUserDataReturn {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);

    // Get token from localStorage
    const authToken = localStorage.getItem('sb-klkgjmdmoonuqwlnqvpm-auth-token');

    // If no token, exit early — not an error, just unauthenticated
    if (!authToken) {
      setIsAuthenticated(false);
      setData(null);
      setLoading(false);
      return;
    }

    try {
      const tokenData = JSON.parse(authToken);
      const accessToken = tokenData.access_token;

      const response = await fetch('/api/userData', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      setData(responseData.data);
      setIsAuthenticated(true);
    } catch (err: any) {
      console.error('Unexpected error fetching user data:', err.message);
      setError(err.message);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchUserData,
    isAuthenticated
  };
}

// Example usage in a component:
// const { data, loading, error, refetch } = useUserData();