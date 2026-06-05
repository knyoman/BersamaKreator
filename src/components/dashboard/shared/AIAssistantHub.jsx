import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import AIFeatureHelpButton from './AIFeatureHelpButton';

const toolIconTones = [
  'bg-cyan-300 text-gray-950',
  'bg-amber-300 text-gray-950',
  'bg-rose-400 text-white',
  'bg-emerald-300 text-gray-950',
  'bg-violet-400 text-white',
  'bg-sky-300 text-gray-950',
  'bg-orange-300 text-gray-950',
  'bg-lime-300 text-gray-950',
  'bg-fuchsia-400 text-white',
  'bg-gray-900 text-white',
];

const AIAssistantHub = ({
  eyebrow,
  title,
  description,
  tools = [],
  activeToolId = null,
  onSelect,
  onBack,
  children,
}) => {
  const activeTool = tools.find((tool) => tool.id === activeToolId);

  if (activeTool) {
    return (
      <div className="ai-assistant-scope space-y-4">
        <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2.5">
          <div>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center text-[11px] font-semibold text-gray-600 hover:text-gray-900 mb-2.5"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-1.5" />
              Kembali ke pilihan AI
            </button>
            <p className="text-[11px] font-semibold text-gray-500 uppercase">{eyebrow}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{activeTool.title}</h1>
              <AIFeatureHelpButton help={activeTool.help} />
            </div>
            <p className="text-xs text-gray-600 mt-1 max-w-3xl">{activeTool.description}</p>
          </div>
        </header>

        {children}
      </div>
    );
  }

  return (
    <div className="ai-assistant-scope space-y-4">
      <header>
        <p className="text-[11px] font-semibold text-gray-500 uppercase">{eyebrow}</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{title}</h1>
        <p className="text-xs text-gray-600 mt-1 max-w-4xl">{description}</p>
      </header>

      <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {tools.map((tool, index) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => onSelect(tool.id)}
              className="group flex min-h-[82px] items-center gap-3.5 rounded-lg border border-gray-200 bg-white px-3.5 py-3.5 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/15"
            >
              <div className={`w-[46px] h-[46px] rounded-full flex shrink-0 items-center justify-center text-base ring-1 ring-gray-200 ${tool.tone || toolIconTones[index % toolIconTones.length]}`}>
                <FontAwesomeIcon icon={tool.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="ai-tool-title text-base font-semibold text-gray-900">{tool.title}</h2>
                <p className="ai-tool-description text-xs text-gray-500 leading-snug mt-1">
                  {tool.description}
                </p>
              </div>
              <FontAwesomeIcon
                icon={faChevronRight}
                className="shrink-0 text-xs text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-gray-900"
              />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AIAssistantHub;
