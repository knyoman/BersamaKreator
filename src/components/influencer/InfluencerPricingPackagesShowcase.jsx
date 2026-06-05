import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faClock, faStar, faTags } from '@fortawesome/free-solid-svg-icons';
import {
  formatPackageCurrency,
  getPricingPackageTypeLabel,
} from '../../features/influencer/pricingPackages';

const InfluencerPricingPackagesShowcase = ({ influencerId, packages = [] }) => {
  if (packages.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
          <FontAwesomeIcon icon={faTags} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Paket Harga</h2>
          <p className="text-sm text-gray-500">Pilihan layanan promosi yang bisa langsung dipesan.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {packages.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border p-5 flex flex-col ${
              item.is_featured ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">
                  {getPricingPackageTypeLabel(item.package_type)}
                </p>
                <h3 className="font-bold text-gray-900 text-lg mt-1">{item.title}</h3>
              </div>
              {item.is_featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-semibold text-yellow-700">
                  <FontAwesomeIcon icon={faStar} />
                  Utama
                </span>
              )}
            </div>

            <p className="text-2xl font-bold text-gray-900 mt-4">{formatPackageCurrency(item.price)}</p>

            <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold text-gray-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-2 py-1">
                <FontAwesomeIcon icon={faClock} />
                {item.delivery_days || 0} hari
              </span>
              <span className="rounded-full bg-white border border-gray-200 px-2 py-1">
                {item.revision_count || 0} revisi
              </span>
            </div>

            {item.description && (
              <p className="text-sm text-gray-600 mt-4 line-clamp-3">{item.description}</p>
            )}

            <ul className="mt-4 space-y-2 flex-1">
              {(item.deliverables || []).slice(0, 6).map((deliverable) => (
                <li key={deliverable} className="flex gap-2 text-sm text-gray-700">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-900 flex-shrink-0" />
                  <span>{deliverable}</span>
                </li>
              ))}
            </ul>

            <Link
              to={`/order/${influencerId}?package=${item.id}`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-bold text-white hover:bg-gray-800"
            >
              Pesan Paket
              <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-xs" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
};

export default InfluencerPricingPackagesShowcase;
