import FloatingDecorations from '../FloatingDecorations.jsx'
import Hero from '../Hero.jsx'
import CTASection from '../CTASection.jsx'
import TrustBar from '../TrustBar.jsx'
import Features from '../Features.jsx'
import EmailGate from '../Emailgate.jsx'
import { useState } from 'react'
export function Home() {
  const [gateOpen, setGateOpen] = useState(false)
  const [gateReason, setGateReason] = useState('premium')
  
  function openGate(reason = 'premium') {
    setGateReason(reason)
    setGateOpen(true)
  }
  return (
    <main>
        <FloatingDecorations />
        <Hero onPremiumClick={() => openGate('premium')} />
        <CTASection onPremiumClick={() => openGate('premium')} onDemoClick={() => openGate('demo')} />
        <TrustBar />
        <Features />
        <EmailGate open={gateOpen} reason={gateReason} onClose={() => setGateOpen(false)} />
      </main>
      
  )
}