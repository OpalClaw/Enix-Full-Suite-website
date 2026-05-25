import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, FileText, Calendar, Wrench, DollarSign, Inbox, 
  Settings, LogOut, Menu, X, BarChart3, Zap, ClipboardList, Shield, Ruler
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/crm' },
  { label: 'Leads', icon: Zap, path: '/crm/leads' },
  { label: 'Jobs', icon: ClipboardList, path: '/crm/jobs' },
  { label: 'Inspections', icon: FileText, path: '/crm/inspections' },
  { label: 'Estimates', icon: FileText, path: '/crm/estimates' },
  { label: 'Contracts', icon: FileText, path: '/crm/contracts' },
  { label: 'Calendar', icon: Calendar, path: '/crm/calendar' },
  { label: 'Crew', icon: Wrench, path: '/crm/crew' },
  { label: 'Measurements', icon: Ruler, path: '/crm/measurements' },
  { label: 'Materials', icon: Wrench, path: '/crm/materials' },
  { label: 'Messages', icon: Inbox, path: '/crm/messages' },
  { label: 'Tasks', icon: BarChart3, path: '/crm/tasks' },
  { label: 'Invoices', icon: DollarSign, path: '/crm/invoices' },
  { label: 'Warranties', icon: Shield, path: '/crm/warranties' },
  { label: 'Reports', icon: BarChart3, path: '/crm/reports' },
];

const bottomItems = [
  { label: 'Settings', icon: Settings, path: '/crm/settings' },
];

export default function CRMSidebar() {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn(
        'hidden md:flex flex-col h-screen bg-navy-900 text-white transition-all duration-300 fixed left-0 top-0 z-40',
        open ? 'w-64' : 'w-20'
      )}>
        <div className="p-4 border-b border-navy-700 flex items-center justify-between flex-shrink-0">
          <div className={cn('font-heading font-bold text-lg', !open && 'hidden')}>
            Enix CRM
          </div>
          <button onClick={() => setOpen(!open)} className="hover:bg-navy-800 p-2 rounded">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-navy-500 text-white' : 'text-navy-100 hover:bg-navy-800'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {open && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-navy-700 space-y-2 flex-shrink-0">
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-navy-500 text-white' : 'text-navy-100 hover:bg-navy-800'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {open && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-navy-100 hover:bg-red-600/10 hover:text-red-400 transition-colors w-full',
              !open && 'justify-center'
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {open && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden fixed bottom-4 right-4 bg-navy-900 text-white p-3 rounded-full shadow-lg z-40"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>
    </>
  );
}