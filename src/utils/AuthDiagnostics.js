import { supabase } from '../services/supabase';

/**
 * DEVELOPMENT ONLY: Diagnostik auth dan database.
 * File ini tidak boleh dijalankan di production.
 */

const isDevelopment = import.meta.env.MODE === 'development' || import.meta.env.DEV;

export const runAuthTests = async () => {
  if (!isDevelopment) {
    console.warn('AuthDiagnostics dinonaktifkan pada mode production');
    return;
  }

  console.group('Diagnostik Auth & Database');

  try {
    console.log('%c1. Mengecek konfigurasi...', 'color: blue; font-weight: bold');
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('Environment variable belum lengkap');
    } else {
      console.log('Supabase URL sudah dikonfigurasi');
      console.log('Status anon key:', key.startsWith('eyJ') ? 'Format valid' : 'Format tidak valid');
    }

    console.log('%c\n2. Mengecek koneksi database...', 'color: blue; font-weight: bold');

    const timeoutPromise = new Promise((_, reject) => (
      setTimeout(() => reject(new Error('Request timeout setelah 5 detik')), 5000)
    ));

    const dbPromise = supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count, error: connError } = await Promise.race([dbPromise, timeoutPromise])
      .catch((err) => ({ error: err, count: null }));

    if (connError) {
      console.error('Koneksi gagal:', connError.message);
      console.warn('Tips: pastikan tabel "users" tersedia dan policy RLS mengizinkan akses baca.');
    } else {
      console.log('Koneksi berhasil');
      console.log(`Total user di database: ${count}`);
    }

    console.log('%c\n3. Mengecek sesi aktif...', 'color: blue; font-weight: bold');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Pengecekan sesi gagal:', sessionError.message);
    } else if (!session) {
      console.log('Tidak ada sesi aktif. User sedang logout.');
    } else {
      console.log('Sesi aktif ditemukan');

      console.log('%c\n4. Mengecek konsistensi profil...', 'color: blue; font-weight: bold');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Gagal mengambil profil:', profileError.message);
        console.error('KRITIS: User sudah terautentikasi tetapi profil tidak ada di tabel "users".');
      } else if (!profile) {
        console.error('KRITIS: User sudah terautentikasi tetapi profil tidak ditemukan di tabel "users".');
      } else {
        console.log('Profil ditemukan');
      }
    }

    console.log('%c\nDiagnostik selesai', 'color: green; font-weight: bold; font-size: 12px');
    console.log('Jika seluruh pengecekan utama berhasil, sistem auth sehat.');
  } catch (err) {
    console.error('Error tak terduga saat diagnostik:', err);
  } finally {
    console.groupEnd();
  }
};
