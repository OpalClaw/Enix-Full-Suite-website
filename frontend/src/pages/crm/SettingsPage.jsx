import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import DashboardSettings from '@/components/crm/DashboardSettings';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await base44.auth.logout('/login/employee');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-start">
        <div>
          <h1 className="font-heading font-bold text-3xl mb-1">Settings</h1>
          <p className="text-muted-foreground">Manage your team and app settings</p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="gap-2 text-destructive hover:text-destructive"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </Button>
      </div>
      <DashboardSettings />
    </div>
  );
}