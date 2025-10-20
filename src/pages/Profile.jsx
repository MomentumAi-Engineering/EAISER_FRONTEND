import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredUserData, getCurrentUser, isGuestUser } from '../utils/auth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      // Check if user is guest
      const guestStatus = isGuestUser();
      setIsGuest(guestStatus);
      
      // First try to get from localStorage
      let userData = getStoredUserData();
      
      if (!userData && !guestStatus) {
        // If not in localStorage and not guest, try to fetch from API
        userData = await getCurrentUser();
      }

      if (!userData) {
        // If no user data available, redirect to login
        navigate('/auth');
        return;
      }

      setUserInfo(userData);
      setLoading(false);
    };

    loadUserData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const getAvatarStyle = () => {
    if (isGuest) {
      return "w-20 h-20 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-6";
    }
    return "w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-6";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          {/* Profile Header */}
          <div className="flex items-center mb-8">
            <div className={getAvatarStyle()}>
              {userInfo?.name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome, {userInfo?.name || 'Guest'}
                {isGuest && <span className="text-sm text-gray-500 ml-2">(Guest User)</span>}
              </h1>
              <p className="text-gray-600">{userInfo?.email}</p>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo?.name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <p className="mt-1 text-sm text-gray-900">{userInfo?.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Type</label>
                  <p className="mt-1 text-sm text-gray-900">{isGuest ? 'Guest Account' : 'Registered User'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              <div className="space-y-3">
                {isGuest && (
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full text-left p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    <h3 className="font-medium text-green-900">Create Account</h3>
                    <p className="text-sm text-green-600">Sign up to save your data permanently</p>
                  </button>
                )}
                <button
                  onClick={() => navigate('/')}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">Back to Home</h3>
                  <p className="text-sm text-gray-600">Return to the main page</p>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userData');
                    navigate('/auth');
                  }}
                  className="w-full text-left p-4 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <h3 className="font-medium text-red-900">{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</h3>
                  <p className="text-sm text-red-600">{isGuest ? 'Exit guest session' : 'Sign out of your account'}</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
