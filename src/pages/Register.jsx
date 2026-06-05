import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { signUp } from '../services/api';

const formatRegistrationError = (message) => {
  if (!message) return 'Registrasi gagal. Coba lagi.';

  if (message.includes('User already registered') || message.includes('already registered')) {
    return 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.';
  }

  if (message.includes('Password should be') || message.includes('Password must')) {
    return 'Password belum memenuhi syarat keamanan.';
  }

  if (message.includes('Invalid email')) {
    return 'Format email tidak valid.';
  }

  return message;
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'sme',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // Validation
      if (!formData.name.trim()) {
        setError('Nama wajib diisi');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Password dan konfirmasi password tidak sama');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password minimal 6 karakter');
        setLoading(false);
        return;
      }

      const userData = {
        name: formData.name.trim(),
        user_type: formData.userType,
      };

      const { data, error } = await signUp(formData.email, formData.password, userData);

      if (error) {
        setError(formatRegistrationError(error.message));
        setLoading(false);
      } else if (data?.user) {
        // Registration successful
        navigate('/login', {
          state: { message: 'Akun berhasil dibuat. Silakan login.' },
        });
      } else {
        setError('Registrasi gagal. Coba lagi.');
        setLoading(false);
      }
    } catch (err) {
      setError(formatRegistrationError(err.message) || 'Terjadi kesalahan saat registrasi');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Buat Akun</h1>
          <p className="text-gray-600">Bergabung dengan BersamaKreator hari ini</p>
        </div>

        <div className="bg-white rounded-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nama Anda"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

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

            {/* User Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Saya adalah...</label>
              <select name="userType" value={formData.userType} onChange={handleChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent">
                <option value="sme">Pemilik Bisnis (UMKM)</option>
                <option value="influencer">Influencer</option>
              </select>
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-600">
              Dengan mendaftar, Anda menyetujui{' '}
              <Link to="/terms" className="text-gray-900 hover:underline">
                Syarat & Ketentuan
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3">
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Membuat akun...
                </>
              ) : (
                'Buat Akun'
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

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Sudah punya akun?{' '}
              <Link to="/login" className="font-medium text-gray-900 hover:underline">
                Masuk
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
