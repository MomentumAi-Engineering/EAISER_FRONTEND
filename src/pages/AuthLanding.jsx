export default function AuthLanding() {
  const handleEmailSignup = () => { window.location.href = '/auth'; };
  const handleGoogleSignup = () => { console.log('Continue with Google clicked'); };
  const handleGithubSignup = () => { console.log('Continue with GitHub clicked'); };
  const handleAppleSignup = () => { console.log('Continue with Apple clicked'); };
  const handleGuestContinue = () => { console.log('Continue as Guest clicked'); };

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
            Already have an account?{' '}<a href="/auth" className="text-green-500 hover:underline">Sign in</a>
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <button onClick={handleGoogleSignup} className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors">Continue with Google</button>
          <button onClick={handleGithubSignup} className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors">Continue with GitHub</button>
          <button onClick={handleAppleSignup} className="w-full py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors">Continue with Apple</button>
          <button onClick={handleEmailSignup} className="w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors">Sign up with Email</button>
          <button onClick={handleGuestContinue} className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors">Continue as Guest</button>
        </div>
      </div>
    </div>
  );
}
