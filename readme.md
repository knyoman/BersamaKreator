# NanoConnect – SME & Nano Influencer Matching Platform

## 📌 Project Overview

**Concept**: _“Tinder for UMKM & Nano Influencers”_

# 🚀 NANOCONNECT-APP

> Platform marketplace yang menghubungkan SME (Small Medium Enterprise) dengan Influencer untuk kampanye digital marketing

## 📋 Deskripsi Project

**NANOCONNECT** adalah platform yang memfasilitasi kolaborasi antara SME dengan Influencer untuk kampanye pemasaran digital. Platform ini memungkinkan SME untuk menemukan influencer yang sesuai dengan target pasar mereka, membuat campaign, dan melakukan review terhadap hasil kolaborasi.

## 🗂️ Struktur Database

### 📁 File Database SQL

| File                   | Deskripsi                                                  | Kapan Digunakan                              |
| ---------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| **database_setup.sql** | Schema database lengkap (tables, indexes, triggers, views) | ✅ Jalankan **PERTAMA** di Supabase          |
| **sample_data.sql**    | Sample data untuk testing (max 5 records per tabel)        | ✅ Jalankan **KEDUA** setelah setup          |
| **rls_policies.sql**   | Row Level Security policies untuk keamanan data            | ✅ Jalankan **KETIGA** untuk enable security |
| **useful_queries.sql** | Kumpulan query untuk analytics & reporting                 | 📊 Gunakan untuk analytics                   |

### 📚 File Dokumentasi

| File                     | Deskripsi                                   |
| ------------------------ | ------------------------------------------- |
| **QUICK_START.md**       | ⚡ Panduan cepat setup database (3 langkah) |
| **DATABASE_README.md**   | 📖 Dokumentasi lengkap database schema      |
| **database_diagrams.md** | 📊 Diagram visual (ERD, flow, architecture) |
| **specdb.sql**           | 📝 Spesifikasi awal database (referensi)    |

## 🎯 Fitur Database

### ✅ Tabel Utama (4 Tabel)

1. **users** - User management (Admin, SME, Influencer)
2. **influencers** - Profile & portfolio influencer
3. **orders** - Campaign management
4. **reviews** - Rating & review system

### 🔐 Keamanan

- ✅ Row Level Security (RLS) enabled
- ✅ Policies untuk setiap user role
- ✅ Helper functions untuk authorization
- ✅ Encrypted passwords

### ⚡ Fitur Otomatis

- ✅ Auto-update timestamp (`updated_at`)
- ✅ Auto-update rating influencer
- ✅ Auto-update total orders
- ✅ Triggers untuk maintain data consistency

### 🚀 Optimasi Performa

- ✅ Indexes pada kolom yang sering di-query
- ✅ Views untuk query kompleks
- ✅ Efficient foreign key relationships
- ✅ UUID sebagai primary key

## 🏁 Quick Start

### 1️⃣ Setup Database di Supabase

```bash
# Login ke Supabase Dashboard → SQL Editor

# Step 1: Run database_setup.sql
# (Copy-paste isi file dan klik Run)

# Step 2: Run sample_data.sql
# (Copy-paste isi file dan klik Run)

# Step 3: Run rls_policies.sql
# (Copy-paste isi file dan klik Run)
```

✅ **Done! Database siap digunakan**

### 2️⃣ Verifikasi Installation

```sql
SELECT
    'users' as table_name, COUNT(*) as total FROM users
UNION ALL
SELECT 'influencers', COUNT(*) FROM influencers
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;
```

**Expected Output:**

- users: 7 records
- influencers: 4 records
- orders: 7 records
- reviews: 5 records

## 🔑 Test Accounts

Semua user menggunakan password: `password123`

### Admin

- Email: `admin@nanoconnect.com`

### SME (2 accounts)

- `budi.sme@gmail.com`
- `siti.sme@gmail.com`

### Influencer (4 accounts)

- `andi.influencer@gmail.com` - Fashion & Lifestyle (125K followers, ⭐4.5)
- `rina.influencer@gmail.com` - Beauty & Skincare (85K followers, ⭐4.8)
- `dimas.foodie@gmail.com` - Food & Culinary (45K followers)
- `laras.tech@gmail.com` - Technology & Gadget (95K followers, ⭐4.6)

## 📊 Sample Queries

### Top Influencers

```sql
SELECT * FROM v_influencer_profiles
WHERE is_verified = true
ORDER BY rating_average DESC;
```

### Dashboard Statistics

```sql
SELECT
    (SELECT COUNT(*) FROM users WHERE user_type = 'sme') as total_sme,
    (SELECT COUNT(*) FROM influencers WHERE is_verified = true) as verified_influencers,
    (SELECT COUNT(*) FROM orders WHERE order_status = 'completed') as completed_orders;
```

**Lebih banyak query ada di:** `useful_queries.sql`

## 🎨 Database Schema (ERD)

```
USERS (Admin/SME/Influencer)
  ↓ (1:1 if influencer)
INFLUENCERS (Profile & Portfolio)
  ↓ (1:N)
ORDERS (Campaigns)
  ↓ (1:1 when completed)
REVIEWS (Rating & Comments)
  ↓ (auto-update)
INFLUENCERS (Stats updated)
```

**Diagram lengkap ada di:** `database_diagrams.md`

## 📖 Dokumentasi Lengkap

- **📌 Mulai di sini:** [QUICK_START.md](QUICK_START.md)
- **📚 Dokumentasi lengkap:** [DATABASE_README.md](DATABASE_README.md)
- **📊 Visual diagrams:** [database_diagrams.md](database_diagrams.md)
- **🔍 Analytics queries:** [useful_queries.sql](useful_queries.sql)

## 🛠️ Tech Stack

- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth
- **Security:** Row Level Security (RLS)
- **Storage:** Supabase Storage (untuk images)

## 📝 Notes

- ⚠️ Sample data hanya untuk development/testing
- ⚠️ Di production, ganti semua password dengan hash yang benar
- ⚠️ Pastikan RLS SELALU enabled di production
- ⚠️ Gunakan service_role key HANYA di backend/server-side

## 🔄 Next Steps

1. ✅ Setup database (sudah selesai)
2. 🔲 Integrasikan dengan frontend (React/Next.js)
3. 🔲 Implementasi authentication flow
4. 🔲 Setup file upload untuk profile images
5. 🔲 Implementasi real-time notifications
6. 🔲 Deploy ke production

## 📞 Support

Jika ada pertanyaan tentang database schema atau implementasi, silakan refer ke dokumentasi lengkap atau hubungi tim development.

---

**Version:** 1.0  
**Last Updated:** February 2026  
**Status:** ✅ Database Ready for Development

---

## 🎯 Business Requirements

### Core Features

- **Matching Algorithm**  
  Budget-based, niche-specific, dan location-aware matching
- **Target Users**  
  UMKM/SME dan nano influencer lokal
- **Low Latency**  
  Real-time data processing menggunakan edge computing

---

## ⚙️ Tech Stack & Infrastructure

### Frontend

- **Framework**: React.js + Vite
- **Deployment**: Tencent EdgeOne Pages
- **Development**: VS Code, EdgeOne CLI, IDE Plugin

### Tools

- **Code Editor**: VS Code
- **AI Assistant**: Copilot
- **LLM Model**: GPT / Claude

---

### Backend & Storage

- **Database**: Supabase
- **Edge Storage**: KV Storage (Cache)
- **Serverless**: Node Functions untuk business logic
- **AI Integration**: OpenAI untuk smart matching

### Authentication

- **Auth Service**: Supabase Auth
- **Method**: Third-party login integration

### Deployments

- EdgeOne Pages

---

## 🧱 Application Architecture

### Pages & Components

Homepage
├── About
├── Influencer Listing
├── Influencer Detail
├── Order / Booking System
├── AI Recommendations
├── Terms & Conditions
└── Authentication Pages

### Data Models

- **Influencer Profile**: Niche, rates, location, portfolio
- **SME Profile**: Budget, target audience, campaign requirements
- **Matching Score**: AI-calculated compatibility rating
