import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';

import { Shield, Award, Users, Target, Heart, Lightbulb } from 'lucide-react';
import CTASection from '../components/public/CTASection';
import { motion } from 'framer-motion';

const LOGO = "https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png";

const values = [
  { icon: Shield, title: "Integrity", desc: "We do what we say. Honest assessments, transparent pricing, and work we stand behind without excuses." },
  { icon: Target, title: "Quality", desc: "Premium materials and craftsmanship on every project. No shortcuts, no second-guessing the finish." },
  { icon: Heart, title: "Service", desc: "Customer satisfaction is our priority. Always. Clear communication from first call through final walkthrough." },
  { icon: Users, title: "Community", desc: "Proudly serving Tennessee with local Knoxville crews who live, work, and build their reputation here." },
  { icon: Award, title: "Premium Materials", desc: "We only install premium materials from trusted brands — backed by comprehensive manufacturer warranties." },
  { icon: Lightbulb, title: "Tennessee Local", desc: "Local Tennessee crews from Knoxville serving Memphis, Nashville, Chattanooga, and statewide commercial work." },
];

export default function About() {
  usePageTitle('About Us');
  return (
    <div>
      {/* Hero */}
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80" alt="Enix Exteriors team" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <img src={LOGO} alt="Enix Exteriors" className="h-64 mx-auto mb-6 brightness-0 invert" />
            <p className="text-silver font-semibold text-xs uppercase tracking-widest mb-4">Our Story</p>
            <h1 className="font-heading font-bold text-5xl sm:text-6xl text-white mb-5">About Enix Exteriors</h1>
            <p className="text-white/70 text-lg max-w-xl mx-auto">Unique. Innovative. Forward. Tennessee's trusted local roofing expert, building on quality and earning trust on every project.</p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-2">Our Story</p>
              <h2 className="font-heading font-bold text-3xl mb-6">From Knoxville to All of Tennessee</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Enix Exteriors was founded with a simple mission: provide Tennessee homeowners and businesses with roofing and exterior services they can trust. What started as a small local operation in Knoxville has grown into one of the state's most respected roofing contractors.</p>
                <p>Our success comes from never compromising on quality. We use premium materials, employ skilled craftsmen, and stand behind every project with comprehensive warranties.</p>
                <p>Today, Enix Exteriors serves communities across Tennessee. From Memphis to Knoxville, Nashville to Chattanooga, we're proud to be the local roofing expert that Tennessee trusts. Our office is at 5992 Bearden View Ln, Knoxville TN 37909.</p>
                <p><strong>ENIX — Unique. Innovative. Forward.</strong> Our tagline reflects our commitment to bringing fresh thinking and progressive solutions to every roofing and exterior project.</p>
              </div>
            </div>
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80" alt="Enix team at work" className="rounded-2xl shadow-xl" />
              <div className="absolute -bottom-6 -left-6 bg-navy-500 text-white p-6 rounded-xl shadow-lg">
                <p className="font-heading font-bold text-3xl">500+</p>
                <p className="text-sm text-white/70">Projects Completed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-silver uppercase tracking-widest mb-3">Our Values</p>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white">What Drives Us</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {values.map((v, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white p-6 h-full border-l-4 border-navy-500">
                  <v.icon className="w-8 h-8 text-navy-500 mb-4" />
                  <h3 className="font-heading font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
}