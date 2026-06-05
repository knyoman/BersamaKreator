import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare, faBriefcase, faImage } from '@fortawesome/free-solid-svg-icons';
import { getPortfolioContentTypeLabel } from '../../features/influencer/portfolio';

const InfluencerPortfolioShowcase = ({ items = [] }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
          <FontAwesomeIcon icon={faBriefcase} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio</h2>
          <p className="text-sm text-gray-500">Contoh karya dan promosi yang pernah dibuat.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center overflow-hidden">
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faImage} className="text-3xl text-gray-300" />
              )}
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-gray-500 uppercase">{getPortfolioContentTypeLabel(item.content_type)}</p>
              <h3 className="font-bold text-gray-900 mt-1">{item.title}</h3>
              {item.brand_name && <p className="text-sm text-gray-600 mt-2">Brand: {item.brand_name}</p>}
              {item.description && <p className="text-sm text-gray-600 mt-3 line-clamp-3">{item.description}</p>}
              {item.content_url && (
                <a
                  href={item.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-semibold text-gray-900 hover:underline mt-4"
                >
                  Lihat Karya
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-2 text-xs" />
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default InfluencerPortfolioShowcase;
