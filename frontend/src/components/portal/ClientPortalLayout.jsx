import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Outlet } from 'react-router-dom';
import { Bell, MessageSquare, LogOut, ChevronDown, ChevronLeft, Home, Briefcase, Image, Monitor, MessageCircle, FileText, DollarSign, ClipboardList, Zap, LifeBuoy, Menu, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const PORTAL_SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/portal' },
  { id: 'project', label: 'My Project', icon: Briefcase, path: '/portal/project' },
  { id: 'photos', label: 'Photos & Videos', icon: Image, path: '/portal/media' },
  { id: 'live', label: 'Live Project View', icon: Monitor, path: '/portal/live' },
  { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/portal/messages' },
  { id: 'documents', label: 'Documents', icon: FileText, path: '/portal/documents' },
  { id: 'estimates', label: 'Estimates & Contracts', icon: ClipboardList, path: '/portal/estimates' },
  { id: 'invoices', label: 'Invoices & Payments', icon: DollarSign, path: '/portal/invoices' },
  { id: 'changes', label: 'Change Orders', icon: ClipboardList, path: '/portal/changes' },
  { id: 'warranty', label: 'Warranty', icon: Zap, path: '/portal/warranty' },
  { id: 'support', label: 'Support', icon: LifeBuoy, path: '/portal/support' },
];

export default function ClientPortalLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  useEffect(() => {
    let isMounted = true;

    base44.auth.me()
      .then((nextUser) => {
        if (isMounted) {
          setUser(nextUser);
        }
      })
      .catch(() => {
        if (isMounted) {
          navigate('/login/client');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ['unreadMessages', user?.email],
    queryFn: () => base44.entities.Message.filter({ recipient_email: user?.email, read: false }),
    enabled: !!user?.email,
  });

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate('/login/client');
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-sidebar border-r border-sidebar-border transition-all duration-300 flex-col`}>
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border flex items-center justify-center h-20">
          <img 
            src="https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png" 
            alt="Enix Exteriors" 
            className="h-20 brightness-150"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {PORTAL_SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                title={item.label}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout and Toggle Buttons */}
         <div className="p-3 border-t border-sidebar-border space-y-2">
           <Button
             onClick={handleLogout}
             variant="ghost"
             className="w-full text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-2"
             size="sm"
           >
             <LogOut className="w-4 h-4" />
             {sidebarOpen && <span>Logout</span>}
           </Button>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="w-full text-sidebar-foreground"
           >
             <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? '-rotate-90' : 'rotate-90'}`} />
           </Button>
         </div>
      </div>

      {/* Back Button */}
      <Button 
        variant="outline"
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 bg-sidebar/80 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent z-50"
        size="sm"
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button aria-label="Open menu" className="lg:hidden fixed top-4 left-16 bg-sidebar text-sidebar-foreground p-2 rounded z-50 hover:bg-sidebar-accent">
            <Menu className="w-6 h-6" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0 border-0">
          <div className="p-4 border-b border-sidebar-border flex items-center justify-center h-20">
            <img 
              src="https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png" 
              alt="Enix Exteriors" 
              className="h-20 brightness-150"
            />
          </div>
          <nav className="flex-1 py-4 px-3 space-y-1">
            {PORTAL_SIDEBAR_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-3 border-t border-sidebar-border">
            <Button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              variant="ghost"
              className="w-full text-sidebar-foreground hover:bg-sidebar-accent justify-start gap-2"
              size="sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="h-14 lg:h-20 px-3 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 lg:gap-4">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Client Portal</h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-4">
              {/* Message Center */}
              <Button variant="ghost" size="icon" className="relative h-9 w-9 lg:h-10 lg:w-10">
                <MessageSquare className="w-4 sm:w-5 h-4 sm:h-5" />
                {unreadMessages.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>}
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative h-9 w-9 lg:h-10 lg:w-10">
                <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              </Button>

              {/* Profile Dropdown */}
               <div className="relative">
                 <Button
                   variant="ghost"
                   onClick={() => setProfileOpen(!profileOpen)}
                   className="flex items-center gap-1 sm:gap-2 h-9 w-9 sm:w-auto lg:h-10 px-2 sm:px-3"
                 >
                   <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs sm:text-sm font-bold">
                     {user?.full_name?.charAt(0) || 'C'}
                   </div>
                   <ChevronDown className="w-3 sm:w-4 h-3 sm:h-4 hidden sm:block" />
                 </Button>

                {profileOpen && (
                   <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white rounded-lg shadow-lg border border-border z-50">
                     <div className="p-3 sm:p-4 border-b">
                       <p className="font-semibold text-xs sm:text-sm">{user?.full_name}</p>
                       <p className="text-xs text-muted-foreground">{user?.email}</p>
                     </div>
                     <Button
                       variant="ghost"
                       onClick={handleLogout}
                       className="w-full justify-start text-left rounded-none text-xs sm:text-sm"
                     >
                       <LogOut className="w-3 sm:w-4 h-3 sm:h-4 mr-2" />
                       Logout
                     </Button>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
         <main className="flex-1 overflow-auto pt-16 lg:pt-0">
           <div className="p-3 sm:p-4 lg:p-6">
             <Outlet />
           </div>
         </main>
      </div>
    </div>
  );
}