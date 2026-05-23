import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import ServicePageTemplate from '../components/public/ServicePageTemplate';
import { Square, Thermometer, Shield, Eye, Palette, Award } from 'lucide-react';

const features = [
  { icon: Square, title: "Energy-Efficient Windows", desc: "Energy-efficient installs with proper flashing and sealing. Lower bills, less noise, better comfort in every room." },
  { icon: Thermometer, title: "Low-E & Double-Pane Glass", desc: "Double and triple-pane Low-E glass packages cut Tennessee summer heat and winter heat loss. Real, measurable energy savings." },
  { icon: Palette, title: "Custom Styles", desc: "Double-hung, casement, bay, bow, slider, and picture windows — sized and styled to match your home's character." },
  { icon: Shield, title: "Storm-Rated Options", desc: "Impact-resistant, storm-rated window packages for maximum protection against Tennessee's severe weather." },
  { icon: Eye, title: "Noise Reduction", desc: "Premium glass packages that significantly cut outside noise — perfect for homes near busy roads, schools, or businesses." },
  { icon: Award, title: "Professional Weatherproofing", desc: "Every install includes proper flashing, sealing, and trim work. Done right the first time so you never have to think about it again." },
];

export default function Windows() {
  usePageTitle('Windows');
  return (
    <ServicePageTemplate
      title="Window Installation"
      subtitle="Complete Exteriors"
      description="Energy-efficient window installation with proper flashing and sealing. Lower bills, less noise, better comfort — installed by Tennessee's local exterior experts."
      image="https://media.base44.com/images/public/6a064ce4129e9e3db2658416/d79dfb938_window2.jpg"
      features={features}
      defaultService="windows"
    />
  );
}