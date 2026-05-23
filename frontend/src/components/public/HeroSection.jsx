import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-[88vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1632759145351-1d592919f522?w=1920&q=80"
          alt="Professional roofing"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-navy-900/85" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <p className="text-silver text-xs font-semibold uppercase tracking-widest mb-5">TENNESSEE'S TRUSTED ROOFING EXPERTS</p>

          <h1 className="font-heading font-black text-5xl sm:text-6xl lg:text-7xl text-white leading-none mb-6">
            TOP COMMERCIAL<br />ROOFING CONTRACTOR<br /><span className="text-silver">IN TENNESSEE</span>
          </h1>

          <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-xl">
            Your Local Roofing Expert. Commercial and residential roofing, siding, gutters, and windows done right the first time. Based in Knoxville, serving all of Tennessee.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/contact">
              <Button size="lg" className="bg-navy-500 hover:bg-navy-600 text-white font-heading font-bold text-base px-8 h-13">
                Get Free Quote
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="tel:+18656853649" aria-label="Call (865) 685-ENIX">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-heading font-semibold text-base px-8 h-13">
                <Shield className="w-4 h-4 mr-2" /> Call (865) 685-ENIX
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-8 mt-14 pt-8 border-t border-white/10">
            {[
              { value: "500+", label: "Projects Completed" },
              { value: "15+", label: "Years Experience" },
              { value: "5★", label: "Google Rating" },
              { value: "24/7", label: "Storm Response" },
            ].map((badge) => (
              <div key={badge.label}>
                <p className="text-3xl font-heading font-black text-white">{badge.value}</p>
                <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">{badge.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}