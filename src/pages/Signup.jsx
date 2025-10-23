import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkElegantBackground from '../components/DarkElegantBackground';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isSignIn, setIsSignIn] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle Signup/Login submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent page reload
    setLoading(true);

    try {
      const endpoint = isSignIn ? 'login' : 'signup';
      const payload = isSignIn ? { email, password } : { name, email, password };

      const res = await fetch(`http://localhost:5000/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        // Save JWT token in localStorage
        localStorage.setItem('token', data.token);
        // Store user data for profile avatar
        localStorage.setItem('userData', JSON.stringify(data.user));
        console.log(`${isSignIn ? 'Login' : 'Signup'} successful:`, data.user);
        alert(`${isSignIn ? 'Login' : 'Signup'} successful!`);

        // Redirect to your main app page
        navigate('/'); // changed from '/snapfix' to '/'
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (err) {
      setLoading(false);
      console.error('Error:', err);
      alert('Failed to connect to backend');
    }
  };

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <div className="relative min-h-screen">
      <DarkElegantBackground />
      <div className="absolute inset-0 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
          {/* Logo - Reduced size */}
          <div className="flex justify-center mb-6">
            <div className="w-10 h-12 bg-gradient-to-br from-gray-200 to-white rounded-lg transform rotate-12"></div>
          </div>

          {/* Heading - Reduced sizes */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              Where ideas
            </h1>
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              <span className="text-white">become </span>
              <span className="text-green-500">reality</span>
            </h1>
            <p className="text-gray-300 text-sm">
              {isSignIn ? (
                <>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setIsSignIn(false)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsSignIn(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Form */}
          <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Name Input - Only show on Sign Up */}
            {!isSignIn && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-full py-2.5 pl-12 pr-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                  required
                />
              </div>
            )}

            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-full py-2.5 pl-12 pr-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-full py-2.5 pl-12 pr-4 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-gray-500 transition-colors text-sm"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full bg-white text-black font-semibold py-2.5 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mt-4 text-sm ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? 'Please wait...' : isSignIn ? 'Sign In' : 'Get Started'}
              {!loading && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>

            {/* Go Back Button */}
            <button
              type="button"
              onClick={handleGoBack}
              className="w-full bg-transparent text-gray-400 font-medium py-2.5 rounded-full border border-gray-700 hover:bg-gray-800 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Go Back
            </button>
          </form>

          {/* Terms and Privacy - Reduced size and spacing */}
          <div className="text-center mt-6 text-xs text-gray-500">
            By continuing, you agree to our{' '}
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Terms of Service
            </a>
            <br />
            and{' '}
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
