import { useState } from 'react'
import Header from './Header.jsx'
import FloatingDecorations from './FloatingDecorations.jsx'
import Hero from './Hero.jsx'
import CTASection from './CTASection.jsx'
import TrustBar from './TrustBar.jsx'
import Features from './Features.jsx'
import Footer from './Footer.jsx'
import EmailGate from './Emailgate.jsx'

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
