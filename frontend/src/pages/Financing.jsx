import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card } from '@/components/ui/card';
import { DollarSign, Clock, CreditCard, Shield, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CTASection from '../components/public/CTASection';
import { motion } from 'framer-motion';

const plans = [
  { title: "Same-As-Cash", term: "12 Months", desc: "No interest if paid in full within 12 months. Perfect for small to mid-size projects.", highlight: true },
  { title: "Low Monthly", term: "36-60 Months", desc: "Affordable monthly payments spread over 3-5 years with competitive rates." },
  { title: "Extended Term", term: "Up to 144 Months", desc: "The lowest possible monthly payment for large-scale projects and full renovations." },
];

export default function Financing() {
  usePageTitle('Financing');
  return (
    <div>
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80" alt="Financing options" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-silver font-semibold text-xs uppercase tracking-widest mb-4">Flexible Payments</p>
          <h1 className="font-heading font-bold text-5xl sm:text-6xl text-white mb-5">Financing Options</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Don't let budget hold you back. We offer flexible financing to make your project affordable.</p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className={`p-6 h-full border-0 shadow-md text-center ${plan.highlight ? 'ring-2 ring-navy-500 relative' : ''}`}>
                  {plan.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-navy-500 text-white text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>}
                  <DollarSign className="w-10 h-10 text-navy-500 mx-auto mb-4" />
                  <h3 className="font-heading font-bold text-xl mb-1">{plan.title}</h3>
                  <p className="text-navy-500 font-semibold text-sm mb-3">{plan.term}</p>
                  <p className="text-muted-foreground text-sm">{plan.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="bg-muted/50 rounded-2xl p-8 sm:p-12">
            <h2 className="font-heading font-bold text-2xl mb-6 text-center">How It Works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Calculator, step: "1", title: "Get Your Estimate", desc: "We provide a free, detailed estimate." },
                { icon: CreditCard, step: "2", title: "Apply Online", desc: "Quick credit application, decision in minutes." },
                { icon: Clock, step: "3", title: "Choose Your Plan", desc: "Select the payment plan that fits your budget." },
                { icon: Shield, step: "4", title: "Start Your Project", desc: "We begin work — you enjoy affordable payments." },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-navy-500 text-white flex items-center justify-center mx-auto mb-3 font-heading font-bold">{item.step}</div>
                  <h4 className="font-heading font-bold text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">Ready to get started? Contact us for a free estimate and financing pre-approval.</p>
            <Link to="/contact">
              <Button size="lg" className="bg-navy-500 hover:bg-navy-600 font-heading font-bold px-8">
                Request Free Estimate
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}