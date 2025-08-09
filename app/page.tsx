import { Navigation } from "@/components/landing/navigation"
import { HeroSection } from "@/components/landing/hero-section"
import { FeaturesSection } from "@/components/landing/features-section"
import { WorkflowSection } from "@/components/landing/workflow-section"
import { TestimonialsSection } from "@/components/landing/testimonials-section"
import { IntegrationsSection } from "@/components/landing/integrations-section"
import { Footer } from "@/components/landing/footer"
import VideoBackground from "@/components/background/VideoBackground"

export default function Home() {
  return (
    <VideoBackground>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main>
          <HeroSection />
          <FeaturesSection />
          <WorkflowSection />
          <TestimonialsSection />
          <IntegrationsSection />
        </main>
        <Footer />
      </div>
    </VideoBackground>
  )
}
