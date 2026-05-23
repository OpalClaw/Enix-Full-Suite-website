import React from 'react';
import { Star, Quote } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

const reviews = [
  { name: "Mike Johnson", rating: 5, text: "Enix Exteriors replaced our entire roof after storm damage. They handled the insurance claim process seamlessly. Outstanding work!", service: "Residential Roofing", location: "Knoxville, TN" },
  { name: "Sarah Williams", rating: 5, text: "Professional from start to finish. The new siding transformed our home's curb appeal. Highly recommend their team.", service: "Siding", location: "Maryville, TN" },
  { name: "David Chen", rating: 5, text: "Best commercial roofing contractor in Tennessee. They completed our warehouse roof on time and under budget.", service: "Commercial Roofing", location: "Knoxville, TN" },
];

export default function ReviewsPreview() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-navy-500 uppercase tracking-wider mb-2">Testimonials</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-foreground">What Our Clients Say</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 h-full border-0 shadow-md hover:shadow-lg transition-shadow">
                <Quote className="w-8 h-8 text-navy-500/20 mb-3" />
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground/80 text-sm leading-relaxed mb-4">"{review.text}"</p>
                <div className="mt-auto pt-4 border-t">
                  <p className="font-heading font-bold text-sm">{review.name}</p>
                  <p className="text-xs text-muted-foreground">{review.service} • {review.location}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}