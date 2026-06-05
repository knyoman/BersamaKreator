import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendarAlt,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faClock,
  faEye,
  faEyeSlash,
  faSave,
  faSpinner,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import {
  AVAILABILITY_STATUS,
  AVAILABILITY_STATUS_OPTIONS,
  WEEKDAY_LABELS,
  countAvailabilityByStatus,
  createEmptyAvailabilityForm,
  formatAvailabilityDate,
  formatMonthTitle,
  getAvailabilityStatusOption,
  getMonthGrid,
  getMonthRangeKeys,
  mapAvailabilityByDate,
  sanitizeAvailabilityPayload,
  toAvailabilityForm,
  toDateKey,
} from '../../../features/influencer/availability';
import {
  deleteInfluencerAvailability,
  getInfluencerAvailability,
  upsertInfluencerAvailability,
} from '../../../services/api';
import { logger } from '../../../utils/logger';

const getAvailabilityErrorMessage = (error) => {
  if (!error?.message) return 'Gagal memuat kalender ketersediaan.';

  if (error.message.includes('influencer_availability')) {
    return 'Tabel kalender ketersediaan belum tersedia. Jalankan schema Supabase terbaru sebelum menggunakan fitur ini.';
  }

  return error.message;
};

const sortAvailabilityItems = (items) => (
  [...items].sort((first, second) => String(first.date).localeCompare(String(second.date)))
);

const AvailabilityBadge = ({ item }) => {
  if (!item) {
    return <span className="text-xs text-gray-400">Belum ditandai</span>;
  }

  const statusOption = getAvailabilityStatusOption(item.status);

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusOption.badgeClassName}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusOption.dotClassName}`} />
      {statusOption.label}
    </span>
  );
};

const CalendarDayButton = ({
  day,
  item,
  isSelected,
  onSelect,
}) => {
  const statusOption = item ? getAvailabilityStatusOption(item.status) : null;

  return (
    <button
      type="button"
      onClick={() => onSelect(day.dateKey)}
      className={`min-h-[104px] rounded-lg border p-3 text-left transition-colors flex flex-col gap-2 ${
        day.isCurrentMonth
          ? 'bg-white hover:bg-gray-50 border-gray-200'
          : 'bg-gray-50 text-gray-400 border-gray-100'
      } ${
        isSelected ? 'ring-2 ring-gray-900 border-gray-900' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`text-sm font-bold ${day.isToday ? 'text-gray-900' : ''}`}>
          {day.dayNumber}
        </span>
        {day.isToday && (
          <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-bold text-white">
            Hari ini
          </span>
        )}
      </div>

      <div className="mt-auto space-y-2">
        <AvailabilityBadge item={item} />

        {item?.is_public === false && (
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500">
            <FontAwesomeIcon icon={faEyeSlash} />
            Privat
          </div>
        )}

        {item?.note && (
          <p className={`text-xs line-clamp-2 ${statusOption?.value === AVAILABILITY_STATUS.busy ? 'text-red-700' : 'text-gray-600'}`}>
            {item.note}
          </p>
        )}
      </div>
    </button>
  );
};

const StatusOptionButton = ({ option, checked, onChange }) => {
  const icon = option.value === AVAILABILITY_STATUS.available ? faCheckCircle : faClock;

  return (
    <label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
      checked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
    }`}>
      <input
        type="radio"
        name="status"
        value={option.value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${option.panelClassName}`}>
        <FontAwesomeIcon icon={icon} />
      </span>
      <span>
        <span className="block font-bold text-gray-900">{option.label}</span>
        <span className="block text-sm text-gray-500 mt-1">{option.description}</span>
      </span>
    </label>
  );
};

const InfluencerAvailabilityCalendar = ({ influencerId }) => {
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState(() => toDateKey(new Date()));
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(() => createEmptyAvailabilityForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  const monthRange = useMemo(() => getMonthRangeKeys(monthDate), [monthDate]);
  const monthGrid = useMemo(() => getMonthGrid(monthDate), [monthDate]);
  const availabilityByDate = useMemo(() => mapAvailabilityByDate(items), [items]);
  const selectedItem = availabilityByDate[selectedDateKey] || null;
  const counts = useMemo(() => countAvailabilityByStatus(items), [items]);
  const publicCount = useMemo(
    () => items.filter((item) => item.is_public !== false).length,
    [items],
  );

  const loadAvailability = useCallback(async () => {
    if (!influencerId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await getInfluencerAvailability(influencerId, {
        ...monthRange,
        includePrivate: true,
      });

      if (fetchError) throw fetchError;
      setItems(data || []);
    } catch (err) {
      logger.error('[InfluencerAvailabilityCalendar] Load error:', err.message);
      setError(getAvailabilityErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [influencerId, monthRange]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  useEffect(() => {
    setFormData(toAvailabilityForm(selectedItem, selectedDateKey));
    setFormError(null);
  }, [selectedItem, selectedDateKey]);

  const handleMonthChange = (offset) => {
    setMonthDate((current) => {
      const nextMonth = new Date(current.getFullYear(), current.getMonth() + offset, 1);
      setSelectedDateKey(toDateKey(nextMonth));
      return nextMonth;
    });
  };

  const handleToday = () => {
    const today = new Date();
    setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDateKey(toDateKey(today));
  };

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const payload = sanitizeAvailabilityPayload(
        {
          ...formData,
          date: selectedDateKey,
        },
        influencerId,
      );
      const { data, error: saveError } = await upsertInfluencerAvailability(payload);

      if (saveError) throw saveError;

      setItems((current) => sortAvailabilityItems([
        ...current.filter((item) => item.date !== data.date),
        data,
      ]));
    } catch (err) {
      setFormError(err.message || 'Gagal menyimpan ketersediaan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const confirmed = window.confirm(`Kosongkan status untuk ${formatAvailabilityDate(selectedDateKey)}?`);
    if (!confirmed) return;

    setSaving(true);
    setFormError(null);

    try {
      const { error: deleteError } = await deleteInfluencerAvailability(influencerId, selectedDateKey);
      if (deleteError) throw deleteError;

      setItems((current) => current.filter((item) => item.date !== selectedDateKey));
      setFormData(createEmptyAvailabilityForm(selectedDateKey));
    } catch (err) {
      setFormError(err.message || 'Gagal menghapus status ketersediaan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Kalender Ketersediaan</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">Atur Jadwal Promosi</h2>
              <p className="text-gray-600 mt-2">
                Tandai tanggal tersedia atau sibuk agar UMKM bisa memilih waktu promosi dengan lebih tepat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMonthChange(-1)}
              className="w-10 h-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              title="Bulan sebelumnya"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-4 h-10 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={() => handleMonthChange(1)}
              className="w-10 h-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
              title="Bulan berikutnya"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-green-50 border border-green-100 p-4">
            <p className="text-xs font-semibold text-green-700 uppercase">Tersedia</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{counts.available}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-100 p-4">
            <p className="text-xs font-semibold text-red-700 uppercase">Sibuk</p>
            <p className="text-2xl font-bold text-red-900 mt-1">{counts.busy}</p>
          </div>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase">Publik</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{publicCount}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900">{formatMonthTitle(monthDate)}</h3>
          {loading && (
            <div className="text-sm text-gray-500">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
              Memuat...
            </div>
          )}
        </div>

        {error ? (
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-900">
            <p className="font-semibold">Kalender belum bisa dimuat</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="px-3 py-2 text-xs font-bold uppercase text-gray-500">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthGrid.map((day) => (
                  <CalendarDayButton
                    key={day.dateKey}
                    day={day}
                    item={availabilityByDate[day.dateKey]}
                    isSelected={selectedDateKey === day.dateKey}
                    onSelect={setSelectedDateKey}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-fit xl:sticky xl:top-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Tanggal Dipilih</p>
            <h3 className="text-xl font-bold text-gray-900 mt-1">{formatAvailabilityDate(selectedDateKey)}</h3>
          </div>
          {selectedItem && (
            <AvailabilityBadge item={selectedItem} />
          )}
        </div>

        {!influencerId && (
          <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            Profil influencer belum siap. Lengkapi profil terlebih dahulu sebelum mengatur kalender.
          </div>
        )}

        {formError && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-3">
            {AVAILABILITY_STATUS_OPTIONS.map((option) => (
              <StatusOptionButton
                key={option.value}
                option={option}
                checked={formData.status === option.value}
                onChange={handleChange}
              />
            ))}
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            />
            <span>
              <span className="flex items-center gap-2 font-bold text-gray-900">
                <FontAwesomeIcon icon={formData.is_public ? faEye : faEyeSlash} />
                Tampilkan ke UMKM
              </span>
              <span className="block text-gray-500 mt-1">
                Jika dimatikan, status hanya terlihat di dashboard Anda.
              </span>
            </span>
          </label>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan</label>
            <textarea
              name="note"
              value={formData.note}
              onChange={handleChange}
              rows={4}
              maxLength={240}
              placeholder="contoh: Penuh untuk event offline, bisa briefing setelah sore."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-400 mt-2">{formData.note.length}/240 karakter</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={!influencerId || saving}
              className="flex-1 px-5 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Simpan
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={!selectedItem || saving}
              className="px-5 py-3 rounded-xl border border-red-100 text-red-600 font-bold hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Kosongkan status tanggal"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </form>
      </aside>
    </section>
  );
};

export default InfluencerAvailabilityCalendar;
