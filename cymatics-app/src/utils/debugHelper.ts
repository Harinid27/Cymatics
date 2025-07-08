import ApiService from '../services/ApiService';
import envConfig from '../config/environment';

export const debugNetworkConnectivity = async () => {
  console.log('🔍 Starting network connectivity debug...');
  
  // Log current configuration
  console.log('📋 Current Configuration:');
  console.log('  - API Base URL:', envConfig.API_BASE_URL);
  console.log('  - Environment:', process.env.NODE_ENV);
  console.log('  - Debug Mode:', envConfig.DEBUG_MODE);
  
  try {
    // Test 1: Direct fetch to health endpoint
    console.log('🧪 Test 1: Direct fetch to health endpoint');
    const healthUrl = `${envConfig.API_BASE_URL}/health`;
    console.log('  URL:', healthUrl);
    
    const healthResponse = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('  Health Response Status:', healthResponse.status);
    const healthData = await healthResponse.text();
    console.log('  Health Response Data:', healthData);
    
    // Test 2: Send OTP (this should work)
    console.log('🧪 Test 2: Send OTP');
    const otpResponse = await ApiService.post('/api/auth/send-otp', {
      email: 'test@example.com'
    }, false);
    console.log('  OTP Response:', otpResponse);
    
    // Test 3: Projects endpoint (should fail without auth)
    console.log('🧪 Test 3: Projects endpoint (no auth)');
    const projectsResponse = await ApiService.get('/api/projects', {}, false);
    console.log('  Projects Response:', projectsResponse);
    
    return {
      success: true,
      health: { status: healthResponse.status, data: healthData },
      otp: otpResponse,
      projects: projectsResponse
    };
    
  } catch (error) {
    console.error('❌ Network debug failed:', error);
    return {
      success: false,
      error: error
    };
  }
};

export const logAppInfo = () => {
  console.log('📱 App Information:');
  console.log('  - App Version:', '1.0.0');
  console.log('  - Build Type:', __DEV__ ? 'Development' : 'Production');
  console.log('  - API URL:', envConfig.API_BASE_URL);
  console.log('  - Auth Token Present:', !!ApiService.getAuthToken());
}; 