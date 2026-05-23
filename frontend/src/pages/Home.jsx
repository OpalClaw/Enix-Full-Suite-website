import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import HeroSection from '../components/public/HeroSection';
import ServiceCards from '../components/public/ServiceCards';
import TrustSection from '../components/public/TrustSection';
import ReviewsPreview from '../components/public/ReviewsPreview';
import CTASection from '../components/public/CTASection';
import LeadForm from '../components/public/LeadForm';

export default function Home() {
  usePageTitle('');
  return (
    <div>
      <HeroSection />
      <ServiceCards />
      <TrustSection />
      <ReviewsPreview />

      {/* Quick Lead Form */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-2">Get Started</p>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground mb-4">
                Request Your Free Exterior Estimate
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                From roof replacements and storm restoration to siding, windows, and doors, we make the process simple. Tell us what you need and we’ll schedule a free inspection fast.
              </p>
              <div className="space-y-4">
                {[
                  "Free property inspection",
                  "Detailed written estimate",
                  "Insurance claim assistance",
                  "Flexible financing options",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-navy-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <LeadForm compact />
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}