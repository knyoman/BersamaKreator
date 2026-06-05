import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOrders } from '../../services/api';
import { logger } from '../../utils/logger';
import { calculateSMEOrderStats, sortSMEOrdersByNewest } from './campaigns';

export const useSMEOrders = (smeId) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!smeId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getOrders({ smeId });
      if (fetchError) throw fetchError;

      setOrders(sortSMEOrdersByNewest(data || []));
    } catch (fetchError) {
      logger.error('[useSMEOrders] Error fetching SME orders:', fetchError.message);
      setError(fetchError);
    } finally {
      setLoading(false);
    }
  }, [smeId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const stats = useMemo(() => calculateSMEOrderStats(orders), [orders]);

  return {
    orders,
    loading,
    error,
    stats,
    refresh: fetchOrders,
  };
};
