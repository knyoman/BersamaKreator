import { useEffect, useMemo, useState } from 'react';
import { getInfluencerReviews } from '../../services/api';
import { logger } from '../../utils/logger';
import { calculateReviewStats } from './reviews';

export const useInfluencerReviews = (influencerId) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      if (!influencerId) {
        setReviews([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await getInfluencerReviews(influencerId, {
          includeUnpublished: true,
        });
        if (fetchError) throw fetchError;
        if (!isMounted) return;

        setReviews(data || []);
      } catch (err) {
        if (!isMounted) return;

        logger.error('[useInfluencerReviews] Error fetching reviews:', err.message);
        setReviews([]);
        setError(err.message || 'Gagal memuat ulasan.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [influencerId, refreshKey]);

  const stats = useMemo(() => calculateReviewStats(reviews), [reviews]);

  return {
    reviews,
    loading,
    error,
    stats,
    refresh: () => setRefreshKey((current) => current + 1),
  };
};
