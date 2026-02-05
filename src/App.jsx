import { Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'

// Temporary placeholder components
const About = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">About NANOCONNECT</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>
const InfluencerListing = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">Find Influencers</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>
const InfluencerDetail = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">Influencer Profile</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>
const OrderSystem = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">Create Order</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>
const AIRecommendations = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">AI Recommendations</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>
const Terms = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">Terms & Conditions</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>
const Login = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">Login</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>
const Register = () => <div className="section-padding container-custom"><h1 className="text-4xl font-bold">Register</h1><p className="mt-4 text-gray-600">Coming soon...</p></div>

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
