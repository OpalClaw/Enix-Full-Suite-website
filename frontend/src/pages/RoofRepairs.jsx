import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import ServicePageTemplate from '../components/public/ServicePageTemplate';
import { Wrench, Droplets, Wind, Eye, Clock, Shield } from 'lucide-react';

const features = [
  { icon: Droplets, title: "Leak Repair", desc: "Expert leak detection and repair to stop water damage before it spreads through your home or building." },
  { icon: Wind, title: "Storm Damage Repair", desc: "Emergency response for wind, hail, and fallen tree damage. We document everything for your insurance claim." },
  { icon: Wrench, title: "Shingle & Flashing Repair", desc: "Replace missing, cracked, or lifted shingles and damaged flashing around chimneys, vents, and skylights." },
  { icon: Eye, title: "Free Roof Inspections", desc: "Thorough Tennessee storm-aware inspections with photo documentation and a transparent repair recommendation." },
  { icon: Clock, title: "Emergency Tarping 24/7", desc: "24/7 emergency tarping and sealing to prevent further damage until permanent repairs can be made." },
  { icon: Shield, title: "Preventive Maintenance", desc: "Scheduled maintenance programs that extend your roof's lifespan and catch small problems before they become expensive ones." },
];

export default function RoofRepairs() {
  usePageTitle('Roof Repairs');
  return (
    <ServicePageTemplate
      title="Roof Repairs"
      subtitle="Your Local Roofing Expert"
      description="Don't let a small problem become a big expense. Enix Exteriors provides fast, reliable roof repairs for residential and commercial properties across Tennessee — emergency line: (865) 685-ENIX."
      image="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80"
      features={features}
      defaultService="roof_repair"
    />
  );
}