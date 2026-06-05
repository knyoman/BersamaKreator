export const ORDER_STATUS_LABELS = {
  pending: 'Menunggu',
  in_progress: 'Berjalan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Belum Dibayar',
  paid: 'Dibayar',
  refunded: 'Refund',
  failed: 'Gagal',
};

export const ORDER_STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const CAMPAIGN_FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'pending', label: 'Menunggu' },
  { value: 'in_progress', label: 'Berjalan' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export const getAvailableCampaignActions = (order) => {
  if (order.order_status === 'pending') {
    return [
      {
        nextStatus: 'in_progress',
        label: 'Terima Campaign',
        description: 'Campaign akan masuk ke status berjalan.',
        variant: 'primary',
      },
      {
        nextStatus: 'cancelled',
        label: 'Tolak',
        description: 'Campaign akan dibatalkan.',
        variant: 'danger',
      },
    ];
  }

  if (order.order_status === 'in_progress') {
    return [
      {
        nextStatus: 'completed',
        label: 'Tandai Selesai',
        description: 'Campaign akan ditandai selesai.',
        variant: 'primary',
      },
    ];
  }

  return [];
};

export const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

export const formatDate = (value) => {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};
