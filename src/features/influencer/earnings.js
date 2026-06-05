export const INFLUENCER_PLATFORM_FEE_RATE = 0.05;

export const formatEarningsCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export const calculateInfluencerEarnings = (orders = []) => {
  const completedOrders = orders.filter((order) => order.order_status === 'completed');
  const paidCompletedOrders = completedOrders.filter((order) => order.payment_status === 'paid');
  const unpaidOrders = orders.filter((order) => (
    order.payment_status === 'unpaid'
    && order.order_status !== 'cancelled'
  ));

  const grossCompletedEarnings = completedOrders.reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0,
  );
  const confirmedEarnings = paidCompletedOrders.reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0,
  );
  const unpaidCampaignValue = unpaidOrders.reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0,
  );
  const estimatedPlatformFee = grossCompletedEarnings * INFLUENCER_PLATFORM_FEE_RATE;

  return {
    totalCampaigns: orders.length,
    completedCampaigns: completedOrders.length,
    paidCompletedCampaigns: paidCompletedOrders.length,
    unpaidCampaigns: unpaidOrders.length,
    grossCompletedEarnings,
    confirmedEarnings,
    unpaidCampaignValue,
    estimatedPlatformFee,
    estimatedBalance: Math.max(grossCompletedEarnings - estimatedPlatformFee, 0),
  };
};

export const getPackageTitleFromOrder = (order = {}) => (
  order.package_snapshot?.title
  || order.package_snapshot?.package_title
  || 'Harga dasar per post'
);

export const sortOrdersByNewest = (orders = []) => (
  [...orders].sort((first, second) => new Date(second.created_at || 0) - new Date(first.created_at || 0))
);
