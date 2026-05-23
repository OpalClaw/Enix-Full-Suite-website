import React from 'react';
import { Shield, Award, Clock, ThumbsUp, Star, BadgeCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const badges = [
  { icon: Shield, label: "Licensed & Insured", desc: "Fully licensed in Tennessee" },
  { icon: Award, label: "GAF Certified", desc: "Master Elite® Contractor" },
  { icon: Clock, label: "15+ Years", desc: "Trusted experience" },
  { icon: ThumbsUp, label: "500+ Projects", desc: "Completed successfully" },
  { icon: Star, label: "5-Star Rated", desc: "Google & BBB reviews" },
  { icon: BadgeCheck, label: "Warranty Backed", desc: "Industry-leading warranties" },
];

export default function TrustSection() {
  return (
    <section className="py-16 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-silver uppercase tracking-widest mb-3">Why Choose Us</p>
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-white">Why Choose Enix Exteriors</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-white/10">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-navy-900 p-6 text-center"
            >
              <badge.icon className="w-7 h-7 text-silver mx-auto mb-3" />
              <h4 className="font-heading font-bold text-sm text-white">{badge.label}</h4>
              <p className="text-xs text-white/50 mt-1">{badge.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}