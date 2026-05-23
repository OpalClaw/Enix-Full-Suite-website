import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Phone, Home } from 'lucide-react';

/**
 * Rendered in place of any route whose backend is not yet online.
 * Use during the Phase B migration window when Base44 is offline.
 */
export default function BackendOffline({ surface = 'This area' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl border border-amber-200 shadow-sm p-8">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-amber-700" aria-hidden />
          </div>
          <div className="space-y-3">
            <h1 className="text-xl font-heading font-bold text-slate-900">
              {surface} is in setup
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              We're finalizing the secure backend for this portal. Public pages and
              the lead form are live and fully working. Logged-in tools will be
              available shortly.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              For an urgent matter, reach our team directly.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="tel:+18656853649" aria-label="Call Enix Exteriors at 865-685-3649">
                <Button className="gap-2">
                  <Phone className="w-4 h-4" /> (865) 685-3649
                </Button>
              </a>
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <Home className="w-4 h-4" /> Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
