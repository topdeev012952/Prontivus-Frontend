// Utility to test authentication flow
export const testAuthFlow = async () => {
  console.log('🧪 Testing Authentication Flow...');
  
  // Check if token exists
  const token = localStorage.getItem('access_token');
  console.log('📱 Token in localStorage:', token ? 'Present' : 'Missing');
  
  if (token) {
    console.log('🔑 Token preview:', token.substring(0, 50) + '...');
    
    // Test API call
    try {
      const response = await fetch('https://prontivus-backend-wnw2.onrender.com/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User Data:', userData);
        return { success: true, user: userData };
      } else {
        const errorData = await response.text();
        console.log('❌ API Error:', errorData);
        return { success: false, error: errorData };
      }
    } catch (error) {
      console.log('💥 Network Error:', error);
      return { success: false, error: error };
    }
  } else {
    console.log('⚠️ No token found - user needs to login');
    return { success: false, error: 'No authentication token' };
  }
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testAuthFlow = testAuthFlow;
}
