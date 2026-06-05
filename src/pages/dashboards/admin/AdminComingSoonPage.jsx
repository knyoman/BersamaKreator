import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faDatabase, faListCheck } from '@fortawesome/free-solid-svg-icons';

const InfoPanel = ({ title, items, icon }) => (
  <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2">
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
        <FontAwesomeIcon icon={icon} />
      </div>
      <h2 className="text-sm font-bold text-gray-950">{title}</h2>
    </div>
    <div className="mt-3 space-y-2">
      {items.map((item) => (
        <div key={item} className="flex gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900" />
          <p className="text-xs leading-relaxed text-gray-600">{item}</p>
        </div>
      ))}
    </div>
  </section>
);

const AdminComingSoonPage = ({ page }) => {
  const details = page.details || {};
  const focusItems = details.focusItems || ['Data operasional', 'Filter dan pencarian', 'Aksi admin'];
  const dataSources = details.dataSources || ['Data platform'];
  const nextSteps = details.nextSteps || ['Siapkan tabel data', 'Tambahkan filter', 'Tambahkan aksi admin'];

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">{page.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">{page.description}</p>
        </div>
        <Link to="/dashboard/overview" className="btn btn-outline inline-flex items-center justify-center gap-2 text-xs">
          Ringkasan
          <FontAwesomeIcon icon={faArrowRight} />
        </Link>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-gray-500">Modul Admin</p>
            <h2 className="mt-1 text-lg font-bold text-gray-950">Halaman sudah disiapkan untuk pengembangan berikutnya</h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Struktur route, sidebar, dan ruang kontennya sudah aktif. Modul ini bisa langsung diisi tabel, filter, dan aksi sesuai prioritas berikutnya.
            </p>
          </div>
          <div className="rounded-lg bg-gray-950 px-3 py-2 text-xs font-semibold text-white">
            Siap dikembangkan
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <InfoPanel title="Fokus Halaman" items={focusItems} icon={faListCheck} />
        <InfoPanel title="Sumber Data" items={dataSources} icon={faDatabase} />
        <InfoPanel title="Langkah Berikutnya" items={nextSteps} icon={faArrowRight} />
      </section>
    </div>
  );
};

export default AdminComingSoonPage;
