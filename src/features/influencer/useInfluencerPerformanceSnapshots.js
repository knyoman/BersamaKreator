import { useEffect, useState } from 'react';
import { getInfluencerPerformanceSnapshots } from '../../services/api';
import { logger } from '../../utils/logger';

export const useInfluencerPerformanceSnapshots = (influencerId) => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchSnapshots = async () => {
      if (!influencerId) {
        setSnapshots([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await getInfluencerPerformanceSnapshots(influencerId, {
          limit: 12,
        });
        if (fetchError) throw fetchError;
        if (!isMounted) return;

        setSnapshots(data || []);
      } catch (err) {
        if (!isMounted) return;

        logger.error('[useInfluencerPerformanceSnapshots] Error fetching snapshots:', err.message);
        setSnapshots([]);
        setError(err.message || 'Gagal memuat snapshot performa.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSnapshots();

    return () => {
      isMounted = false;
    };
  }, [influencerId, refreshKey]);

  return {
    snapshots,
    loading,
    error,
    refresh: () => setRefreshKey((current) => current + 1),
  };
};
