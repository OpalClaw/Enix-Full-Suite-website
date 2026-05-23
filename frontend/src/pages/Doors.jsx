import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import ServicePageTemplate from '../components/public/ServicePageTemplate';
import { DoorOpen, Shield, Lock, Palette, Thermometer, Award } from 'lucide-react';

const features = [
  { icon: DoorOpen, title: "Entry Doors", desc: "Make a statement with premium fiberglass, steel, and wood entry doors. Energy-efficient cores with professional weatherproofing." },
  { icon: Lock, title: "Patio Doors", desc: "Sliding, French, and bi-fold patio doors for seamless indoor-outdoor living, sealed and flashed for Tennessee weather." },
  { icon: Shield, title: "Storm Doors", desc: "Added protection, light, and ventilation with professionally installed storm doors that stand up to Tennessee storms." },
  { icon: Palette, title: "Custom Designs", desc: "Decorative glass, sidelights, transoms, and custom finishes available to match your home's style exactly." },
  { icon: Thermometer, title: "Energy Efficient", desc: "Insulated cores and proper weatherstripping for maximum energy savings — lower heating and cooling bills, year-round." },
  { icon: Award, title: "Security & Weatherproofing", desc: "Multi-point locking systems and reinforced frames plus proper flashing, sealing, and trim. Done right the first time." },
];

export default function Doors() {
  usePageTitle('Entry & Patio Doors');
  return (
    <ServicePageTemplate
      title="Door Installation"
      subtitle="Complete Exteriors"
      description="Entry doors, patio doors, and storm doors — energy-efficient installs with professional weatherproofing from Tennessee's local exterior experts."
      image="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1920&q=80"
      features={features}
      defaultService="doors"
    />
  );
}