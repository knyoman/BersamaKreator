import { useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faSpinner } from '@fortawesome/free-solid-svg-icons';
import {
  formatAvailabilityDate,
  getAvailabilityStatusOption,
  getRollingDateWindow,
  mapAvailabilityByDate,
} from '../../features/influencer/availability';

const EmptyStatus = () => (
  <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-500">
    Belum ditandai
  </span>
);

const AvailabilityPreviewDay = ({ day, item }) => {
  const statusOption = item ? getAvailabilityStatusOption(item.status) : null;
  const dateParts = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).formatToParts(day.date);
  const weekday = dateParts.find((part) => part.type === 'weekday')?.value || '';
  const dayNumber = dateParts.find((part) => part.type === 'day')?.value || '';
  const month = dateParts.find((part) => part.type === 'month')?.value || '';

  return (
    <article className={`rounded-xl border p-4 min-h-[132px] ${
      statusOption ? statusOption.panelClassName : 'bg-gray-50 border-gray-100 text-gray-700'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase opacity-70">{weekday}</p>
          <p className="text-xl font-bold mt-1">{dayNumber}</p>
          <p className="text-xs font-semibold uppercase opacity-70">{month}</p>
        </div>
        {day.isToday && (
          <span className="rounded-full bg-gray-900 px-2 py-1 text-[10px] font-bold text-white">
            Hari ini
          </span>
        )}
      </div>

      <div className="mt-4">
        {statusOption ? (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold ${statusOption.badgeClassName}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusOption.dotClassName}`} />
            {statusOption.label}
          </span>
        ) : (
          <EmptyStatus />
        )}
      </div>

      {item?.note && (
        <p className="text-xs mt-3 line-clamp-2 opacity-80">{item.note}</p>
      )}
    </article>
  );
};

const InfluencerAvailabilityPreview = ({ items = [], loading = false, dayCount = 14 }) => {
  const days = useMemo(() => getRollingDateWindow(new Date(), dayCount), [dayCount]);
  const availabilityByDate = useMemo(() => mapAvailabilityByDate(items), [items]);
  const markedCount = items.length;

  return (
    <section className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faCalendarAlt} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ketersediaan Promosi</h2>
          <p className="text-sm text-gray-500">
            Jadwal publik {formatAvailabilityDate(days[0].dateKey)} sampai {formatAvailabilityDate(days[days.length - 1].dateKey)}.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-gray-900" />
          <p className="text-sm text-gray-500 mt-3">Memuat kalender...</p>
        </div>
      ) : (
        <>
          {markedCount === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 mb-5">
              Influencer belum membagikan tanggal tersedia atau sibuk untuk periode ini.
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {days.map((day) => (
              <AvailabilityPreviewDay
                key={day.dateKey}
                day={day}
                item={availabilityByDate[day.dateKey]}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default InfluencerAvailabilityPreview;
