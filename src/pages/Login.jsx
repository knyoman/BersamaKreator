import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faSpinner, faUserCircle, faSignOutAlt, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { signIn, signOut } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { authLogger } from '../utils/logger';

const formatLoginError = (err) => {
  const message = err?.message || 'Terjadi kesalahan saat login';

  if (message === 'Failed to fetch' || message.includes('NetworkError') || message.includes('timed out')) {
    return 'Gangguan jaringan: koneksi ke server gagal. Periksa koneksi Anda lalu coba lagi.';
  }

  if (message.includes('Email not confirmed')) {
    return 'Konfirmasi alamat email Anda sebelum login. Periksa inbox dan folder spam.';
  }

  if (message.includes('Invalid login credentials')) {
    return 'Email atau password salah.';
  }

  return message;
};

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
            <h2 className="text-2xl font-bold text-gray-900">Selamat datang kembali!</h2>
            <p className="text-gray-600 mt-2">Anda sedang login sebagai:</p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-900">{userProfile.name}</p>
              <p className="text-sm text-gray-500">{userProfile.email}</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              <p className="font-bold mb-1">Gagal Keluar</p>
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              Lanjut ke Dasbor
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            
            <button 
              onClick={async () => {
                setLoading(true);
                setError(null);

                const { error: signOutError } = await signOut();
                if (signOutError) {
                  setError(formatLoginError(signOutError));
                  setLoading(false);
                  return;
                }

                // window.location.reload() helps clear any state cleanly
                window.location.reload();
              }}
              className="btn btn-outline w-full flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Ganti Akun (Keluar)
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
      const { data, error: signInError } = await signIn(formData.email, formData.password);

      if (signInError) {
        throw new Error(signInError.message || 'Login gagal. Periksa kembali kredensial Anda.');
      }

      if (!data?.user) {
        throw new Error('Login gagal. Coba lagi.');
      }

      // AuthContext handles profile loading after the auth event completes.
      navigate('/dashboard');
    } catch (err) {
      authLogger.error('Login error:', err.message);
      setError(formatLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Selamat Datang Kembali</h1>
          <p className="text-gray-600">Masuk ke akun BersamaKreator Anda</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className={`border px-4 py-3 rounded-lg text-sm ${
                error.includes('Gangguan jaringan')
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <p className="font-bold mb-1">
                  {error.includes('Gangguan jaringan') ? 'Masalah Koneksi' : 'Login Gagal'}
                </p>
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Alamat Email</label>
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
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Sedang masuk...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">atau</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link to="/register" className="font-medium text-gray-900 hover:underline">
                Daftar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
