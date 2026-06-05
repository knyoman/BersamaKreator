export const SME_ORDER_STATUS_LABELS = {
  pending: 'Menunggu',
  in_progress: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const SME_PAYMENT_STATUS_LABELS = {
  unpaid: 'Belum Dibayar',
  paid: 'Dibayar',
  refunded: 'Refund',
  failed: 'Gagal',
};

export const SME_ORDER_STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const SME_PAYMENT_STATUS_CLASSES = {
  unpaid: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

export const SME_CAMPAIGN_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'in_progress', label: 'Berjalan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export const SME_PAYMENT_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'unpaid', label: 'Belum Dibayar' },
  { value: 'paid', label: 'Dibayar' },
  { value: 'failed', label: 'Gagal' },
  { value: 'refunded', label: 'Refund' },
];

export const formatSMECurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export const formatSMEDate = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const getSMEPackageTitle = (order = {}) => (
  order.package_snapshot?.title || 'Harga dasar per post'
);

export const sortSMEOrdersByNewest = (orders = []) => (
  [...orders].sort((first, second) => (
    new Date(second.created_at || 0) - new Date(first.created_at || 0)
  ))
);

export const calculateSMEOrderStats = (orders = []) => {
  const completedOrders = orders.filter((order) => order.order_status === 'completed');
  const activeOrders = orders.filter((order) => order.order_status === 'in_progress');
  const pendingOrders = orders.filter((order) => order.order_status === 'pending');
  const unpaidOrders = orders.filter((order) => order.payment_status === 'unpaid');
  const paidOrders = orders.filter((order) => order.payment_status === 'paid');
  const totalSpend = paidOrders.reduce((total, order) => total + Number(order.total_price || 0), 0);
  const committedBudget = orders.reduce((total, order) => total + Number(order.total_price || 0), 0);

  return {
    totalCampaigns: orders.length,
    activeCampaigns: activeOrders.length,
    pendingCampaigns: pendingOrders.length,
    completedCampaigns: completedOrders.length,
    unpaidCampaigns: unpaidOrders.length,
    paidCampaigns: paidOrders.length,
    totalSpend,
    committedBudget,
    averageCampaignCost: orders.length > 0 ? committedBudget / orders.length : 0,
  };
};

export const getMostUsedInfluencer = (orders = []) => {
  const usage = new Map();

  orders.forEach((order) => {
    if (!order.influencer_id) return;

    const current = usage.get(order.influencer_id) || {
      influencer_id: order.influencer_id,
      name: order.influencer_name || order.influencer_username || 'Influencer',
      username: order.influencer_username,
      campaigns: 0,
      spend: 0,
    };

    current.campaigns += 1;
    current.spend += Number(order.total_price || 0);
    usage.set(order.influencer_id, current);
  });

  return [...usage.values()].sort((first, second) => second.campaigns - first.campaigns)[0] || null;
};
