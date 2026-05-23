import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function PrivacyPolicy() {
  usePageTitle('Privacy Policy');

  return (
    <div className="bg-background">
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold text-navy-500 uppercase tracking-widest mb-3">
              Legal
            </p>
            <h1 className="font-heading font-black text-4xl sm:text-5xl mb-6">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Last updated: January 2026
            </p>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <h2 className="font-heading font-bold text-2xl mt-8">1. Information We Collect</h2>
              <p>
                Enix Exteriors collects information you provide when you request a quote, schedule an
                inspection, or contact us, including your name, address, phone number, email, and
                project details. We also collect basic site usage data to improve our website.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">2. How We Use Your Information</h2>
              <p>
                We use your information solely to provide our roofing and exterior services, schedule
                appointments, send project updates, deliver estimates and invoices, and follow up on
                inquiries. We do not sell or rent your personal information to third parties.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">3. TCPA Consent</h2>
              <p>
                By providing your phone number and submitting a form on this site, you consent to be
                contacted by Enix Exteriors via phone, SMS, or email regarding your inquiry. Standard
                messaging rates may apply. You may opt out at any time by replying STOP or contacting
                us directly.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">4. Data Security</h2>
              <p>
                We use industry-standard security measures including HTTPS encryption, secure form
                submission, and access controls to protect your information. Customer payment data is
                handled through PCI-compliant third-party processors.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">5. Cookies</h2>
              <p>
                Our site uses essential cookies for session management and basic analytics. We do not
                use advertising or tracking cookies that profile you across other sites.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">6. Your Rights</h2>
              <p>
                You may request a copy of the personal information we hold, ask us to correct or delete
                it, or opt out of communications at any time. Contact us at{' '}
                <a href="mailto:info@enixexteriors.com" className="text-navy-500 underline">
                  info@enixexteriors.com
                </a>{' '}
                or call (865) 685-ENIX.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">7. Contact</h2>
              <p>
                Enix Exteriors<br />
                Knoxville, TN<br />
                Phone: (865) 685-ENIX<br />
                Email: info@enixexteriors.com
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
