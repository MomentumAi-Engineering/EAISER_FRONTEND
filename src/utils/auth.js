export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  // Handle guest users
  if (token === 'guest-token') {
    return getStoredUserData();
  }

  try {
    const apiUrl = import.meta.env.VITE_REACT_APP_API_URL; // should be http://localhost:5000/api/auth
    if (!apiUrl) throw new Error('VITE_REACT_APP_API_URL not set');

    const res = await fetch(`${apiUrl}/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) {
      // If token is invalid, try to get stored user data for Google users
      const storedUser = getStoredUserData();
      if (storedUser && storedUser.isGoogleUser) {
        return storedUser;
      }
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('getCurrentUser error:', err);
    // Fallback to stored data for offline access
    return getStoredUserData();
  }
};

// Helper function to check if user is logged in
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Helper function to get user data from localStorage
export const getStoredUserData = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Helper function to check if user is a guest
export const isGuestUser = () => {
  const token = localStorage.getItem('token');
  return token === 'guest-token';
};

// Helper function to check if user is Google authenticated
export const isGoogleUser = () => {
  const userData = getStoredUserData();
  return userData && userData.isGoogleUser;
};
