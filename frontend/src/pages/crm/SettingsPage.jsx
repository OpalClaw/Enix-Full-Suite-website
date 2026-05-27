import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { LogOut, Users, Settings as SettingsIcon, Plug, Building2, ShieldCheck } from 'lucide-react';
import DashboardSettings from '@/components/crm/DashboardSettings';
import EmployeeManagement from './EmployeeManagement';
import IntegrationsPanel from '@/components/crm/IntegrationsPanel';
import CompanyProfilePanel from '@/components/crm/CompanyProfilePanel';
import PermissionsMatrix from '@/components/crm/PermissionsMatrix';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await base44.auth.logout();
    } finally {
      navigate('/login/employee');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-start">
        <div>
          <h1 className="font-heading font-bold text-3xl mb-1">Settings</h1>
          <p className="text-muted-foreground">
            Team, integrations, company profile, and dashboard preferences.
          </p>
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

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" /> Team
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Permissions
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="w-4 h-4" /> Integrations
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" /> Company
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <SettingsIcon className="w-4 h-4" /> Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <EmployeeManagement />
        </TabsContent>
        <TabsContent value="permissions" className="mt-6">
          <PermissionsMatrix />
        </TabsContent>
        <TabsContent value="integrations" className="mt-6">
          <IntegrationsPanel />
        </TabsContent>
        <TabsContent value="company" className="mt-6">
          <CompanyProfilePanel />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-6">
          <DashboardSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
