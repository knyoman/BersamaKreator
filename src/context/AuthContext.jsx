import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { getUserProfile } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
          // Get user profile from database
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else {
            setUserProfile(profile);
          }
        }
      } catch (err) {
        console.error('Error checking user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Only set loading if we don't have a profile yet
        if (!userProfile) setLoading(true);
        
        const { data: profile, error: profileError } = await getUserProfile(session.user.id);
        
        if (profileError) {
          console.error('Error fetching profile in auth change:', profileError);
          setError(profileError.message);
        } else {
          setUserProfile(profile);
        }
        setLoading(false);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
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
