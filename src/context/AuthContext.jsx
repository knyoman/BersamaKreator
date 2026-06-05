import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../services/supabase';
import { getUserProfile } from '../services/api';
import { authLogger } from '../utils/logger';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchedUserIdRef = useRef(null);
  const profileRequestIdRef = useRef(0);
  const profileTimerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const clearProfileTimer = () => {
      if (profileTimerRef.current) {
        clearTimeout(profileTimerRef.current);
        profileTimerRef.current = null;
      }
    };

    const isCurrentRequest = (requestId) => (
      isMounted && requestId === profileRequestIdRef.current
    );

    const clearAuthState = () => {
      profileRequestIdRef.current += 1;
      clearProfileTimer();
      fetchedUserIdRef.current = null;
      setUser(null);
      setUserProfile(null);
      setError(null);
      setLoading(false);
    };

    const loadUserProfile = async (authUser, sourceEvent) => {
      const requestId = profileRequestIdRef.current + 1;
      profileRequestIdRef.current = requestId;

      setLoading(true);
      setError(null);

      try {
        const { data: profile, error: profileError } = await getUserProfile(authUser.id);

        if (!isCurrentRequest(requestId)) return;

        if (profileError) {
          authLogger.error(`Error fetching profile (${sourceEvent}):`, profileError.message);
          fetchedUserIdRef.current = null;
          setUserProfile(null);
          setError(profileError.message || 'Tidak bisa memuat profil user.');
          return;
        }

        fetchedUserIdRef.current = authUser.id;
        setUserProfile(profile);
      } catch (err) {
        if (!isCurrentRequest(requestId)) return;

        authLogger.error(`Unexpected profile fetch error (${sourceEvent}):`, err.message);
        fetchedUserIdRef.current = null;
        setUserProfile(null);
        setError(err.message || 'Tidak bisa memuat profil user.');
      } finally {
        if (isCurrentRequest(requestId)) {
          setLoading(false);
        }
      }
    };

    const scheduleProfileLoad = (authUser, sourceEvent) => {
      if (fetchedUserIdRef.current === authUser.id) {
        setError(null);
        setLoading(false);
        return;
      }

      clearProfileTimer();
      profileTimerRef.current = setTimeout(() => {
        profileTimerRef.current = null;
        loadUserProfile(authUser, sourceEvent);
      }, 0);
    };

    const handleSession = (event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        clearAuthState();
        return;
      }

      setUser(session.user);
      scheduleProfileLoad(session.user, event);
    };

    const checkInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;
        if (!isMounted) return;

        handleSession('INITIAL_SESSION_CHECK', session);
      } catch (err) {
        if (!isMounted) return;

        authLogger.error('Error checking session:', err.message);
        setError(err.message);
        setLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      handleSession(event, session);
    });

    checkInitialSession();

    return () => {
      isMounted = false;
      clearProfileTimer();
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: userProfile?.user_type === 'admin',
    isInfluencer: userProfile?.user_type === 'influencer',
    isSME: userProfile?.user_type === 'sme',
    setUser,
    setUserProfile,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
