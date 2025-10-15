export const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const apiUrl = import.meta.env.VITE_REACT_APP_API_URL; // should be http://localhost:5000/api/auth
    if (!apiUrl) throw new Error('VITE_REACT_APP_API_URL not set');

    const res = await fetch(`${apiUrl}/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('getCurrentUser error:', err);
    return null;
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
