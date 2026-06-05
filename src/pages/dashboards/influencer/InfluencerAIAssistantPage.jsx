import { useMemo, useState } from 'react';
import {
  faBullseye,
  faHandshake,
  faLightbulb,
  faMagnifyingGlassChart,
  faObjectGroup,
  faPenNib,
  faRankingStar,
} from '@fortawesome/free-solid-svg-icons';
import AIAssistantHub from '../../../components/dashboard/shared/AIAssistantHub';
import CompetitorAnalysisAgentComposer from '../../../components/dashboard/shared/CompetitorAnalysisAgentComposer';
import ContentStrategyAgentComposer from '../../../components/dashboard/shared/ContentStrategyAgentComposer';
import ICPAgentComposer from '../../../components/dashboard/shared/ICPAgentComposer';
import MarketResearchAgentComposer from '../../../components/dashboard/shared/MarketResearchAgentComposer';
import SocialPostAgentComposer from '../../../components/dashboard/shared/SocialPostAgentComposer';
import InfluencerAIAssistantComposer from '../../../components/dashboard/influencer/InfluencerAIAssistantComposer';
import { attachAIHelpContent, influencerAIHelpContent } from '../../../data/aiAssistantHelpContent';
import { createEmptyAIAssistantForm } from '../../../features/influencer/aiAssistant';

const influencerAITools = attachAIHelpContent([
  {
    id: 'content_strategy',
    title: 'Strategi Konten',
    description: 'Susun pilar, angle, hook, CTA, dan rencana mingguan berdasarkan niche dan target audiens.',
    meta: 'Asisten strategi konten',
    icon: faObjectGroup,
    tone: 'bg-emerald-300 text-gray-950',
  },
  {
    id: 'market_research',
    title: 'Riset Pasar',
    description: 'Temukan tren niche, masalah audiens, niat pencarian, dan peluang angle konten.',
    meta: 'Asisten riset pasar',
    icon: faMagnifyingGlassChart,
    tone: 'bg-cyan-300 text-gray-950',
  },
  {
    id: 'icp',
    title: 'Profil Audiens Ideal',
    description: 'Pahami profil audiens ideal, kebutuhan, keberatan, dan promosi brand yang paling cocok.',
    meta: 'Asisten profil audiens',
    icon: faBullseye,
    tone: 'bg-amber-300 text-gray-950',
  },
  {
    id: 'competitor_analysis',
    title: 'Analisis Kompetitor',
    description: 'Bandingkan kreator pembanding, gap konten, dan peluang diferensiasi di niche Anda.',
    meta: 'Asisten analisis kompetitor',
    icon: faRankingStar,
    tone: 'bg-red-400 text-white',
  },
  {
    id: 'social_post',
    title: 'Draf Konten Sosial',
    description: 'Buat hook, caption, naskah, CTA, dan variasi gaya dari satu ide utama.',
    meta: 'Asisten draf konten',
    icon: faPenNib,
    tone: 'bg-violet-400 text-white',
  },
  {
    id: 'content',
    title: 'AI Konten',
    description: 'Buat caption, ide konten, hook, dan variasi posting untuk kebutuhan promosi.',
    meta: 'Caption dan ide konten',
    icon: faLightbulb,
    tone: 'bg-lime-300 text-gray-950',
  },
  {
    id: 'proposal_reply',
    title: 'Balasan Promosi UMKM',
    description: 'Buat balasan profesional untuk proposal, brief, atau pesan promosi dari UMKM.',
    meta: 'Balasan proposal',
    icon: faHandshake,
    tone: 'bg-sky-300 text-gray-950',
  },
], influencerAIHelpContent);

const createInitialFormForTool = (toolId) => {
  const baseForm = createEmptyAIAssistantForm();

  if (toolId === 'proposal_reply') {
    return {
      ...baseForm,
      mode: 'proposal_reply',
      tone: 'professional',
    };
  }

  return {
    ...baseForm,
    mode: 'caption',
    platform: 'instagram_reels',
    tone: 'friendly',
  };
};

const getAllowedModesForTool = (toolId) => {
  if (toolId === 'proposal_reply') {
    return ['proposal_reply'];
  }

  return ['caption', 'content_ideas'];
};

const InfluencerAIAssistantPage = () => {
  const [activeToolId, setActiveToolId] = useState(null);
  const initialForm = useMemo(
    () => (activeToolId && !['content_strategy', 'market_research', 'icp', 'competitor_analysis', 'social_post'].includes(activeToolId) ? createInitialFormForTool(activeToolId) : null),
    [activeToolId],
  );

  return (
    <AIAssistantHub
      eyebrow="Asisten AI"
      title="Pilih Fitur Asisten AI"
      description="Gunakan AI untuk membantu pekerjaan influencer dari sisi konten maupun komunikasi promosi."
      tools={influencerAITools}
      activeToolId={activeToolId}
      onSelect={setActiveToolId}
      onBack={() => setActiveToolId(null)}
    >
      {activeToolId === 'content_strategy' && (
        <ContentStrategyAgentComposer role="influencer" />
      )}

      {activeToolId === 'market_research' && (
        <MarketResearchAgentComposer role="influencer" />
      )}

      {activeToolId === 'icp' && (
        <ICPAgentComposer role="influencer" />
      )}

      {activeToolId === 'competitor_analysis' && (
        <CompetitorAnalysisAgentComposer role="influencer" />
      )}

      {activeToolId === 'social_post' && (
        <SocialPostAgentComposer role="influencer" />
      )}

      {activeToolId && !['content_strategy', 'market_research', 'icp', 'competitor_analysis', 'social_post'].includes(activeToolId) && (
        <InfluencerAIAssistantComposer
          key={activeToolId}
          initialForm={initialForm}
          allowedModes={getAllowedModesForTool(activeToolId)}
        />
      )}
    </AIAssistantHub>
  );
};

export default InfluencerAIAssistantPage;
