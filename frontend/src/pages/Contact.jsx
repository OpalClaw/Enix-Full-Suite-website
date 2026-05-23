import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import LeadForm from '../components/public/LeadForm';

export default function Contact() {
  usePageTitle('Contact');
  return (
    <div>
      <section className="relative py-32 sm:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80" alt="Contact Enix Exteriors" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-navy-900/85" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-silver font-semibold text-xs uppercase tracking-widest mb-4">Get In Touch</p>
          <h1 className="font-heading font-bold text-5xl sm:text-6xl text-white mb-5">Contact Enix Exteriors</h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto">Ready to start your project? Reach out for a free quote or consultation. Your Local Roofing Expert is here to help.</p>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="font-heading font-bold text-2xl mb-6">Get In Touch</h2>
                <p className="text-muted-foreground text-sm mb-6">Fill out the form and our team will contact you within 24 hours to schedule your free property inspection. Storm damage? Our emergency line runs 24/7.</p>
              </div>

              {[
                { icon: Phone, label: "Phone", value: "(865) 685-ENIX", href: "tel:+18656853649" },
                { icon: Mail, label: "Email", value: "INFO@ENIXEXTERIORS.COM", href: "mailto:INFO@ENIXEXTERIORS.COM" },
                { icon: MapPin, label: "Address", value: "5992 Bearden View Ln\nKnoxville TN 37909" },
                { icon: Clock, label: "Hours", value: "Mon-Fri: 7am-6pm\nEmergency: 24/7" },
              ].map((item, i) => (
                <Card key={i} className="p-4 border-0 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-navy-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-navy-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-semibold text-foreground hover:text-navy-500 transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-sm font-semibold whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <LeadForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}