import React, { useState, useEffect } from 'react';
import { Menu, X, Home, FileText, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfileAvatar from './ProfileAvatar';
import { isAuthenticated } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeItem, setActiveItem] = useState('Home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const menuItems = [
    { name: 'Home', icon: Home, path: '/' },
        ...(isLoggedIn ? [{ name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' }] : []),
    { name: 'Report Issues', icon: AlertCircle, path: '/report' },
    { name: 'My Issues', icon: FileText, path: '/view' },
  ];

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check authentication status
    setIsLoggedIn(isAuthenticated());
  }, []);

  const handleLoginClick = () => {
    navigate('/signin');
  };

  return (
    <nav
      className={`fixed top-0 left-0 z-50 transition-all duration-300 
        ${isScrolled
          ? 'top-2 left-1/2 transform -translate-x-1/2 w-[90%] rounded-2xl'
          : 'w-full rounded-none'}
        bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 shadow-2xl`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 to-white bg-clip-text text-transparent">
                EaiserAI
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="ml-10 flex items-baseline space-x-8">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      setActiveItem(item.name);
                      if (item.path) navigate(item.path);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                      activeItem === item.name
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/30'
                        : 'text-gray-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Login or Profile Avatar */}
            <div className="ml-6">
              {isLoggedIn ? (
                <ProfileAvatar />
              ) : (
                <button 
                  onClick={handleLoginClick}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 hover:shadow-xl"
                >
                  Login
                </button>
              )}
            </div>
            </div>
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-200 hover:text-white transition-colors duration-200"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
       </div>
 
       {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-gradient-to-b from-blue-900/95 to-indigo-900/95 backdrop-blur-lg border-t border-white/20 shadow-2xl z-50">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveItem(item.name);
                    setIsMenuOpen(false);
                    if (item.path) navigate(item.path);
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-left transition-all duration-300 ${
                    activeItem === item.name
                      ? 'bg-white/20 text-white shadow-lg border border-white/30'
                      : 'text-gray-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <IconComponent size={20} />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}

            {/* Mobile Login/Profile */}
            {isLoggedIn ? (
              <div className="w-full mt-2 flex justify-center">
                <ProfileAvatar />
              </div>
            ) : (
              <button 
                onClick={handleLoginClick}
                className="w-full mt-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-semibold rounded-full shadow-lg hover:scale-105 transform transition-transform duration-300 hover:shadow-xl"
              >
                Login
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
