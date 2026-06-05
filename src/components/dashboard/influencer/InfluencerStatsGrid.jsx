import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faShoppingCart, faStar, faWallet } from '@fortawesome/free-solid-svg-icons';

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`;

const InfluencerStatsGrid = ({ loading, reviewLoading, stats, reviewStats }) => {
  const cards = [
    {
      label: 'Promosi Aktif',
      value: stats.activeOrders,
      icon: faChartLine,
      iconClassName: 'bg-blue-100 text-blue-600',
    },
    {
      label: 'Selesai',
      value: stats.completedOrders,
      icon: faShoppingCart,
      iconClassName: 'bg-green-100 text-green-600',
    },
    {
      label: 'Total Penghasilan',
      value: formatCurrency(stats.totalEarnings),
      icon: faWallet,
      iconClassName: 'bg-yellow-100 text-yellow-600',
      isCurrency: true,
    },
    {
      label: 'Penilaian Ulasan',
      value: reviewStats?.averageRating > 0 ? reviewStats.averageRating.toFixed(1) : '-',
      caption: `${reviewStats?.totalReviews || 0} ulasan`,
      icon: faStar,
      iconClassName: 'bg-purple-100 text-purple-600',
      isReview: true,
    },
  ];

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">{card.label}</p>
              <p className={`${card.isCurrency ? 'text-2xl' : 'text-3xl'} font-bold text-gray-900`}>
                {(card.isReview ? reviewLoading : loading) ? '...' : card.value}
              </p>
              {card.caption && (
                <p className="text-xs text-gray-500 mt-2">{card.caption}</p>
              )}
            </div>
            <div className={`rounded-full p-3 ${card.iconClassName}`}>
              <FontAwesomeIcon icon={card.icon} className="text-2xl" />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default InfluencerStatsGrid;
