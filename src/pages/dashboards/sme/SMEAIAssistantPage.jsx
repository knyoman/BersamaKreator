import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faBullseye,
  faEnvelopeOpenText,
  faFileLines,
  faMagicWandSparkles,
  faMagnifyingGlassChart,
  faObjectGroup,
  faPenNib,
  faRankingStar,
  faRoute,
  faSearch,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons';
import AIAssistantHub from '../../../components/dashboard/shared/AIAssistantHub';
import AdCopyAgentComposer from '../../../components/dashboard/shared/AdCopyAgentComposer';
import CompetitorAnalysisAgentComposer from '../../../components/dashboard/shared/CompetitorAnalysisAgentComposer';
import ContentStrategyAgentComposer from '../../../components/dashboard/shared/ContentStrategyAgentComposer';
import EmailCampaignAgentComposer from '../../../components/dashboard/shared/EmailCampaignAgentComposer';
import ICPAgentComposer from '../../../components/dashboard/shared/ICPAgentComposer';
import MarketingOpsAgentComposer from '../../../components/dashboard/shared/MarketingOpsAgentComposer';
import MarketResearchAgentComposer from '../../../components/dashboard/shared/MarketResearchAgentComposer';
import SocialPostAgentComposer from '../../../components/dashboard/shared/SocialPostAgentComposer';
import { attachAIHelpContent, smeAIHelpContent } from '../../../data/aiAssistantHelpContent';
import SMEAIBriefAssistantPage from './SMEAIBriefAssistantPage';

const smeAITools = attachAIHelpContent([
  {
    id: 'market_research',
    title: 'Riset Pasar',
    description: 'Temukan tren, masalah audiens, niat pencarian, dan peluang promosi sebelum memilih influencer.',
    meta: 'Asisten riset pasar',
    icon: faMagnifyingGlassChart,
    tone: 'bg-cyan-300 text-gray-950',
  },
  {
    id: 'icp',
    title: 'Profil Pelanggan Ideal',
    description: 'Bangun profil pelanggan ideal, segmen bernilai, keberatan, dan pesan promosi yang tepat.',
    meta: 'Asisten profil pelanggan',
    icon: faBullseye,
    tone: 'bg-amber-300 text-gray-950',
  },
  {
    id: 'competitor_analysis',
    title: 'Analisis Kompetitor',
    description: 'Bandingkan posisi, penawaran, pesan, dan gap konten agar promosi punya pembeda.',
    meta: 'Asisten analisis kompetitor',
    icon: faRankingStar,
    tone: 'bg-red-400 text-white',
  },
  {
    id: 'content_strategy',
    title: 'Strategi Konten',
    description: 'Susun pilar, angle, CTA, dan rencana konten yang bisa dipakai untuk promosi UMKM.',
    meta: 'Asisten strategi konten',
    icon: faObjectGroup,
    tone: 'bg-emerald-300 text-gray-950',
  },
  {
    id: 'social_post',
    title: 'Draf Konten Sosial',
    description: 'Ubah ide produk atau promosi menjadi hook, caption, naskah, dan CTA siap pakai.',
    meta: 'Asisten draf konten',
    icon: faPenNib,
    tone: 'bg-violet-400 text-white',
  },
  {
    id: 'email_campaign',
    title: 'Rangkaian Email dan WhatsApp',
    description: 'Buat subjek, rangkaian email atau WhatsApp, jawaban keberatan, dan CTA follow-up.',
    meta: 'Asisten pesan promosi',
    icon: faEnvelopeOpenText,
    tone: 'bg-sky-300 text-gray-950',
  },
  {
    id: 'ad_copy',
    title: 'Naskah Iklan',
    description: 'Buat angle iklan, headline, isi iklan, CTA, batasan klaim, dan variasi untuk A/B test.',
    meta: 'Asisten naskah iklan',
    icon: faBullhorn,
    tone: 'bg-orange-300 text-gray-950',
  },
  {
    id: 'marketing_ops',
    title: 'Rencana Operasional Marketing',
    description: 'Susun kalender promosi, checklist publikasi, pelacak aset, metrik, dan kerangka laporan.',
    meta: 'Asisten operasional marketing',
    icon: faRoute,
    tone: 'bg-lime-300 text-gray-950',
  },
  {
    id: 'brief',
    title: 'Pembuat Brief Promosi',
    description: 'Buat ringkasan promosi, target audiens, pesan utama, arahan konten, dan output yang diharapkan.',
    meta: 'Susun brief',
    icon: faFileLines,
    tone: 'bg-fuchsia-400 text-white',
  },
  {
    id: 'recommendations',
    title: 'AI Rekomendasi Influencer',
    description: 'Temukan influencer yang sesuai berdasarkan budget, niche, target audiens, dan tujuan promosi.',
    meta: 'Cari kandidat',
    icon: faUsersGear,
    tone: 'bg-gray-900 text-white',
  },
], smeAIHelpContent);

const SMEAIRecommendationsPanel = () => (
  <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
    <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-center">
      <div>
        <div className="w-12 h-12 rounded-lg bg-gray-900 text-white flex items-center justify-center">
          <FontAwesomeIcon icon={faMagicWandSparkles} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mt-5">Rekomendasi Influencer Berbasis AI</h2>
        <p className="text-gray-600 mt-2 leading-relaxed">
          Masukkan budget, niche, target audiens, dan tujuan promosi. Sistem akan mencocokkan profil influencer
          dengan kebutuhan promosi UMKM.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-5">
          {['Budget', 'Niche', 'Target Audiens'].map((item) => (
            <div key={item} className="rounded-lg bg-gray-50 border border-gray-100 p-3">
              <p className="text-sm font-semibold text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
        <p className="text-sm font-semibold text-gray-500 uppercase">Fitur AI</p>
        <p className="text-lg font-bold text-gray-900 mt-2">Buka form rekomendasi</p>
        <p className="text-sm text-gray-500 mt-2">
          Fitur rekomendasi sudah memakai backend AI yang sama dan tetap membutuhkan login UMKM.
        </p>
        <Link to="/ai-recommendations" className="btn btn-primary w-full inline-flex items-center justify-center mt-5">
          <FontAwesomeIcon icon={faSearch} className="mr-2" />
          Mulai Rekomendasi
        </Link>
      </div>
    </div>
  </section>
);

const SMEAIAssistantPage = () => {
  const [activeToolId, setActiveToolId] = useState(null);

  return (
    <AIAssistantHub
      eyebrow="Asisten AI"
      title="Pilih Fitur Asisten AI"
      description="Gunakan AI untuk menyusun brief promosi dan menemukan influencer yang sesuai untuk kebutuhan UMKM."
      tools={smeAITools}
      activeToolId={activeToolId}
      onSelect={setActiveToolId}
      onBack={() => setActiveToolId(null)}
    >
      {activeToolId === 'market_research' && <MarketResearchAgentComposer role="sme" />}
      {activeToolId === 'icp' && <ICPAgentComposer role="sme" />}
      {activeToolId === 'competitor_analysis' && <CompetitorAnalysisAgentComposer role="sme" />}
      {activeToolId === 'content_strategy' && <ContentStrategyAgentComposer role="sme" />}
      {activeToolId === 'social_post' && <SocialPostAgentComposer role="sme" />}
      {activeToolId === 'email_campaign' && <EmailCampaignAgentComposer />}
      {activeToolId === 'ad_copy' && <AdCopyAgentComposer />}
      {activeToolId === 'marketing_ops' && <MarketingOpsAgentComposer />}
      {activeToolId === 'brief' && <SMEAIBriefAssistantPage embedded />}
      {activeToolId === 'recommendations' && <SMEAIRecommendationsPanel />}
    </AIAssistantHub>
  );
};

export default SMEAIAssistantPage;
