import { useState } from 'react'
import Header from './components/Header.jsx'
import FloatingDecorations from './components/FloatingDecorations.jsx'
import Hero from './components/Hero.jsx'
import CTASection from './components/CTASection.jsx'
import TrustBar from './components/TrustBar.jsx'
import Features from './components/Features.jsx'
import Footer from './components/Footer.jsx'
import EmailGate from './components/EmailGate.jsx'

export default function App() {
  const [gateOpen, setGateOpen] = useState(false)
  const [gateReason, setGateReason] = useState('premium')

  function openGate(reason = 'premium') {
    setGateReason(reason)
    setGateOpen(true)
  }

  return (
    <>
      <Header />
      <main>
        <FloatingDecorations />
        <Hero onPremiumClick={() => openGate('premium')} />
        <CTASection onPremiumClick={() => openGate('premium')} onDemoClick={() => openGate('demo')} />
        <TrustBar />
        <Features />
      </main>
      <Footer />
      <EmailGate open={gateOpen} reason={gateReason} onClose={() => setGateOpen(false)} />
    </>
  )
}
