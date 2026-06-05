const createHelp = ({
  title,
  purpose,
  whenToUse,
  requiredInputs,
  exampleInput,
  exampleOutput,
}) => ({
  title,
  purpose,
  whenToUse,
  requiredInputs,
  exampleInput,
  exampleOutput,
});

export const smeAIHelpContent = {
  market_research: createHelp({
    title: 'Riset Pasar',
    purpose: 'Membantu UMKM membaca tren, masalah audiens, niat pencarian, dan peluang promosi sebelum membuat brief atau memilih influencer.',
    whenToUse: [
      'Saat ingin meluncurkan produk baru.',
      'Saat belum yakin angle promosi apa yang paling kuat.',
      'Saat ingin memahami kebutuhan audiens sebelum menentukan influencer.',
    ],
    requiredInputs: [
      'Industri, produk, atau layanan yang ingin dianalisis.',
      'Target audiens utama.',
      'Lokasi pasar dan rentang riset.',
      'Tujuan bisnis atau tujuan promosi.',
    ],
    exampleInput: [
      { label: 'Produk', value: 'Kopi susu botolan 250 ml untuk pekerja muda.' },
      { label: 'Target audiens', value: 'Perempuan dan laki-laki 20-32 tahun di Jakarta yang suka kopi praktis.' },
      { label: 'Tujuan', value: 'Mencari peluang promosi akhir bulan dan angle konten untuk influencer kuliner.' },
    ],
    exampleOutput: [
      'Tren: minuman praktis untuk kerja dan perjalanan pagi.',
      'Masalah audiens: ingin kopi enak, cepat dibeli, dan harga tetap masuk akal.',
      'Peluang: konten perbandingan ritual pagi sebelum dan sesudah bawa kopi botolan.',
    ],
  }),
  icp: createHelp({
    title: 'Profil Pelanggan Ideal',
    purpose: 'Membantu UMKM menentukan pelanggan paling potensial, alasan mereka membeli, keberatan yang mungkin muncul, dan pesan promosi yang cocok.',
    whenToUse: [
      'Sebelum membuat promosi influencer.',
      'Saat ingin mengubah review pembeli menjadi insight target pasar.',
      'Saat ingin membuat pesan promosi yang lebih tepat sasaran.',
    ],
    requiredInputs: [
      'Produk atau layanan utama.',
      'Data awal pelanggan seperti review, keluhan, pertanyaan, atau data order.',
      'Channel utama dan lokasi pasar.',
      'Tujuan pembuatan profil pelanggan.',
    ],
    exampleInput: [
      { label: 'Produk', value: 'Hampers Lebaran berisi cookies premium lokal.' },
      { label: 'Data pelanggan', value: 'Pembeli sering tanya apakah bisa custom kartu ucapan dan kirim ke banyak alamat.' },
      { label: 'Tujuan', value: 'Menentukan segmen pelanggan paling cocok untuk promosi lewat influencer keluarga.' },
    ],
    exampleOutput: [
      'Segmen utama: pekerja kantoran usia 25-40 tahun yang ingin kirim hadiah praktis.',
      'Pemicu beli: kemasan terlihat premium, bisa custom ucapan, pengiriman aman.',
      'Pesan: hadiah Lebaran yang personal tanpa repot mengurus packing dan kurir.',
    ],
  }),
  competitor_analysis: createHelp({
    title: 'Analisis Kompetitor',
    purpose: 'Membantu membandingkan posisi brand, penawaran, pesan, dan kelemahan kompetitor agar promosi punya pembeda yang jelas.',
    whenToUse: [
      'Saat ingin mengetahui pembeda brand sebelum membuat konten.',
      'Saat ada kompetitor yang lebih dikenal audiens.',
      'Saat ingin mencari celah konten dan positioning.',
    ],
    requiredInputs: [
      'Produk, brand, atau niche yang ingin dibandingkan.',
      'Nama kompetitor atau link referensi.',
      'Tujuan analisis.',
      'Bukti tambahan seperti review, caption, harga, atau observasi konten.',
    ],
    exampleInput: [
      { label: 'Subjek', value: 'Laundry kiloan premium di Jakarta Selatan.' },
      { label: 'Kompetitor', value: 'Laundry A fokus murah, Laundry B fokus express, Laundry C fokus parfum tahan lama.' },
      { label: 'Tujuan', value: 'Mencari pembeda untuk promosi influencer lokal.' },
    ],
    exampleOutput: [
      'Gap: kompetitor jarang membahas keamanan pakaian kerja dan bahan sensitif.',
      'Diferensiasi: laundry rapi, wangi ringan, dan aman untuk pakaian kantor.',
      'Konten: before-after pakaian kantor kusut menjadi siap dipakai meeting.',
    ],
  }),
  content_strategy: createHelp({
    title: 'Strategi Konten',
    purpose: 'Mengubah insight pasar menjadi pilar konten, angle, hook, CTA, dan rencana publikasi yang bisa dipakai untuk promosi UMKM.',
    whenToUse: [
      'Saat brief sudah ada tetapi ide konten belum rapi.',
      'Saat ingin memberi arahan konten ke influencer.',
      'Saat ingin membuat rencana konten mingguan.',
    ],
    requiredInputs: [
      'Produk, niche, atau tujuan promosi.',
      'Target audiens.',
      'Tujuan konten atau promosi.',
      'Platform dan durasi rencana.',
    ],
    exampleInput: [
      { label: 'Fokus', value: 'Promo bundling kopi susu botolan akhir pekan.' },
      { label: 'Target audiens', value: 'Pekerja muda 20-32 tahun yang suka nongkrong hemat.' },
      { label: 'Tujuan', value: 'Meningkatkan order WhatsApp dari konten influencer kuliner.' },
    ],
    exampleOutput: [
      'Pilar: ritual pagi, hemat akhir pekan, dan rekomendasi teman kantor.',
      'Hook: ngopi enak tanpa antre sebelum meeting pagi.',
      'Rencana: Reels review rasa, Story polling varian, Feed carousel promo bundling.',
    ],
  }),
  social_post: createHelp({
    title: 'Draf Konten Sosial',
    purpose: 'Membantu membuat hook, caption, isi naskah, CTA, dan variasi konten sosial dari satu ide produk atau promosi.',
    whenToUse: [
      'Saat butuh caption atau naskah konten siap pakai.',
      'Saat ingin memberi contoh naskah kepada influencer.',
      'Saat ingin membuat beberapa variasi gaya konten.',
    ],
    requiredInputs: [
      'Ide produk atau penawaran.',
      'Target audiens.',
      'Platform dan gaya bahasa.',
      'Tujuan konten.',
    ],
    exampleInput: [
      { label: 'Ide', value: 'Promo gratis ongkir untuk pembelian dua botol kopi susu.' },
      { label: 'Target audiens', value: 'Mahasiswa dan pekerja muda yang sering beli minuman lewat chat.' },
      { label: 'Tujuan', value: 'Mendorong order WhatsApp hari Jumat sampai Minggu.' },
    ],
    exampleOutput: [
      'Hook: akhir pekan jangan cuma rebahan, stok kopimu dulu.',
      'Caption: dua botol kopi susu favorit, gratis ongkir area Jakarta.',
      'CTA: chat admin sekarang dan pilih varian favoritmu.',
    ],
  }),
  email_campaign: createHelp({
    title: 'Rangkaian Email dan WhatsApp',
    purpose: 'Membantu membuat rangkaian pesan email atau WhatsApp, subjek, pembuka, CTA, dan respons keberatan pelanggan.',
    whenToUse: [
      'Saat ingin follow-up calon pembeli.',
      'Saat ingin mengirim promo bertahap.',
      'Saat ingin membuat pesan WhatsApp yang lebih rapi dan tidak terlalu hard selling.',
    ],
    requiredInputs: [
      'Produk atau penawaran.',
      'Segmen audiens.',
      'Tahap funnel dan channel.',
      'Tujuan promosi dan konteks brand.',
    ],
    exampleInput: [
      { label: 'Produk', value: 'Paket starter skincare lokal untuk kulit berminyak.' },
      { label: 'Audiens', value: 'Calon pembeli yang pernah tanya harga tetapi belum checkout.' },
      { label: 'Tujuan', value: 'Mengajak order pertama lewat WhatsApp tanpa terdengar memaksa.' },
    ],
    exampleOutput: [
      'Pesan 1: edukasi masalah kulit berminyak dan rekomendasi pemakaian.',
      'Pesan 2: bukti review pembeli dan jawaban soal keamanan produk.',
      'Pesan 3: CTA chat admin untuk konsultasi varian.',
    ],
  }),
  ad_copy: createHelp({
    title: 'Naskah Iklan',
    purpose: 'Membantu membuat angle iklan, headline, teks utama, CTA, batasan klaim, dan variasi untuk A/B test.',
    whenToUse: [
      'Saat ingin membuat iklan Meta Ads, TikTok Ads, atau marketplace.',
      'Saat ingin menguji beberapa angle pesan.',
      'Saat ingin membuat naskah iklan yang aman dari klaim berlebihan.',
    ],
    requiredInputs: [
      'Produk atau penawaran.',
      'Target audiens.',
      'Tujuan iklan dan platform.',
      'Konteks brand, batasan, dan catatan tambahan.',
    ],
    exampleInput: [
      { label: 'Produk', value: 'Paket laundry sepatu express 2 hari.' },
      { label: 'Target audiens', value: 'Mahasiswa dan pekerja aktif yang sering pakai sneakers putih.' },
      { label: 'Tujuan', value: 'Meningkatkan chat WhatsApp untuk booking laundry sepatu.' },
    ],
    exampleOutput: [
      'Angle: sepatu bersih tanpa menunggu lama.',
      'Headline: Sneakers kusam? Bersih lagi dalam 2 hari.',
      'CTA: booking jadwal cuci sepatu sekarang.',
    ],
  }),
  marketing_ops: createHelp({
    title: 'Rencana Operasional Marketing',
    purpose: 'Membantu mengubah promosi menjadi kalender kerja, checklist publikasi, pelacak aset, target metrik, dan kerangka laporan.',
    whenToUse: [
      'Saat promosi sudah siap dieksekusi.',
      'Saat perlu membagi tugas antara owner, admin, dan influencer.',
      'Saat ingin promosi punya jadwal dan metrik yang jelas.',
    ],
    requiredInputs: [
      'Nama promosi dan tanggal pelaksanaan.',
      'Workflow, channel utama, dan ritme kerja.',
      'Tujuan promosi dan target audiens.',
      'Aset, metrik, dan catatan eksekusi.',
    ],
    exampleInput: [
      { label: 'Nama promosi', value: 'Launch Bundling Kopi Susu Akhir Bulan.' },
      { label: 'Channel', value: 'Instagram, WhatsApp, dan konten influencer.' },
      { label: 'Metrik', value: 'Reach, chat WhatsApp, order selesai, dan biaya per lead.' },
    ],
    exampleOutput: [
      'Kalender: H-5 siapkan aset, H-3 approval konten, H publish Reels dan Story.',
      'Checklist: foto produk, brief influencer, UTM link, caption, dan template balasan admin.',
      'Laporan: hasil reach, chat masuk, order, insight, dan langkah berikutnya.',
    ],
  }),
  brief: createHelp({
    title: 'Pembuat Brief Promosi',
    purpose: 'Membantu UMKM menyusun brief promosi yang rapi untuk diberikan kepada influencer sebelum kerja sama dimulai.',
    whenToUse: [
      'Saat ingin mengirim arahan promosi ke influencer.',
      'Saat ingin merapikan tujuan, pesan utama, platform, budget, dan deadline.',
      'Saat ingin memastikan output konten tidak ambigu.',
    ],
    requiredInputs: [
      'Nama promosi dan produk atau brand.',
      'Tujuan promosi dan target audiens.',
      'Pesan utama, platform, anggaran, dan deadline.',
    ],
    exampleInput: [
      { label: 'Promosi', value: 'Launching Menu Kopi Susu Aren.' },
      { label: 'Pesan utama', value: 'Rasa ringan, cocok untuk teman kerja sore, harga terjangkau.' },
      { label: 'Output', value: '1 Reels review, 3 Story, dan caption dengan CTA order WhatsApp.' },
    ],
    exampleOutput: [
      'Brief berisi tujuan, target audiens, tone konten, pesan utama, deliverables, budget, dan deadline.',
      'Influencer mendapat arahan jelas tentang apa yang harus dibuat dan apa yang harus dihindari.',
    ],
  }),
  recommendations: createHelp({
    title: 'Rekomendasi Influencer',
    purpose: 'Membantu UMKM mencari influencer yang cocok berdasarkan budget, niche, target audiens, dan tujuan promosi.',
    whenToUse: [
      'Saat belum tahu influencer mana yang paling relevan.',
      'Saat ingin menyaring kandidat berdasarkan kebutuhan promosi.',
      'Saat ingin membandingkan beberapa profil sebelum menghubungi influencer.',
    ],
    requiredInputs: [
      'Tujuan promosi.',
      'Budget, niche, dan target audiens.',
      'Preferensi platform atau gaya konten.',
    ],
    exampleInput: [
      { label: 'Tujuan', value: 'Meningkatkan awareness kedai kopi baru di Jakarta Selatan.' },
      { label: 'Budget', value: 'Rp5.000.000.' },
      { label: 'Niche', value: 'Kuliner, lifestyle, dan tempat nongkrong.' },
    ],
    exampleOutput: [
      'Daftar influencer yang relevan dengan alasan kecocokan.',
      'Skor kecocokan berdasarkan niche, budget, lokasi, dan audiens.',
      'Saran langkah berikutnya untuk menghubungi kandidat.',
    ],
  }),
};

export const influencerAIHelpContent = {
  content_strategy: createHelp({
    title: 'Strategi Konten',
    purpose: 'Membantu influencer menyusun pilar, angle, hook, CTA, dan rencana konten sesuai niche dan karakter audiens.',
    whenToUse: [
      'Saat ingin membuat jadwal konten mingguan.',
      'Saat ingin menjaga konten tetap konsisten dengan niche.',
      'Saat ingin menyiapkan ide sebelum menerima promosi.',
    ],
    requiredInputs: [
      'Niche atau fokus konten.',
      'Target audiens.',
      'Tujuan konten.',
      'Platform dan durasi rencana.',
    ],
    exampleInput: [
      { label: 'Fokus', value: 'Review skincare lokal untuk kulit berminyak.' },
      { label: 'Target audiens', value: 'Perempuan 18-28 tahun yang baru mulai skincare routine.' },
      { label: 'Tujuan', value: 'Membuat konten edukatif yang tetap natural untuk sponsor.' },
    ],
    exampleOutput: [
      'Pilar: edukasi bahan aktif, review jujur, dan rutinitas pemakaian.',
      'Hook: kenapa kulit berminyak tetap butuh pelembap?',
      'Rencana: 3 Reels edukasi, 2 Story Q&A, 1 carousel rekomendasi.',
    ],
  }),
  market_research: createHelp({
    title: 'Riset Pasar',
    purpose: 'Membantu influencer membaca tren niche, masalah audiens, niat pencarian, dan peluang angle konten.',
    whenToUse: [
      'Saat ingin mencari ide konten yang sedang relevan.',
      'Saat ingin memahami kebutuhan followers.',
      'Saat ingin memilih promosi brand yang paling cocok.',
    ],
    requiredInputs: [
      'Niche atau fokus konten.',
      'Target audiens.',
      'Lokasi jika relevan.',
      'Tujuan riset.',
    ],
    exampleInput: [
      { label: 'Niche', value: 'Kuliner murah area Bandung.' },
      { label: 'Target audiens', value: 'Mahasiswa dan pekerja muda yang suka tempat makan hemat.' },
      { label: 'Tujuan', value: 'Mencari tren konten untuk Reels mingguan.' },
    ],
    exampleOutput: [
      'Tren: tempat makan hidden gem dan menu hemat akhir bulan.',
      'Masalah audiens: ingin rekomendasi jujur, harga jelas, dan lokasi mudah dicapai.',
      'Peluang: seri konten satu menu di bawah Rp25.000.',
    ],
  }),
  icp: createHelp({
    title: 'Profil Audiens Ideal',
    purpose: 'Membantu influencer memahami tipe audiens yang paling bernilai, kebutuhan mereka, dan promosi brand yang paling cocok.',
    whenToUse: [
      'Saat ingin memperjelas target konten.',
      'Saat ingin membuat proposal kerja sama yang lebih kuat.',
      'Saat ingin tahu brand apa yang cocok dengan followers.',
    ],
    requiredInputs: [
      'Niche atau karakter audiens.',
      'Data audiens seperti komentar, insight, dan konten paling ramai.',
      'Tujuan pembuatan profil audiens.',
    ],
    exampleInput: [
      { label: 'Niche', value: 'Beauty enthusiast pemula.' },
      { label: 'Data audiens', value: 'Followers sering tanya produk aman untuk pemula dan harga terjangkau.' },
      { label: 'Tujuan', value: 'Menentukan jenis brand skincare yang cocok untuk diajak kerja sama.' },
    ],
    exampleOutput: [
      'Audiens utama: pemula skincare yang butuh edukasi sederhana.',
      'Kebutuhan: rekomendasi aman, harga masuk akal, dan cara pakai jelas.',
      'Brand cocok: skincare lokal, sunscreen, moisturizer, dan basic routine.',
    ],
  }),
  competitor_analysis: createHelp({
    title: 'Analisis Kompetitor',
    purpose: 'Membantu influencer melihat perbedaan gaya konten, gap, dan peluang diferensiasi dari kreator pembanding.',
    whenToUse: [
      'Saat ingin memperkuat positioning kreator.',
      'Saat ingin mencari konten yang belum banyak dibahas.',
      'Saat ingin membuat profil kreator lebih unik untuk brand.',
    ],
    requiredInputs: [
      'Niche atau positioning kreator.',
      'Kreator pembanding atau akun referensi.',
      'Tujuan analisis.',
      'Bukti seperti konten populer, komentar, atau gaya visual.',
    ],
    exampleInput: [
      { label: 'Subjek', value: 'Kreator kuliner murah area Bandung.' },
      { label: 'Kompetitor', value: 'Akun A fokus tempat viral, akun B fokus street food, akun C fokus cafe estetik.' },
      { label: 'Tujuan', value: 'Mencari pembeda konten agar lebih mudah dilirik brand lokal.' },
    ],
    exampleOutput: [
      'Gap: belum banyak kreator membahas harga detail dan pengalaman datang sendiri.',
      'Diferensiasi: review jujur, porsi, harga, dan rekomendasi jam datang.',
      'Peluang: seri konten hemat akhir bulan untuk mahasiswa.',
    ],
  }),
  social_post: createHelp({
    title: 'Draf Konten Sosial',
    purpose: 'Membantu influencer membuat hook, caption, script, CTA, dan variasi konten dari satu ide utama.',
    whenToUse: [
      'Saat butuh caption atau script cepat.',
      'Saat ingin menjaga konten sponsor tetap natural.',
      'Saat ingin membuat beberapa variasi sebelum posting.',
    ],
    requiredInputs: [
      'Ide konten atau insight.',
      'Target audiens.',
      'Gaya konten dan platform.',
      'Tujuan posting.',
    ],
    exampleInput: [
      { label: 'Ide', value: 'Review jujur sunscreen lokal untuk kulit berminyak.' },
      { label: 'Target audiens', value: 'Perempuan 18-28 tahun yang takut sunscreen terasa lengket.' },
      { label: 'Tujuan', value: 'Membuat konten sponsor yang tetap edukatif dan tidak hard selling.' },
    ],
    exampleOutput: [
      'Hook: sunscreen yang tidak bikin wajah seperti kilang minyak?',
      'Script: pembuka masalah, tes tekstur, pemakaian 4 jam, lalu kesimpulan jujur.',
      'CTA: simpan dulu kalau kamu sedang cari sunscreen ringan.',
    ],
  }),
  content: createHelp({
    title: 'Ide dan Caption Konten',
    purpose: 'Membantu influencer membuat caption, ide konten, hook, dan variasi posting berdasarkan brief dari UMKM.',
    whenToUse: [
      'Saat menerima brief promosi dari UMKM.',
      'Saat butuh beberapa opsi caption.',
      'Saat ingin mengubah brief menjadi ide konten yang siap dieksekusi.',
    ],
    requiredInputs: [
      'Ringkasan brief UMKM.',
      'Platform, gaya bahasa, dan target audiens.',
      'Catatan tambahan atau batasan konten.',
    ],
    exampleInput: [
      { label: 'Brief', value: 'UMKM kopi susu ingin konten Reels untuk promo bundling akhir pekan.' },
      { label: 'Target audiens', value: 'Pekerja muda dan mahasiswa yang suka minuman praktis.' },
      { label: 'Catatan', value: 'Jangan terlalu hard selling, CTA halus ke WhatsApp.' },
    ],
    exampleOutput: [
      'Caption dengan hook, manfaat produk, dan CTA halus.',
      '3 ide konten: review rasa, ritual pagi, dan ajakan order bareng teman.',
      'Tips eksekusi: ambil shot close-up botol dan momen minum setelah kerja.',
    ],
  }),
  proposal_reply: createHelp({
    title: 'Balasan Promosi UMKM',
    purpose: 'Membantu influencer membuat balasan profesional untuk proposal, brief, atau pesan kerja sama dari UMKM.',
    whenToUse: [
      'Saat ingin membalas tawaran promosi dengan sopan.',
      'Saat ingin meminta detail tambahan tanpa terlihat kaku.',
      'Saat ingin menerima atau menegosiasikan kerja sama.',
    ],
    requiredInputs: [
      'Ringkasan pesan atau brief dari UMKM.',
      'Platform dan gaya balasan.',
      'Catatan seperti harga, deadline, atau hal yang perlu dikonfirmasi.',
    ],
    exampleInput: [
      { label: 'Brief', value: 'UMKM skincare ingin 1 Reels dan 3 Story untuk launch produk baru.' },
      { label: 'Catatan', value: 'Tanyakan deadline, contoh produk, konsep yang diinginkan, dan revisi.' },
      { label: 'Tone', value: 'Profesional dan ramah.' },
    ],
    exampleOutput: [
      'Balasan pembuka yang mengapresiasi tawaran kerja sama.',
      'Konfirmasi minat dan ketersediaan jadwal.',
      'Daftar pertanyaan singkat tentang brief, deadline, deliverables, revisi, dan pembayaran.',
    ],
  }),
};

export const attachAIHelpContent = (tools, helpContent) => (
  tools.map((tool) => ({
    ...tool,
    help: helpContent[tool.id],
  }))
);
