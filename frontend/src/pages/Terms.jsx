import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Terms() {
  usePageTitle('Terms of Service');

  return (
    <div className="bg-background">
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-xs font-semibold text-navy-500 uppercase tracking-widest mb-3">
              Legal
            </p>
            <h1 className="font-heading font-black text-4xl sm:text-5xl mb-6">Terms of Service</h1>
            <p className="text-sm text-muted-foreground mb-8">Last updated: January 2026</p>

            <div className="prose prose-lg max-w-none space-y-6 text-foreground">
              <h2 className="font-heading font-bold text-2xl mt-8">1. Acceptance of Terms</h2>
              <p>
                By accessing this website or engaging Enix Exteriors for services, you agree to these
                Terms of Service. If you do not agree, please do not use this site or our services.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">2. Services</h2>
              <p>
                Enix Exteriors provides roofing, siding, windows, doors, and storm-damage repair
                services in Tennessee. All work is performed by licensed and insured professionals
                in accordance with Tennessee state law and manufacturer specifications.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">3. Estimates and Quotes</h2>
              <p>
                Estimates provided through this website or by our team are non-binding until a signed
                contract is executed. Final pricing is determined after an on-site inspection. Quotes
                are typically valid for 30 days unless otherwise stated.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">4. Warranties</h2>
              <p>
                Workmanship warranties and manufacturer warranties are provided in writing at the
                completion of each project. Coverage details, exclusions, and transfer terms are
                specified in your project contract.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">5. Insurance Claims</h2>
              <p>
                If your project involves an insurance claim, Enix Exteriors will work with your
                insurance carrier as authorized by you. We do not waive deductibles or engage in any
                practice that violates Tennessee law or your insurance policy.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">6. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Enix Exteriors' liability for any claim
                arising from services performed is limited to the amount paid for those services.
                We are not liable for indirect, incidental, or consequential damages.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">7. Use of This Website</h2>
              <p>
                Content on this site is for informational purposes. You may not copy, reproduce, or
                redistribute content without written permission. Submitting false information through
                forms is prohibited.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">8. Governing Law</h2>
              <p>
                These terms are governed by the laws of the State of Tennessee. Any disputes shall be
                resolved in the courts of Knox County, Tennessee.
              </p>

              <h2 className="font-heading font-bold text-2xl mt-8">9. Contact</h2>
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
