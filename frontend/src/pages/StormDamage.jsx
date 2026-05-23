import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import ServicePageTemplate from '../components/public/ServicePageTemplate';
import { CloudLightning, FileText, Phone, Shield, Clock, BadgeCheck } from 'lucide-react';

const features = [
  { icon: CloudLightning, title: "Rapid Response", desc: "Our emergency crews are on call 24/7. We arrive quickly to assess damage and prevent further problems to your home or commercial property." },
  { icon: Shield, title: "Emergency Tarping", desc: "Temporary protection to stop leaks and prevent interior damage until permanent repairs can be made. Fast deployment statewide." },
  { icon: FileText, title: "Insurance Documentation", desc: "We document all damage with photos and detailed reports to support your insurance claim. Complete evidence package, every time." },
  { icon: Phone, title: "Claim Assistance", desc: "We work directly with your insurance company to ensure you get fair coverage for repairs. We speak their language so you don't have to." },
  { icon: Clock, title: "Post-Storm Inspection", desc: "Free post-storm inspections — hidden damage can lead to leaks and costly repairs later, even when no obvious damage is visible." },
  { icon: BadgeCheck, title: "Complete Restoration", desc: "Full repairs or replacement to restore your roof to pre-storm condition, with premium materials and comprehensive warranties." },
];

const benefits = [
  "Missing or lifted shingles after a storm",
  "Dented or damaged shingles from hail",
  "Granules accumulating in your gutters",
  "Leaks or water stains on interior ceilings",
  "Damaged flashing around chimneys or vents",
  "Gutter damage, dents, or detachment",
  "Siding dents, cracks, or holes",
  "Window or door frame damage",
];

export default function StormDamage() {
  usePageTitle('Storm Damage');
  return (
    <ServicePageTemplate
      title="Storm Damage"
      subtitle="Emergency Services — 24/7"
      description="Storm damage to your home or business? Enix Exteriors responds fast with emergency tarping, insurance documentation, and complete restoration. 24/7 emergency line: (865) 685-ENIX."
      image="https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=1920&q=80"
      features={features}
      benefits={benefits}
      defaultService="storm_damage"
    />
  );
}