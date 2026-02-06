import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner, faUserCircle, faSignOutAlt, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { signIn, signOut } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userProfile } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already authenticated, show option to continue or switch account
  if (isAuthenticated && userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-md w-full mx-4 bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUserCircle} className="text-4xl text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-600 mt-2">You are currently logged in as:</p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{userProfile.name}</p>
              <p className="text-sm text-gray-500">{userProfile.email}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              Continue to Dashboard
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            
            <button 
              onClick={async () => {
                setLoading(true);
                await signOut();
                // window.location.reload() helps clear any state cleanly
                window.location.reload();
              }}
              className="btn btn-outline w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Switch Account (Log Out)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await signIn(formData.email, formData.password);

      if (error) {
        setError(error.message || 'Login failed. Please check your credentials.');
        setLoading(false);
      } else if (data?.user) {
        // Login successful, redirect to dashboard
        // AuthContext will handle loading user profile
        navigate('/dashboard');
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      let errorMessage = 'An error occurred during login'
      
      // Handle Network Errors (often caused by AdBlockers)
      if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
        errorMessage = 'Network Error: Connection to server failed. Please disable AdBlock/Extensions or try a different browser.';
      } 
      // Handle Email Not Confirmed
      else if (err.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before logging in. Check your inbox (and spam folder).';
      }
      // Handle Invalid Credentials
      else if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Incorrect email or password.';
      }
      // Standard messages
      else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your BersamaKreator account</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`border px-4 py-3 rounded-lg text-sm ${
                error.includes('Network Error') 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <p className="font-bold mb-1">
                  {error.includes('Network Error') ? '⚠️ Connection Issue' : 'Login Failed'}
                </p>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-gray-900 hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Demo Credentials:</p>
          <p className="text-xs text-gray-600">Email: admin@bersamakreator.com</p>
          <p className="text-xs text-gray-600">Password: password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
