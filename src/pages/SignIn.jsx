import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AuthLanding() {
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google OAuth script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      console.log('Google response received:', response);
      
      // Decode the JWT token from Google
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('Decoded payload:', payload);
      
      const googleUserData = {
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        picture: payload.picture
      };

      console.log('Sending to backend:', googleUserData);

      // Send to your backend
      const res = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(googleUserData)
      });

      const data = await res.json();
      console.log('Backend response:', data);

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        console.log('Google login successful:', data.user);
        alert('Google login successful!');
        navigate('/');
      } else {
        console.error('Backend error:', data);
        alert(data.error || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      alert('Failed to authenticate with Google: ' + error.message);
    }
  };

  const handleEmailSignup = () => {
    navigate('/auth');
  };

  const handleGoogleSignup = () => {
    try {
      if (window.google && window.google.accounts) {
        // Simple prompt without button rendering
        window.google.accounts.id.prompt((notification) => {
          console.log('Prompt notification:', notification);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log('Prompt was not displayed or was skipped');
            alert('Google sign-in popup was blocked or not displayed. Please check your popup blocker settings.');
          }
        });
      } else {
        console.error('Google OAuth not loaded properly');
        alert('Google OAuth is not ready. Please refresh the page and try again.');
      }
    } catch (error) {
      console.error('Google signup error:', error);
      alert('Error initializing Google OAuth: ' + error.message);
    }
  };

  const handleAppleSignup = () => {
    console.log('Continue with Microsoft clicked');
    // Add Microsoft OAuth logic here
  };

  const handleGuestContinue = () => {
    console.log('Continue as Guest clicked');
    // Create guest user data
    const guestUserData = {
      name: 'Guest',
      email: 'Not provided',
      isGuest: true,
      createdAt: new Date().toISOString()
    };
    
    // Store guest token and user data
    localStorage.setItem('token', 'guest-token');
    localStorage.setItem('userData', JSON.stringify(guestUserData));
    
    // Navigate to home page
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-12 h-16 bg-gradient-to-br from-gray-200 to-white rounded-lg transform rotate-12"></div>
        </div>

        {/* Heading */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Where ideas
          </h1>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="text-white">become </span>
            <span className="text-green-500">reality</span>
          </h1>
          <p className="text-gray-300 text-lg">
            Already have an account?{' '}
            <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
              Sign in
            </a>
          </p>
        </div>

        {/* Auth Options */}
        <div className="space-y-4">
          {/* Continue with Google - Simple hover effect with reduced width */}
          <div className="flex justify-center">
            <button
              onClick={handleGoogleSignup}
              className="w-4/5 bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>
          {/* Hidden div for Google button rendering */}
          <div id="google-signin-button" style={{ display: 'none' }}></div>

          {/* Microsoft button instead of Apple */}
          <div className="flex justify-center">
            <button
              onClick={handleAppleSignup}
              className="w-full max-w-xs bg-gray-900 text-white font-medium py-3 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center border border-gray-800"
            >
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
              </svg>
              Continue with Microsoft
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-gray-600 text-sm">Or start with email</span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Sign up with Email */}
          <button
            onClick={handleEmailSignup}
            className="w-full bg-transparent text-green-500 font-semibold py-3 rounded-full border-2 border-green-500 hover:bg-green-500 hover:text-black transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Sign up with Email
          </button>

          {/* Continue as Guest */}
          <button
            onClick={handleGuestContinue}
            className="w-full bg-transparent text-gray-400 font-medium py-3 rounded-full border border-gray-700 hover:bg-gray-900 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Continue as Guest
          </button>
        </div>

        {/* Terms and Privacy */}
        <div className="text-center mt-8 text-sm text-gray-600">
          By continuing, you agree to our{' '}
          <a href="#" className="text-white hover:text-gray-300 transition-colors">
            Terms of Service
          </a>
          <br />
          and{' '}
          <a href="#" className="text-white hover:text-gray-300 transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}