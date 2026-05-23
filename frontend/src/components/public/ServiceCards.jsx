import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { ArrowRight, Home, Building2, Wrench, PanelTop, DoorOpen, CloudLightning } from 'lucide-react';
import { motion } from 'framer-motion';

const WindowIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <line x1="2" y1="9" x2="22" y2="9" />
    <line x1="12" y1="9" x2="12" y2="21" />
  </svg>
);

const services = [
  { icon: Home, title: "Residential Roofing", desc: "Shingle, metal, and tile systems built to last for every Tennessee home.", path: "/residential-roofing", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80" },
  { icon: Building2, title: "Commercial Roofing", desc: "TPO, modified bitumen, coatings, and complete systems for businesses statewide.", path: "/commercial-roofing", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80" },
  { icon: Wrench, title: "Roof Repairs", desc: "Fast, expert repairs that stop leaks and extend roof life.", path: "/roof-repairs", img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80" },
  { icon: PanelTop, title: "Siding", desc: "Vinyl, fiber cement, and engineered wood with tight seams and clean corners.", path: "/siding", img: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80" },
  { icon: WindowIcon, title: "Windows", desc: "Energy-efficient installs with proper flashing and sealing — lower bills, less noise.", path: "/windows", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/71a670b3b_window2.jpg" },
  { icon: DoorOpen, title: "Doors", desc: "Entry, patio, and storm doors professionally weatherproofed.", path: "/doors", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/52f5cc99d_door.jpg" },
  { icon: CloudLightning, title: "Storm Damage", desc: "24/7 emergency response, insurance documentation, and complete restoration.", path: "/storm-damage", img: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=600&q=80" },
];

export default function ServiceCards() {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-2">What We Do</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">Complete Roofing & Exteriors</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Commercial and residential roofing, siding, gutters, and windows done right the first time. One call handles it all.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {services.map((service, i) => (
            <motion.div
              key={service.path}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
            >
              <Link to={service.path}>
                <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-72">
                  <img src={service.img} alt={service.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/50 to-transparent" />
                  <div className="relative h-full flex flex-col justify-end p-5">
                    <service.icon className="w-8 h-8 text-silver mb-2" />
                    <h3 className="font-heading font-bold text-white text-lg">{service.title}</h3>
                    <p className="text-white/70 text-sm mt-1 line-clamp-2">{service.desc}</p>
                    <div className="flex items-center gap-1 mt-3 text-silver text-sm font-semibold group-hover:gap-2 transition-all">
                      Learn More <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}