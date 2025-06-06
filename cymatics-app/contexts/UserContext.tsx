import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AuthService, { User } from '../src/services/AuthService';

export interface UserData {
  id?: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  links: string[];
  profileImage?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserContextType {
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  updateUserData: (data: Partial<UserData>) => void;
  setProfileImage: (imageUri: string) => void;
  login: (email: string, otp: string) => Promise<boolean>;
  sendOTP: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<boolean>;
  isTokenExpired: () => boolean;
  getTokenExpiryTime: () => Date | null;
}

// Remove hardcoded default data - will be loaded from API

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Set up token expiry monitoring
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiry = () => {
      if (AuthService.isTokenExpired()) {
        handleTokenExpiry();
      }
    };

    // Check token expiry every minute
    const interval = setInterval(checkTokenExpiry, 60000);

    // Check immediately
    checkTokenExpiry();

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      if (AuthService.isAuthenticated()) {
        const profile = await AuthService.getProfile();

        if (profile) {
          setUserData(mapUserToUserData(profile));
          setIsAuthenticated(true);
        } else {
          // Token might be invalid, clear it
          await AuthService.logout();
          setIsAuthenticated(false);
          setUserData(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserData(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const mapUserToUserData = (user: User): UserData => {
    return {
      id: user.id,
      name: user.name || AuthService.getUserDisplayName(user),
      username: user.username || `@${user.email.split('@')[0]}`,
      email: user.email,
      bio: user.bio || 'Cymatics Team Member',
      links: user.links || ['Cymatics.in'],
      profileImage: user.profileImage,
      phone: user.phone,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  };

  const sendOTP = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthService.sendOTP(email);

      if (!result.success) {
        setError(result.error || 'Failed to send OTP');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Send OTP error:', error);
      setError('Failed to send OTP. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, otp: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await AuthService.verifyOTP(email, otp);

      if (result.success && result.data) {
        setUserData(mapUserToUserData(result.data.user));
        setIsAuthenticated(true);
        return true;
      } else {
        setError(result.error || 'Authentication failed');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await AuthService.logout();
      setUserData(null);
      setIsAuthenticated(false);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      if (!isAuthenticated) return;

      const profile = await AuthService.getProfile();

      if (profile) {
        setUserData(mapUserToUserData(profile));
      }
    } catch (error) {
      console.error('Refresh profile error:', error);
      setError('Failed to refresh profile');
    }
  };

  const updateUserData = async (data: Partial<UserData>): Promise<void> => {
    try {
      if (!isAuthenticated || !userData) return;

      setIsLoading(true);
      setError(null);

      // Update local state immediately for better UX
      setUserData(prev => prev ? { ...prev, ...data } : null);

      // Prepare data for API - only send fields supported by backend
      const updateData: any = {};

      // Map frontend fields to backend fields
      if (data.username) updateData.username = data.username.replace('@', ''); // Remove @ prefix
      if (data.email) updateData.email = data.email;

      // Note: Backend currently doesn't support name, phone, profileImage, bio, links
      // These will be stored locally until backend is updated

      // Only call API if we have supported fields to update
      if (Object.keys(updateData).length > 0) {
        const updatedUser = await AuthService.updateProfile(updateData);

        if (updatedUser) {
          // Merge API response with local data
          const mergedData = {
            ...mapUserToUserData(updatedUser),
            // Preserve local-only fields
            name: data.name || userData.name,
            phone: data.phone || userData.phone,
            profileImage: data.profileImage || userData.profileImage,
            bio: data.bio || userData.bio,
            links: data.links || userData.links,
          };
          setUserData(mergedData);
        } else {
          // Revert local changes if server update failed
          await refreshProfile();
          setError('Failed to update profile');
        }
      } else {
        // Only local updates, no API call needed
        console.log('Profile updated locally (backend doesn\'t support these fields yet)');
      }
    } catch (error) {
      console.error('Update user data error:', error);
      setError('Failed to update profile');
      // Revert local changes
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const setProfileImage = async (imageUri: string): Promise<void> => {
    await updateUserData({ profileImage: imageUri });
  };

  const handleTokenExpiry = async (): Promise<void> => {
    try {
      console.log('Token expired, attempting refresh...');

      const refreshResult = await AuthService.refreshToken();

      if (refreshResult.success) {
        console.log('Token refreshed successfully');
        // Refresh user profile to ensure we have latest data
        await refreshProfile();
      } else {
        console.log('Token refresh failed, logging out user');
        setError('Your session has expired. Please log in again.');
        await logout();
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      setError('Your session has expired. Please log in again.');
      await logout();
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const result = await AuthService.refreshToken();

      if (result.success) {
        // Refresh user profile after successful token refresh
        await refreshProfile();
        return true;
      } else {
        setError(result.error || 'Failed to refresh session');
        return false;
      }
    } catch (error) {
      console.error('Manual token refresh error:', error);
      setError('Failed to refresh session');
      return false;
    }
  };

  const isTokenExpired = (): boolean => {
    return AuthService.isTokenExpired();
  };

  const getTokenExpiryTime = (): Date | null => {
    return AuthService.getTokenExpiryTime();
  };

  const clearError = (): void => {
    setError(null);
  };

  return (
    <UserContext.Provider value={{
      userData,
      isAuthenticated,
      isLoading,
      error,
      updateUserData,
      setProfileImage,
      login,
      sendOTP,
      logout,
      refreshProfile,
      clearError,
      refreshToken,
      isTokenExpired,
      getTokenExpiryTime
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
