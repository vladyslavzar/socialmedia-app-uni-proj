import { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: FormData) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for token and load user on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetchCurrentUser();
        } catch {
          localStorage.removeItem('token');
        }
      } else {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const fetchCurrentUser = async () => {
    setLoading(true);
    try {
      const userData = await authService.getCurrentUser();
      setCurrentUser(userData);
    } catch (err) {
      localStorage.removeItem('token');
      setCurrentUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Clear any existing token before login attempt
      localStorage.removeItem('token');
      
      // Call the login API
      const response = await authService.login(username, password);
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server');
      }
      
      // Fetch the current user profile
      await fetchCurrentUser();
      
      return;
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: Partial<User>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Register the user
      const response = await authService.register(userData);
      
      if (!response || !response.token) {
        throw new Error('Invalid response from server');
      }
      
      // Fetch the current user profile
      await fetchCurrentUser();
      
      return;
    } catch (err) {
      setError('Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const updateProfile = async (userData: FormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Update the profile
      const updatedUser = await authService.updateProfile(userData);
      
      // Update the current user state
      setCurrentUser(updatedUser);
      
      return;
    } catch (err) {
      setError('Profile update failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 