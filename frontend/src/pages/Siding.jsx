import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import ServicePageTemplate from '../components/public/ServicePageTemplate';
import { PanelTop, Palette, Shield, Thermometer, Sparkles, Wrench } from 'lucide-react';

const features = [
  { icon: PanelTop, title: "Vinyl Siding", desc: "Low-maintenance vinyl siding installed with tight seams and clean corners. Wide range of colors and styles to transform your home's look." },
  { icon: Shield, title: "Fiber Cement", desc: "Superior durability and weather resistance. Fiber cement holds up to Tennessee weather, fire, and impact better than almost anything else." },
  { icon: Palette, title: "Engineered Wood", desc: "Natural beauty and modern performance — engineered wood siding gives you the look of real wood with far less maintenance." },
  { icon: Thermometer, title: "Insulated Siding", desc: "Energy-efficient insulated profiles reduce heating and cooling costs while quieting outside noise." },
  { icon: Sparkles, title: "Gutters & Downspouts", desc: "Seamless aluminum gutters with guards and proper drainage planning, installed with siding for a finished, weather-tight exterior." },
  { icon: Wrench, title: "Soffit, Fascia & Repair", desc: "Complete exterior trim work plus repair for damaged, warped, or fading panels. We finish the whole envelope, not just the front." },
];

export default function Siding() {
  usePageTitle('Siding');
  return (
    <ServicePageTemplate
      title="Siding Installation"
      subtitle="Complete Exteriors"
      description="Vinyl, fiber cement, and engineered wood. Tight seams, clean corners, weather-tight finish. Transform your home's look with siding from Tennessee's local exterior experts."
      image="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=80"
      features={features}
      defaultService="siding"
    />
  );
}