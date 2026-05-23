import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '../../components/crm/StatCard';
import { Users, Briefcase, DollarSign, TrendingUp, Calendar, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  inspection_scheduled: "bg-purple-100 text-purple-700",
  estimate_sent: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  in_production: "bg-navy-100 text-navy-700",
  paid: "bg-emerald-100 text-emerald-700",
  lost: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 50),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 50),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 10),
  });

  const newLeads = leads.filter(l => l.status === 'new').length;
  const openJobs = jobs.filter(j => !['paid', 'closed'].includes(j.status)).length;
  const totalRevenue = jobs.reduce((sum, j) => sum + (j.paid_amount || 0), 0);
  const avgJobValue = jobs.length > 0 ? jobs.reduce((sum, j) => sum + (j.contract_amount || 0), 0) / jobs.length : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back. Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="New Leads" value={newLeads} icon={Users} trend={`${leads.length} total`} />
        <StatCard title="Open Jobs" value={openJobs} icon={Briefcase} />
        <StatCard title="Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Avg Job Value" value={`$${Math.round(avgJobValue).toLocaleString()}`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card className="border-0 shadow-sm">
          <div className="p-5 border-b">
            <h3 className="font-heading font-semibold">Recent Leads</h3>
          </div>
          <div className="divide-y">
            {leads.slice(0, 8).map((lead) => (
              <div key={lead.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium">{lead.first_name} {lead.last_name}</p>
                  <p className="text-xs text-muted-foreground">{lead.service_needed?.replace(/_/g, ' ')}</p>
                </div>
                <Badge className={`text-xs ${statusColors[lead.status] || 'bg-muted text-muted-foreground'}`}>
                  {lead.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
            ))}
            {leads.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No leads yet</p>}
          </div>
        </Card>

        {/* Upcoming Appointments */}
        <Card className="border-0 shadow-sm">
          <div className="p-5 border-b">
            <h3 className="font-heading font-semibold">Upcoming Appointments</h3>
          </div>
          <div className="divide-y">
            {appointments.slice(0, 8).map((apt) => (
              <div key={apt.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-navy-500" />
                  <div>
                    <p className="text-sm font-medium">{apt.title}</p>
                    <p className="text-xs text-muted-foreground">{apt.customer_name} • {apt.time}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{apt.date ? format(new Date(apt.date), 'MMM d') : ''}</p>
              </div>
            ))}
            {appointments.length === 0 && <p className="px-5 py-8 text-center text-sm text-muted-foreground">No appointments scheduled</p>}
          </div>
        </Card>
      </div>

      {/* Pipeline overview */}
      <Card className="border-0 shadow-sm">
        <div className="p-5 border-b">
          <h3 className="font-heading font-semibold">Lead Pipeline</h3>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {['new', 'contacted', 'inspection_scheduled', 'estimate_sent', 'approved'].map((stage) => {
              const count = leads.filter(l => l.status === stage).length;
              return (
                <div key={stage} className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-heading font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">{stage.replace(/_/g, ' ')}</p>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}