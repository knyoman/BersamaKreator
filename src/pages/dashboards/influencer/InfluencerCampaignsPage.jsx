import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faClock,
  faEye,
  faMagicWandSparkles,
  faSpinner,
  faTimes,
  faWallet,
} from '@fortawesome/free-solid-svg-icons';
import InfluencerAIAssistantComposer from '../../../components/dashboard/influencer/InfluencerAIAssistantComposer';
import {
  CAMPAIGN_FILTERS,
  formatCurrency,
  formatDate,
  getAvailableCampaignActions,
  ORDER_STATUS_CLASSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../../../features/influencer/campaigns';
import { getPackageTitleFromOrder } from '../../../features/influencer/earnings';
import {
  buildCampaignAIAssistantContext,
  createAIAssistantFormFromCampaign,
  getAIAssistantModeLabel,
} from '../../../features/influencer/aiAssistant';
import { updateInfluencerOrderStatus } from '../../../services/api';

const actionClassNames = {
  primary: 'bg-gray-900 text-white hover:bg-gray-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_CLASSES[status] || 'bg-gray-100 text-gray-700'}`}>
    {ORDER_STATUS_LABELS[status] || status || '-'}
  </span>
);

const CampaignDetailModal = ({
  order,
  actionLoading,
  actionError,
  onClose,
  onOpenAssistant,
  onStatusChange,
}) => {
  const actions = getAvailableCampaignActions(order);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Detail Promosi</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{order.campaign_name}</h2>
            <p className="text-sm text-gray-500 mt-2">UMKM: {order.sme_name || '-'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Tutup"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {actionError && (
            <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 p-4 text-sm">
              {actionError}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <FontAwesomeIcon icon={faWallet} />
                Nilai Promosi
              </div>
              <p className="font-bold text-gray-900 mt-2">{formatCurrency(order.total_price)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <FontAwesomeIcon icon={faCalendarAlt} />
                Deadline
              </div>
              <p className="font-bold text-gray-900 mt-2">{formatDate(order.deadline)}</p>
            </div>
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <FontAwesomeIcon icon={faClock} />
                Status
              </div>
              <div className="mt-2">
                <StatusBadge status={order.order_status} />
              </div>
            </div>
          </div>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">Ringkasan Promosi</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {order.campaign_description || 'Tidak ada deskripsi promosi.'}
            </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-2">Paket Dipilih</h3>
            <p className="text-gray-700">{getPackageTitleFromOrder(order)}</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-3">Bantu dengan AI</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {['caption', 'content_ideas', 'proposal_reply'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onOpenAssistant(order, mode)}
                  className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faMagicWandSparkles} className="mr-2" />
                  {getAIAssistantModeLabel(mode)}
                </button>
              ))}
            </div>
          </section>

          {order.notes && (
            <section>
              <h3 className="font-bold text-gray-900 mb-2">Catatan UMKM</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Pembayaran</p>
              <p className="font-semibold text-gray-900 mt-1">{PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Metode</p>
              <p className="font-semibold text-gray-900 mt-1">{order.payment_method?.replace('_', ' ') || '-'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-white"
          >
            Tutup
          </button>

          <div className="flex flex-col sm:flex-row gap-3">
            {actions.map((action) => (
              <button
                key={action.nextStatus}
                type="button"
                onClick={() => onStatusChange(order, action.nextStatus)}
                disabled={actionLoading}
                className={`px-5 py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${actionClassNames[action.variant] || actionClassNames.outline}`}
                title={action.description}
              >
                {actionLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                    Memproses...
                  </>
                ) : action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CampaignAIAssistantModal = ({ order, mode, onClose }) => {
  const initialForm = createAIAssistantFormFromCampaign(order, mode);
  const campaignContext = buildCampaignAIAssistantContext(order);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Asisten AI Promosi</p>
            <h2 className="text-2xl font-bold text-gray-900 mt-1">{getAIAssistantModeLabel(mode)}</h2>
            <p className="text-sm text-gray-500 mt-2">{order.campaign_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            title="Tutup"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-gray-50">
          <InfluencerAIAssistantComposer
            initialForm={initialForm}
            campaignContext={campaignContext}
            compact
          />
        </div>
      </div>
    </div>
  );
};

const CampaignCard = ({ order, onOpen }) => {
  const actions = getAvailableCampaignActions(order);

  return (
    <article className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{order.campaign_name}</h3>
          <p className="text-sm text-gray-500 mt-1">UMKM: {order.sme_name || '-'}</p>
          <p className="text-xs text-gray-500 mt-1">Paket: {getPackageTitleFromOrder(order)}</p>
        </div>
        <StatusBadge status={order.order_status} />
      </div>

      <p className="text-sm text-gray-600 mt-4 line-clamp-2">
        {order.campaign_description || 'Tidak ada deskripsi promosi.'}
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Harga</p>
          <p className="font-semibold text-gray-900 mt-1">{formatCurrency(order.total_price)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Deadline</p>
          <p className="font-semibold text-gray-900 mt-1">{formatDate(order.deadline)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Pembayaran</p>
          <p className="font-semibold text-gray-900 mt-1">{PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status || '-'}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          {actions.length > 0 ? 'Menunggu tindakan Anda' : 'Tidak ada tindakan lanjutan'}
        </p>
        <button
          type="button"
          onClick={() => onOpen(order)}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
        >
          <FontAwesomeIcon icon={faEye} className="mr-2" />
          Lihat Ringkasan
        </button>
      </div>
    </article>
  );
};

const InfluencerCampaignsPage = ({ orders, loading, error, onRefresh }) => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [assistantRequest, setAssistantRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const filteredOrders = useMemo(() => (
    activeFilter === 'all'
      ? orders
      : orders.filter((order) => order.order_status === activeFilter)
  ), [activeFilter, orders]);

  const counts = useMemo(() => CAMPAIGN_FILTERS.reduce((acc, filter) => {
    acc[filter.value] = filter.value === 'all'
      ? orders.length
      : orders.filter((order) => order.order_status === filter.value).length;
    return acc;
  }, {}), [orders]);

  const handleStatusChange = async (order, nextStatus) => {
    setActionLoading(true);
    setActionError(null);

    try {
      const { error: updateError } = await updateInfluencerOrderStatus(order.id, nextStatus);
      if (updateError) throw updateError;

      await onRefresh();
      setSelectedOrder(null);
    } catch (err) {
      setActionError(err.message || 'Gagal memperbarui status promosi.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-gray-500 uppercase">Promosi</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Kelola Permintaan Promosi</h1>
        <p className="text-gray-600 mt-2">
          Kelola promosi masuk, tinjau ringkasan, terima atau tolak permintaan, dan tandai pekerjaan selesai.
        </p>
      </header>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap gap-2">
          {CAMPAIGN_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                activeFilter === filter.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
              <span className={`ml-2 text-xs ${activeFilter === filter.value ? 'text-gray-200' : 'text-gray-500'}`}>
                {counts[filter.value] || 0}
              </span>
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="py-16 text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl text-gray-900" />
          <p className="text-gray-500 mt-4">Memuat promosi...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-5 text-red-700">
          <p className="font-semibold">Promosi belum bisa dimuat</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <p className="font-semibold text-gray-900">Tidak ada promosi pada filter ini</p>
          <p className="text-sm text-gray-500 mt-1">Promosi baru akan muncul saat UMKM membuat pesanan.</p>
        </div>
      ) : (
        <div className="grid gap-5">
          {filteredOrders.map((order) => (
            <CampaignCard key={order.id} order={order} onOpen={(item) => {
              setSelectedOrder(item);
              setActionError(null);
            }} />
          ))}
        </div>
      )}

      {selectedOrder && (
        <CampaignDetailModal
          order={selectedOrder}
          actionLoading={actionLoading}
          actionError={actionError}
          onClose={() => setSelectedOrder(null)}
          onOpenAssistant={(order, mode) => setAssistantRequest({ order, mode })}
          onStatusChange={handleStatusChange}
        />
      )}

      {assistantRequest && (
        <CampaignAIAssistantModal
          order={assistantRequest.order}
          mode={assistantRequest.mode}
          onClose={() => setAssistantRequest(null)}
        />
      )}
    </div>
  );
};

export default InfluencerCampaignsPage;
