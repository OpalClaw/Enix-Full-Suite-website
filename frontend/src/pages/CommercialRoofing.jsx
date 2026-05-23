import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import ServicePageTemplate from '../components/public/ServicePageTemplate';
import { Building2, Shield, Layers, Ruler, Wrench, Award } from 'lucide-react';

const features = [
  { icon: Layers, title: "TPO Roofing", desc: "Thermoplastic polyolefin systems offer excellent durability and energy efficiency for flat commercial roofs. Ideal for large warehouses and retail centers." },
  { icon: Building2, title: "Modified Bitumen", desc: "Multi-layer asphalt based systems providing superior waterproofing and weather resistance. Perfect for Tennessee's variable climate." },
  { icon: Shield, title: "Roof Coatings", desc: "Extend the life of your existing roof with protective coatings that seal and reflect UV rays. Cost-effective maintenance solution." },
  { icon: Wrench, title: "Complete Replacement", desc: "Full tear-off and replacement services for aging or damaged commercial roofs. Minimal business disruption guaranteed." },
  { icon: Award, title: "Comprehensive Warranties", desc: "Comprehensive warranties on all commercial work plus 24/7 emergency repair services for businesses statewide." },
  { icon: Ruler, title: "Insurance Claim Assistance", desc: "Large crew capacity for fast project completion plus full insurance claim documentation and adjuster coordination." },
];

export default function CommercialRoofing() {
  usePageTitle('Commercial Roofing');
  return (
    <ServicePageTemplate
      title="Commercial Roofing"
      subtitle="Commercial Expertise"
      description="Tennessee's top commercial roofing contractor. TPO, modified bitumen, coatings, and complete roof systems for businesses statewide. Licensed and insured for your protection."
      image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
      features={features}
      defaultService="commercial_roofing"
    />
  );
}