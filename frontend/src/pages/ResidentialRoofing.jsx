import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import ServicePageTemplate from '../components/public/ServicePageTemplate';
import { Home, Shield, Layers, Palette, Clock, Award } from 'lucide-react';

const features = [
  { icon: Layers, title: "Shingle Roofing", desc: "Architectural and 3-tab shingles offer classic beauty at an affordable price. Wide range of colors and styles, with 20-30 year manufacturer warranties." },
  { icon: Shield, title: "Metal Roofing", desc: "Standing seam and exposed fastener systems provide unmatched durability and modern curb appeal. 50+ year lifespan and energy efficient." },
  { icon: Palette, title: "Tile Roofing", desc: "Clay and concrete tile roofing offers timeless elegance and exceptional weather resistance. 75+ year lifespan, fire resistant." },
  { icon: Home, title: "Free Inspection", desc: "We assess your roof condition and walk you through every issue we find — no obligation, no pressure, ever." },
  { icon: Clock, title: "Transparent Quote", desc: "Detailed, transparent pricing on every project. You know exactly what you're paying for before any work begins." },
  { icon: Award, title: "Expert Install + Walkthrough", desc: "Skilled local Knoxville crews complete most homes in 1–3 days. Every project ends with a quality walkthrough." },
];

export default function ResidentialRoofing() {
  usePageTitle('Residential Roofing');
  return (
    <ServicePageTemplate
      title="Residential Roofing"
      subtitle="Residential Experts"
      description="Protect your home with quality roofing from Knoxville's local experts. Shingle, metal, and tile systems built to last. Free estimates for all Tennessee homeowners."
      image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
      features={features}
      defaultService="residential_roofing"
    />
  );
}