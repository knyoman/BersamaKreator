import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';

const SHORTLIST_STORAGE_KEY = 'bersamakreator_sme_shortlist';

const getStoredShortlist = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHORTLIST_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const SMEShortlistPage = () => {
  const [shortlist, setShortlist] = useState([]);

  useEffect(() => {
    setShortlist(getStoredShortlist());
  }, []);

  const removeItem = (id) => {
    const nextItems = shortlist.filter((item) => String(item.id) !== String(id));
    setShortlist(nextItems);
    localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(nextItems));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-500 uppercase">Daftar Favorit</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Kandidat Influencer</h1>
          <p className="text-gray-600 mt-2">Simpan kandidat untuk dibandingkan sebelum membuat promosi.</p>
        </div>
        <Link to="/dashboard/influencers" className="btn btn-primary inline-flex items-center justify-center">
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          Cari Influencer
        </Link>
      </header>

      <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {shortlist.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
            <div className="w-12 h-12 rounded-lg bg-gray-900 text-white flex items-center justify-center mx-auto">
              <FontAwesomeIcon icon={faBookmark} />
            </div>
            <p className="font-bold text-gray-900 mt-4">Daftar Favorit masih kosong</p>
            <p className="text-sm text-gray-500 mt-1">Mulai dari katalog influencer atau rekomendasi AI untuk memilih kandidat.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
              <Link to="/influencers" className="btn btn-primary">Buka Katalog</Link>
              <Link to="/ai-recommendations" className="btn btn-outline">Rekomendasi AI</Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Influencer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Niche</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Followers</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Harga</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {shortlist.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{item.name || item.username || 'Influencer'}</div>
                      {item.username && <div className="text-xs text-gray-500 mt-1">@{item.username}</div>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.niche || '-'}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{Number(item.followers_count || 0).toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">Rp {Number(item.price_per_post || 0).toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="inline-flex items-center rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <FontAwesomeIcon icon={faTrash} className="mr-2" />
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default SMEShortlistPage;
