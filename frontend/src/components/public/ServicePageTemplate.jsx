import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Phone, CheckCircle2 } from 'lucide-react';
import LeadForm from './LeadForm';
import CTASection from './CTASection';
import { motion } from 'framer-motion';

export default function ServicePageTemplate({ title, subtitle, description, image, features, benefits, defaultService }) {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-silver font-semibold text-xs uppercase tracking-widest mb-4">{subtitle}</p>
            <h1 className="font-heading font-bold text-5xl sm:text-6xl text-white mb-5">{title}</h1>
            <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">{description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-navy-500 hover:bg-navy-600 text-white font-heading font-bold px-8 h-13">
                  Get Free Estimate <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a aria-label="Call Enix Exteriors" href="tel:+18656853649">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-heading font-semibold px-8 h-13">
                  <Phone className="w-5 h-5 mr-2" /> (865) 685-ENIX
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      {features && (
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Card className="p-6 border-0 shadow-md h-full hover:shadow-lg transition-shadow">
                    <feature.icon className="w-10 h-10 text-navy-500 mb-4" />
                    <h3 className="font-heading font-bold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits + Form */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="font-heading font-bold text-3xl mb-6">Why Choose Enix Exteriors</h2>
              <div className="space-y-4">
                {(benefits || [
                  "Licensed and insured professionals",
                  "Premium materials with manufacturer warranties",
                  "Transparent pricing with no hidden fees",
                  "Clean job sites and respectful crews",
                  "Insurance claim assistance",
                  "Flexible financing available",
                ]).map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-navy-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <LeadForm defaultService={defaultService} />
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}