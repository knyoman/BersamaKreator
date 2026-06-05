import { useEffect, useMemo, useState } from 'react';
import { getOrders } from '../../services/api';
import { logger } from '../../utils/logger';
import { calculateInfluencerEarnings } from './earnings';

export const getInfluencerId = (profile) => {
  const candidateId = profile?.influencer_id ?? profile?.id;
  const numericId = Number(candidateId);

  return Number.isInteger(numericId) ? numericId : null;
};

export const calculateInfluencerOrderStats = (orders) => {
  const earnings = calculateInfluencerEarnings(orders);

  return {
    activeOrders: orders.filter((order) => order.order_status === 'in_progress').length,
    completedOrders: earnings.completedCampaigns,
    pendingOrders: orders.filter((order) => order.order_status === 'pending').length,
    cancelledOrders: orders.filter((order) => order.order_status === 'cancelled').length,
    totalEarnings: earnings.grossCompletedEarnings,
    confirmedEarnings: earnings.confirmedEarnings,
    unpaidCampaignValue: earnings.unpaidCampaignValue,
    estimatedBalance: earnings.estimatedBalance,
  };
};

export const useInfluencerOrders = (influencerId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      if (!influencerId) {
        setOrders([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await getOrders({ influencerId });
        if (fetchError) throw fetchError;
        if (!isMounted) return;

        setOrders(data || []);
      } catch (err) {
        if (!isMounted) return;

        logger.error('[useInfluencerOrders] Error fetching orders:', err.message);
        setOrders([]);
        setError(err.message || 'Gagal memuat promosi.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, [influencerId, refreshKey]);

  const stats = useMemo(() => calculateInfluencerOrderStats(orders), [orders]);

  return {
    orders,
    loading,
    error,
    stats,
    refresh: () => setRefreshKey((current) => current + 1),
  };
};
