import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useTempAuth() {
  const { login } = useAuth();

  useEffect(() => {
    const checkTempCredentials = async () => {
      const tempCredentials = localStorage.getItem('tempCredentials');
      
      if (tempCredentials) {
        try {
          const { email, password } = JSON.parse(tempCredentials);
          
          // Authenticate with temporary credentials
          await login(email, password);
          
          // Clear temporary credentials after successful authentication
          localStorage.removeItem('tempCredentials');
          
          console.log('Auto-authenticated with temporary credentials');
        } catch (error) {
          console.error('Failed to authenticate with temporary credentials:', error);
          // Clear invalid credentials
          localStorage.removeItem('tempCredentials');
        }
      }
    };

    checkTempCredentials();
  }, [login]);
}
