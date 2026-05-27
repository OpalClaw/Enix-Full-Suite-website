import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Globe } from 'lucide-react';
import { Facebook, Instagram } from '@/components/icons/SocialIcons';

const LOGO_URL = "https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png";

export default function Footer() {
  return (
    <footer className="bg-navy-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-10">
          {/* Brand */}
          <div>
            <img src={LOGO_URL} alt="Enix Exteriors" className="h-24 mb-4 brightness-0 invert" />
            <p className="text-white/50 text-sm leading-relaxed">
              Unique. Innovative. Forward. Tennessee's trusted local roofing expert — commercial and residential roofing, siding, gutters, and windows done right the first time.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-widest mb-5 text-white">Services</h4>
            <div className="space-y-2.5">
              {[
                { label: "Residential Roofing", path: "/residential-roofing" },
                { label: "Commercial Roofing", path: "/commercial-roofing" },
                { label: "Roof Repairs", path: "/roof-repairs" },
                { label: "Siding", path: "/siding" },
                { label: "Windows & Doors", path: "/windows" },
                { label: "Storm Damage", path: "/storm-damage" },
              ].map((s) => (
                <Link key={s.path} to={s.path} className="block text-sm text-white/50 hover:text-white transition-colors">
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-widest mb-5 text-white">Company</h4>
            <div className="space-y-2.5">
              {[
                { label: "About Us", path: "/about" },
                { label: "Projects", path: "/projects" },
                { label: "Reviews", path: "/reviews" },
                { label: "Education Hub", path: "/education" },
                { label: "Financing", path: "/financing" },
                { label: "Contact", path: "/contact" },
              ].map((l) => (
                <Link key={l.path} to={l.path} className="block text-sm text-white/50 hover:text-white transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-widest mb-5 text-white">Contact</h4>
            <div className="space-y-3">
              <a aria-label="Call Enix Exteriors" href="tel:+18656853649" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" /> (865) 685-ENIX
              </a>
              <a href="mailto:INFO@ENIXEXTERIORS.COM" className="flex items-center gap-3 text-sm text-white/50 hover:text-white transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" /> INFO@ENIXEXTERIORS.COM
              </a>
              <div className="flex items-start gap-3 text-sm text-white/50">
                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>5992 Bearden View Ln<br />Knoxville TN 37909</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-white/50">
                <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Mon-Fri: 7am-6pm<br />Emergency: 24/7</span>
              </div>
            </div>
          </div>

          {/* Social icons stacked vertically */}
          <div className="flex xl:flex-col gap-3">
            <a href="https://www.facebook.com/share/18kzPJ4uer/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="https://www.instagram.com/enixexteriors" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://share.google/jYaZIHOtegqIMEwIm" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Globe className="w-4 h-4" />
            </a>
            <a href="https://www.tiktok.com/@enixexteriors" target="_blank" rel="noopener noreferrer" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/40">© {new Date().getFullYear()} Enix Exteriors. All rights reserved.</p>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <span>Licensed & Insured • Knoxville, TN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}