import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faCheckCircle,
  faCircle,
  faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';

const InfluencerProfileCompletionCard = ({ completion, onEditProfile }) => {
  const isComplete = completion.percentage >= 100;

  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-lg bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faClipboardCheck} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase">Kelengkapan Profil</p>
              <h2 className="text-2xl font-bold text-gray-900 mt-1">{completion.statusLabel}</h2>
              <p className="text-sm text-gray-600 mt-2">
                {isComplete
                  ? 'Profil Anda sudah lengkap dan siap dilihat calon mitra UMKM.'
                  : `${completion.completedCount} dari ${completion.totalCount} bagian profil sudah lengkap.`}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-4xl font-black text-gray-900">{completion.percentage}%</div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Progress</div>
          </div>
        </div>

        <div className="mt-6 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-gray-900'}`}
            style={{ width: `${completion.percentage}%` }}
          />
        </div>
      </div>

      {!isComplete && completion.nextItem && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase">Langkah berikutnya</p>
            <p className="font-semibold text-gray-900">{completion.nextItem.label}</p>
          </div>
          <button onClick={onEditProfile} className="btn btn-primary inline-flex items-center justify-center text-sm">
            Lengkapi Sekarang
            <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
          </button>
        </div>
      )}

      <div className="p-6">
        <div className="grid sm:grid-cols-2 gap-3">
          {completion.items.map((item) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 rounded-lg border p-4 ${
                item.isCompleted ? 'border-green-100 bg-green-50' : 'border-gray-200 bg-white'
              }`}
            >
              <FontAwesomeIcon
                icon={item.isCompleted ? faCheckCircle : faCircle}
                className={`mt-0.5 ${item.isCompleted ? 'text-green-600' : 'text-gray-300'}`}
              />
              <div>
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {isComplete && (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">
              Mantap, profil Anda sudah lengkap. Tetap perbarui rate dan link sosial saat ada perubahan.
            </p>
            <button onClick={onEditProfile} className="btn btn-outline text-sm">
              Edit Profil
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default InfluencerProfileCompletionCard;
