import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faFileExport,
  faMagnifyingGlass,
  faRotateRight,
  faTable,
} from '@fortawesome/free-solid-svg-icons';
import { getAdminReportsData } from '../../../services/api';

const reportOptions = [
  { value: 'campaigns', label: 'Campaign & Order', description: 'Campaign, status order, pembayaran, nilai, dan deadline.' },
  { value: 'payments', label: 'Pembayaran', description: 'Status pembayaran, nilai transaksi, dan metode pembayaran.' },
  { value: 'users', label: 'User', description: 'Akun admin, UMKM, influencer, status aktif, dan tanggal daftar.' },
  { value: 'influencers', label: 'Influencer', description: 'Profil influencer, niche, followers, rating, dan verifikasi.' },
  { value: 'smes', label: 'UMKM', description: 'Profil bisnis, jumlah campaign, unpaid, dan nilai campaign.' },
  { value: 'reviews', label: 'Ulasan', description: 'Rating, komentar, publikasi, dan respons influencer.' },
];

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(Number(value || 0));

const formatValue = (value) => {
  if (value === true) return 'Ya';
  if (value === false) return 'Tidak';
  if (value === null || value === undefined || value === '') return '-';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const escapeCsvValue = (value) => {
  const text = formatValue(value);
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

const createCsv = (columns, rows) => {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const body = rows.map((row) => columns.map((column) => escapeCsvValue(row[column.key])).join(','));
  return [header, ...body].join('\r\n');
};

const downloadCsv = (filename, csvText) => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AdminReportsPage = () => {
  const [reportType, setReportType] = useState('campaigns');
  const [searchInput, setSearchInput] = useState('');
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const activeReport = reportOptions.find((option) => option.value === reportType) || reportOptions[0];

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');

    const { data, error } = await getAdminReportsData(reportType);

    if (error) {
      setErrorMessage(error.message || 'Data laporan belum bisa dimuat.');
    }

    setColumns(data?.columns || []);
    setRows(data?.rows || []);
    setGeneratedAt(data?.generatedAt || '');
    setLoading(false);
  }, [reportType]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport, refreshIndex]);

  const filteredRows = useMemo(() => {
    const keyword = searchInput.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => columns.some((column) => formatValue(row[column.key]).toLowerCase().includes(keyword)));
  }, [columns, rows, searchInput]);

  const previewRows = filteredRows.slice(0, 15);

  const handleExport = () => {
    const csvText = createCsv(columns, filteredRows);
    const datePart = new Date().toISOString().slice(0, 10);
    downloadCsv(`bersamakreator-${reportType}-${datePart}.csv`, csvText);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500">Dashboard Admin</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">Laporan & Export Data</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Siapkan laporan operasional campaign, user, pembayaran, influencer, UMKM, dan ulasan dalam format CSV.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshIndex((current) => current + 1)}
          className="btn btn-outline inline-flex items-center justify-center gap-2 text-xs"
          disabled={loading}
        >
          <FontAwesomeIcon icon={faRotateRight} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <FontAwesomeIcon icon={faFileExport} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-950">Pilih Laporan</h2>
              <p className="text-xs text-gray-500">Dataset siap export.</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {reportOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setReportType(option.value)}
                className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                  reportType === option.value
                    ? 'border-gray-900 bg-gray-950 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <p className="text-sm font-bold">{option.label}</p>
                <p className={`mt-1 text-xs leading-relaxed ${reportType === option.value ? 'text-gray-300' : 'text-gray-500'}`}>
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">Preview Data</p>
              <h2 className="mt-1 text-lg font-bold text-gray-950">{activeReport.label}</h2>
              <p className="mt-1 text-sm text-gray-600">{activeReport.description}</p>
              <p className="mt-2 text-xs font-semibold text-gray-500">
                {loading ? 'Memuat...' : `${formatNumber(filteredRows.length)} baris siap export`}
                {generatedAt ? ` - Dibuat ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(generatedAt))}` : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-primary inline-flex items-center justify-center gap-2 text-xs"
              disabled={loading || filteredRows.length === 0}
            >
              <FontAwesomeIcon icon={faDownload} />
              Export CSV
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full sm:max-w-sm">
              <span className="sr-only">Cari data laporan</span>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Filter preview laporan"
                className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-gray-900"
              />
            </label>
            <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              <FontAwesomeIcon icon={faTable} />
              Preview 15 baris pertama
            </div>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="whitespace-nowrap px-4 py-3 font-bold">{column.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    [1, 2, 3, 4].map((item) => (
                      <tr key={item} className="border-t border-gray-100">
                        {columns.map((column) => (
                          <td key={column.key} className="px-4 py-4"><div className="h-4 w-32 rounded bg-gray-100" /></td>
                        ))}
                      </tr>
                    ))
                  ) : previewRows.length === 0 ? (
                    <tr>
                      <td colSpan={Math.max(columns.length, 1)} className="px-4 py-10 text-center text-sm text-gray-500">
                        Tidak ada data pada laporan ini.
                      </td>
                    </tr>
                  ) : (
                    previewRows.map((row, index) => (
                      <tr key={row.id || index} className="border-t border-gray-100 hover:bg-gray-50/70">
                        {columns.map((column) => (
                          <td key={column.key} className="max-w-[260px] truncate px-4 py-3 text-xs text-gray-700">
                            {formatValue(row[column.key])}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default AdminReportsPage;
