import Navbar         from '@/components/landing/Navbar'
import HeroSection    from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import HowItWorks     from '@/components/landing/HowItWorks'
import Footer         from '@/components/landing/Footer'

export const metadata = {
  title: 'Agentic AI Career Coach — Your Personal Placement Mentor',
  description:
    'AI-powered career coaching platform. Resume analysis, mock interviews, skill gap detection, and personalized roadmaps — all in one place.',
}

export default function LandingPage() {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <Footer />
    </main>
  )
}
