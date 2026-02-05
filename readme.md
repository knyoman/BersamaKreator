# NanoConnect – SME & Nano Influencer Matching Platform

## 📌 Project Overview

**Concept**: _“Tinder for UMKM & Nano Influencers”_

NanoConnect adalah platform yang menghubungkan UMKM/SME dengan nano influencer lokal berdasarkan **budget**, **niche**, dan **target audience**.

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
- **Database**: Supabase
- **icon**: gunakan fontawesome sebagai icon.
- **css framework**: tailwindcss
- **template**: gunakan template dari tailwindcss

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

--- Homepage (bagian hero gunakan headline besar dan jangan bagikan dua layar )
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
