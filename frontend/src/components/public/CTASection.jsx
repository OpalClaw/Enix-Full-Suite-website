import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
          alt="Beautiful home exterior"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-navy-900/75" />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-heading font-bold text-3xl sm:text-5xl text-white mb-5 leading-tight">
          Ready to Transform Your Property?
        </h2>
        <p className="text-white/80 text-base mb-10 max-w-xl mx-auto">
          Get a free, no-obligation estimate from Knoxville's most trusted exterior contractor. We'll inspect your property and provide a detailed proposal.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/contact">
            <Button size="lg" className="bg-navy-500 hover:bg-navy-600 text-white font-heading font-bold px-8 h-13">
              Request Free Estimate <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <a aria-label="Call Enix Exteriors" href="tel:+18656853649">
            <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-heading font-semibold px-8 h-13">
              <Phone className="w-5 h-5 mr-2" /> (865) 685-ENIX
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}