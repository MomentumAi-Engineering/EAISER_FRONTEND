import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import DarkElegantBackground from '../components/DarkElegantBackground';

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

        // Render the actual Google button instead of using prompts
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-div'),
          { 
            theme: 'filled_white',
            size: 'large',
            shape: 'pill',
            text: 'continue_with',
            logo_alignment: 'left'
          }
        );
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
    // This function is no longer needed since we're using the rendered button
    console.log('Custom Google button clicked - but using rendered button instead');
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
              Already have an account?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </a>
            </p>
          </div>

          {/* Auth Options - Reduced spacing */}
          <div className="space-y-3">
            {/* Google Sign-In */}
            <div className="flex justify-center">
              <div 
                id="google-signin-div" 
                className="w-full flex justify-center"
                style={{ display: 'flex', justifyContent: 'center' }}
              ></div>
            </div>

            {/* Fallback custom button (hidden by default) */}
            <div className="flex justify-center" style={{ display: 'none' }}>
              <button
                onClick={handleGoogleSignup}
                className="w-full bg-white text-black font-semibold py-3 rounded-full hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center gap-3"
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

            {/* Divider - Reduced spacing */}
            <div className="flex items-center gap-4 py-3">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-gray-500 text-xs">Or start with email</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            {/* Sign up with Email - Reduced size */}
            <button
              onClick={handleEmailSignup}
              className="w-full bg-transparent text-green-500 font-medium py-2.5 rounded-full border-2 border-green-500 hover:bg-green-500 hover:text-black transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Sign up with Email
            </button>

            {/* Continue as Guest - Reduced size */}
            <button
              onClick={handleGuestContinue}
              className="w-full bg-transparent text-gray-400 font-medium py-2.5 rounded-full border border-gray-600 hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Continue as Guest
            </button>

            {/* Back to Home Button */}
            <button
              onClick={handleGoBack}
              className="w-full bg-transparent text-gray-500 font-medium py-2.5 rounded-full border border-gray-700 hover:bg-gray-800 hover:text-gray-300 transition-colors flex items-center justify-center gap-2 text-sm mt-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Home
            </button>
          </div>

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