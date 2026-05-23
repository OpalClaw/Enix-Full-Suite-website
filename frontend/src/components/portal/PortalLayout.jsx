import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, Calendar, DollarSign, Upload, Shield, LogOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const LOGO = "https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/portal" },
  { icon: FileText, label: "Proposals", path: "/portal/proposals" },
  { icon: FileText, label: "Estimates", path: "/portal/estimates" },
  { icon: Calendar, label: "Appointments", path: "/portal/appointments" },
  { icon: MessageSquare, label: "Messages", path: "/portal/messages" },
  { icon: DollarSign, label: "Invoices", path: "/portal/invoices" },
  { icon: Upload, label: "Documents", path: "/portal/documents" },
  { icon: Shield, label: "Warranties", path: "/portal/warranties" },
];

export default function PortalLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-navy-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO} alt="Enix" className="h-10 brightness-0 invert" />
            <span className="text-sm font-medium text-white/70">Client Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                <Home className="w-4 h-4 mr-1" /> Website
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10" onClick={() => base44.auth.logout('/')}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <nav className="flex gap-1 overflow-x-auto pb-1">
            {navItems.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}>
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}