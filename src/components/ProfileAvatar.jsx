import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isGuestUser } from '../utils/auth';

const ProfileAvatar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user name from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const user = JSON.parse(storedUserData);
          setUserName(user.name || '');
          setIsGuest(isGuestUser());
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleAvatarClick = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleProfile = () => {
    setIsDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setIsDropdownOpen(false);
    navigate('/auth');
  };

  const getInitial = () => {
    return userName ? userName.charAt(0).toUpperCase() : 'G';
  };

  const getAvatarStyle = () => {
    if (isGuest) {
      return "w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:from-gray-600 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2";
    }
    return "w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm hover:from-purple-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2";
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar */}
      <button
        onClick={handleAvatarClick}
        className={getAvatarStyle()}
      >
        {getInitial()}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
            <p className="font-medium">{userName}</p>
            <p className="text-xs text-gray-500">
              {isGuest ? 'Guest user' : 'View your profile'}
            </p>
          </div>
          
          <button
            onClick={handleProfile}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
