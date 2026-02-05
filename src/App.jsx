import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import InfluencerListing from './pages/InfluencerListing'
import InfluencerDetail from './pages/InfluencerDetail'
import OrderSystem from './pages/OrderSystem'
import About from './pages/About'
import AIRecommendations from './pages/AIRecommendations'
import Terms from './pages/Terms'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<About />} />
          <Route path="/influencers" element={<InfluencerListing />} />
          <Route path="/influencer/:id" element={<InfluencerDetail />} />
          <Route path="/order/:influencerId" element={<OrderSystem />} />
          <Route path="/ai-recommendations" element={<AIRecommendations />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
