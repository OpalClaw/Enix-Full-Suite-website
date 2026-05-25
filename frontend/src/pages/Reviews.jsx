import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Star } from 'lucide-react';
import CTASection from '../components/public/CTASection';
import { motion } from 'framer-motion';

const reviews = [
  { name: "Mike Johnson", rating: 5, text: "Enix Exteriors replaced our entire roof after a bad hailstorm. They handled everything with the insurance company and we couldn't be happier with the result. Professional, on time, and the roof looks amazing.", service: "Residential Roofing", location: "Knoxville, TN" },
  { name: "Sarah Williams", rating: 5, text: "We had our siding replaced and it completely transformed our home. The crew was respectful, cleaned up every day, and the final result exceeded our expectations.", service: "Siding", location: "Maryville, TN" },
  { name: "David Chen", rating: 5, text: "Best commercial roofing company in the area. They replaced the flat roof on our warehouse and it was done on time and under budget. Highly recommend for any commercial work.", service: "Commercial Roofing", location: "Knoxville, TN" },
  { name: "Jennifer Martinez", rating: 5, text: "The team at Enix replaced all our windows and the difference in energy efficiency is incredible. Our heating bill dropped significantly. Great communication throughout.", service: "Windows", location: "Farragut, TN" },
  { name: "Robert Thompson", rating: 5, text: "After the storm damaged our roof, Enix was there within hours with a tarp and a plan. They worked directly with our insurance and made the whole process stress-free.", service: "Storm Damage", location: "Powell, TN" },
  { name: "Lisa Anderson", rating: 5, text: "We had a new front door and storm door installed. The quality is outstanding and it really improved our home's curb appeal. Fair pricing and excellent workmanship.", service: "Doors", location: "Oak Ridge, TN" },
];

export default function Reviews() {
  usePageTitle('Reviews');
  return (
    <div>
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80" alt="Happy customers" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-silver font-semibold text-xs uppercase tracking-widest mb-4">What Customers Say</p>
          <h1 className="font-heading font-bold text-5xl sm:text-6xl text-white mb-5">Customer Reviews</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-6">Hear what our customers have to say about Enix Exteriors.</p>
          <div className="flex items-center gap-2 justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
            <span className="text-white font-bold ml-2">5.0 Average Rating</span>
          </div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map((review, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <div className="bg-white p-6 h-full border-l-4 border-navy-500 shadow-sm flex flex-col">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: review.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-foreground/80 text-sm leading-relaxed mb-5 flex-1">"{review.text}"</p>
                  <div className="pt-4 border-t border-border">
                    <p className="font-heading font-bold text-sm">{review.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{review.service} • {review.location}</p>
                  </div>
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