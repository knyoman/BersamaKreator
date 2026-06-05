import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion, faXmark } from '@fortawesome/free-solid-svg-icons';

const InfoList = ({ title, items = [] }) => {
  if (!items.length) return null;

  return (
    <section>
      <p className="text-xs font-bold uppercase text-gray-500">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="flex gap-2 text-xs text-gray-600">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};

const ExampleBlock = ({ title, items = [] }) => {
  if (!items.length) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-xs font-bold uppercase text-gray-500">{title}</p>
      <div className="mt-2 space-y-2">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`}>
            <p className="text-[11px] font-semibold text-gray-500">{item.label}</p>
            <p className="text-xs text-gray-800 leading-relaxed">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const AIFeatureHelpButton = ({ help }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!help) return null;

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white text-xs text-gray-600 hover:border-gray-900 hover:text-gray-900"
        aria-expanded={isOpen}
        aria-label="Lihat panduan fitur AI"
        title="Lihat panduan fitur AI"
      >
        <FontAwesomeIcon icon={faCircleQuestion} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-20 bg-black/20"
            onClick={() => setIsOpen(false)}
          />

          {/* Help panel - centered modal on mobile, dropdown on desktop */}
          <div className="fixed inset-4 z-30 m-auto max-h-[70vh] w-auto overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 text-left shadow-2xl sm:absolute sm:inset-auto sm:left-0 sm:top-9 sm:m-0 sm:max-h-[58vh] sm:w-[380px] sm:max-w-[calc(100vw-2rem)] sm:origin-top-left sm:rounded-lg sm:p-3 lg:w-[420px]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase text-gray-500">Panduan Fitur</p>
                <h2 className="mt-1 text-sm font-bold text-gray-900">{help.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Tutup panduan"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <div className="mt-3 space-y-4">
              {help.purpose && <p className="text-xs leading-relaxed text-gray-600">{help.purpose}</p>}
              <InfoList title="Kapan digunakan" items={help.whenToUse} />
              <InfoList title="Data yang perlu diisi" items={help.requiredInputs} />
              <ExampleBlock title="Contoh input" items={help.exampleInput} />
              <InfoList title="Contoh hasil AI" items={help.exampleOutput} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIFeatureHelpButton;
