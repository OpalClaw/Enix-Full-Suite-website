import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard, Users, Briefcase, FileText, Calendar, MessageSquare,
  ClipboardList, DollarSign, Shield, BarChart3, Menu, LogOut, ChevronRight,
  Home, UserCircle, Settings, Ruler } from
'lucide-react';

const LOGO = "https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png";

const navItems = [
{ icon: LayoutDashboard, label: "Dashboard", path: "/crm" },
{ icon: Users, label: "Leads", path: "/crm/leads" },
{ icon: Briefcase, label: "Jobs", path: "/crm/jobs" },
{ icon: FileText, label: "Inspections", path: "/crm/inspections" },
{ icon: FileText, label: "Estimates", path: "/crm/estimates" },
{ icon: FileText, label: "Contracts", path: "/crm/contracts" },
{ icon: Calendar, label: "Calendar", path: "/crm/calendar" },
{ icon: Users, label: "Crew", path: "/crm/crew" },
{ icon: Ruler, label: "Measurements", path: "/crm/measurements" },
{ icon: Briefcase, label: "Materials", path: "/crm/materials" },
{ icon: MessageSquare, label: "Messages", path: "/crm/messages" },
{ icon: ClipboardList, label: "Tasks", path: "/crm/tasks" },
{ icon: DollarSign, label: "Invoices", path: "/crm/invoices" },
{ icon: Shield, label: "Warranties", path: "/crm/warranties" },
{ icon: BarChart3, label: "Reports", path: "/crm/reports" }];


function SidebarContent({ currentPath, onNavigate }) {
  return (
    <div className="flex flex-col h-full bg-navy-500">
      <div className="p-5 border-b border-white/10">
        <img src={LOGO} alt="Enix" className="h-20 brightness-0 invert" />
        <p className="text-white/50 text-xs mt-1">CRM Dashboard</p>
      </div>
      <ScrollArea className="flex-1 py-2">
        <nav className="px-3 space-y-0.5">
          {navItems.map((item) => {
            const active = currentPath === item.path || item.path !== "/crm" && currentPath.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active ? 'bg-white/15 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`
              }>
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>);

          })}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t border-white/10 space-y-1">
         <Link to="/crm/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
           <Settings className="w-4 h-4" /> Settings
         </Link>
         <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors">
           <Home className="w-4 h-4" /> View Website
         </Link>
       </div>
    </div>);

}

export default function CRMLayout() {
  const { currentPath } = { currentPath: useLocation().pathname };
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 flex-shrink-0">
        <SidebarContent currentPath={currentPath} onNavigate={() => {}} />
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-60">
          <SidebarContent currentPath={currentPath} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center justify-between px-3 sm:px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-heading font-semibold text-xs sm:text-sm text-muted-foreground">Enix Exteriors</h2>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>);

}