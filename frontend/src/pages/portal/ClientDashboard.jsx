import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, FileText, DollarSign, Camera, Calendar, TrendingUp } from 'lucide-react';
import ProjectStatusCard from '@/components/portal/ProjectStatusCard';
import ProjectManagerCard from '@/components/portal/ProjectManagerCard';
import RecentActivityFeed from '@/components/portal/RecentActivityFeed';
import NotificationsPanel from '@/components/portal/NotificationsPanel';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function ClientDashboard() {
  usePageTitle('Client Dashboard');
  const [user, setUser] = useState(null);
  const [clientJob, setClientJob] = useState(null);

  // Get current user
  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Get client's job (assuming one job per client for now)
  const { data: jobs = [] } = useQuery({
    queryKey: ['clientJobs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Job.filter({ customer_email: user.email });
    },
    enabled: !!user?.email,
  });

  // Get estimates for the job
  const { data: estimates = [] } = useQuery({
    queryKey: ['jobEstimates', clientJob?.id],
    queryFn: () => clientJob ? base44.entities.Estimate.filter({ lead_id: clientJob.id }) : Promise.resolve([]),
    enabled: !!clientJob,
  });

  // Get invoices for the job
  const { data: invoices = [] } = useQuery({
    queryKey: ['jobInvoices', clientJob?.id],
    queryFn: () => clientJob ? base44.entities.Invoice.filter({ job_id: clientJob.id }) : Promise.resolve([]),
    enabled: !!clientJob,
  });

  // Get messages for the job
  const { data: messages = [] } = useQuery({
    queryKey: ['jobMessages', clientJob?.id],
    queryFn: () => clientJob ? base44.entities.Message.filter({ job_id: clientJob.id }) : Promise.resolve([]),
    enabled: !!clientJob,
  });

  React.useEffect(() => {
    if (jobs.length > 0) {
      setClientJob(jobs[0]);
    }
  }, [jobs]);

  if (!clientJob) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Loading your project...</p>
      </div>
    );
  }

  const openInvoices = invoices.filter(inv => !['paid'].includes(inv.status));
  const unreadMessages = messages.filter(msg => !msg.read && msg.recipient_email === user?.email);

  const completionPercentage = clientJob.completion_percentage || 0;

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">{clientJob.customer_name}'s Project</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{clientJob.job_number}</p>
        </div>
        <div className="text-left sm:text-right">
          <div className="inline-block bg-primary/10 text-primary px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold">
            {clientJob.status}
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card>
           <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
             <div className="flex items-center justify-between gap-2">
               <div className="flex-1 min-w-0">
                 <p className="text-xs sm:text-sm text-muted-foreground">Completion</p>
                 <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{completionPercentage}%</p>
               </div>
               <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8 text-primary flex-shrink-0" />
            </div>
            <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
           <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
             <div className="flex items-center justify-between gap-2">
               <div className="flex-1 min-w-0">
                 <p className="text-xs sm:text-sm text-muted-foreground">Open Invoices</p>
                 <p className="text-lg sm:text-2xl lg:text-3xl font-bold truncate">${(openInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0) / 1000).toFixed(1)}K</p>
               </div>
               <DollarSign className="w-6 sm:w-8 h-6 sm:h-8 text-orange-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
           <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
             <div className="flex items-center justify-between gap-2">
               <div className="flex-1 min-w-0">
                 <p className="text-xs sm:text-sm text-muted-foreground">Messages</p>
                 <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{unreadMessages.length}</p>
               </div>
               <MessageSquare className="w-6 sm:w-8 h-6 sm:h-8 text-blue-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
           <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
             <div className="flex items-center justify-between gap-2">
               <div className="flex-1 min-w-0">
                 <p className="text-xs sm:text-sm text-muted-foreground">Est. Completion</p>
                 <p className="text-xs sm:text-sm font-bold">{clientJob.estimated_completion_date ? new Date(clientJob.estimated_completion_date).toLocaleDateString() : 'N/A'}</p>
               </div>
               <Calendar className="w-6 sm:w-8 h-6 sm:h-8 text-green-500 flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Project Status & Manager */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <ProjectStatusCard job={clientJob} />
          <ProjectManagerCard job={clientJob} />
        </div>

        {/* Right Column - Notifications */}
        <div>
          <NotificationsPanel messages={messages} invoices={invoices} />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <RecentActivityFeed job={clientJob} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button className="h-24 flex flex-col items-center justify-center bg-primary hover:bg-primary/90">
          <Camera className="w-6 h-6 mb-2" />
          <span className="text-sm">View Photos</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
          <FileText className="w-6 h-6 mb-2" />
          <span className="text-sm">Documents</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
          <MessageSquare className="w-6 h-6 mb-2" />
          <span className="text-sm">Message PM</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
          <DollarSign className="w-6 h-6 mb-2" />
          <span className="text-sm">Pay Invoice</span>
        </Button>
      </div>
    </div>
  );
}