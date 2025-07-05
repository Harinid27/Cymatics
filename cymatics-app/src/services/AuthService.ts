/**
 * Authentication Service
 * Handles all authentication-related operations
 */

import ApiService from './ApiService';
import envConfig from '../config/environment';

// Types
export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  links?: string[];
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    refreshToken?: string;
    user: User;
  };
  error?: string;
}

export interface ProfileUpdateData {
  username?: string;
  email?: string;
  name?: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  links?: string[];
}

class AuthService {
  /**
   * Send OTP to email
   */
  async sendOTP(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await ApiService.sendOTP(email);

      return {
        success: response.success,
        message: response.message || 'OTP sent successfully',
        error: response.error,
      };
    } catch (error) {
      console.error('Send OTP error:', error);
      return {
        success: false,
        error: 'Failed to send OTP. Please try again.',
      };
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await ApiService.verifyOTP(email, otp);

      if (response.success && response.data) {
        return {
          success: true,
          message: 'Authentication successful',
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.error || 'Invalid OTP. Please try again.',
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      return {
        success: false,
        error: 'Failed to verify OTP. Please try again.',
      };
    }
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User | null> {
    try {
      const response = await ApiService.getProfile();

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to fetch profile:', response.error);
      return null;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updateData: ProfileUpdateData): Promise<User | null> {
    try {
      const response = await ApiService.updateProfile(updateData);

      if (response.success && response.data) {
        return response.data;
      }

      console.error('Failed to update profile:', response.error);
      return null;
    } catch (error) {
      console.error('Profile update error:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await ApiService.refreshAuthToken();

      if (response.success) {
        return { success: true };
      }

      return {
        success: false,
        error: response.error || 'Failed to refresh token',
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Failed to refresh token. Please try again.',
      };
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    const token = this.getAuthToken();
    if (!token) return true;

    try {
      // Decode JWT token to check expiry
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token expires within next 5 minutes
      return payload.exp <= (currentTime + 300);
    } catch (error) {
      console.error('Token parsing error:', error);
      return true;
    }
  }

  /**
   * Get token expiry time
   */
  getTokenExpiryTime(): Date | null {
    const token = this.getAuthToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return new Date(payload.exp * 1000);
    } catch (error) {
      console.error('Token parsing error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return ApiService.isAuthenticated();
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return ApiService.getAuthToken();
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): { isValid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }

    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }

    return { isValid: true };
  }

  /**
   * Validate OTP format
   */
  validateOTP(otp: string): { isValid: boolean; error?: string } {
    if (!otp) {
      return { isValid: false, error: 'OTP is required' };
    }

    if (!/^\d{6}$/.test(otp)) {
      return { isValid: false, error: 'OTP must be a 6-digit number' };
    }

    return { isValid: true };
  }

  /**
   * Format phone number for display
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX for US numbers
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }

    // For international numbers, just add spaces
    if (cleaned.length > 10) {
      return cleaned.replace(/(\d{3})/g, '$1 ').trim();
    }

    return phone;
  }

  /**
   * Validate phone number
   */
  validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' };
    }

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length < 10) {
      return { isValid: false, error: 'Phone number must be at least 10 digits' };
    }

    return { isValid: true };
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: User): string {
    if (user.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return names[0][0].toUpperCase();
    }

    if (user.email) {
      return user.email[0].toUpperCase();
    }

    return 'U';
  }

  /**
   * Get user display name
   */
  getUserDisplayName(user: User): string {
    if (user.name) {
      return user.name;
    }

    // Extract name from email if no name is set
    const emailName = user.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  /**
   * Check if profile is complete
   */
  isProfileComplete(user: User): boolean {
    return !!(user.name && user.phone);
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(user: User): number {
    let completed = 0;
    const total = 4; // email, name, phone, profileImage

    if (user.email) completed++;
    if (user.name) completed++;
    if (user.phone) completed++;
    if (user.profileImage) completed++;

    return Math.round((completed / total) * 100);
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid OTP': 'The OTP you entered is incorrect. Please try again.',
      'OTP expired': 'Your OTP has expired. Please request a new one.',
      'Email not found': 'No account found with this email address.',
      'Too many attempts': 'Too many failed attempts. Please try again later.',
      'Network error': 'Network error. Please check your connection and try again.',
      'Server error': 'Server error. Please try again later.',
    };

    return errorMap[error] || error || 'An unexpected error occurred. Please try again.';
  }
}

export default new AuthService();
