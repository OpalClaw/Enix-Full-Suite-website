import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar, DollarSign, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  estimate: "bg-blue-100 text-blue-700", approved: "bg-green-100 text-green-700",
  material_ordered: "bg-teal-100 text-teal-700", scheduled: "bg-cyan-100 text-cyan-700",
  in_production: "bg-navy-100 text-navy-700", final_inspection: "bg-purple-100 text-purple-700",
  invoiced: "bg-orange-100 text-orange-700", paid: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-700",
};

export default function PortalDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ['portal-jobs'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Job.filter({ client_user_email: user.email });
    },
    enabled: !!user?.email,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['portal-appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 10),
  });



  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl">Welcome{user?.full_name ? `, ${user.full_name}` : ''}</h1>
        <p className="text-sm text-muted-foreground">Your project dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Briefcase, label: "Active Projects", value: jobs.filter(j => !['paid', 'closed'].includes(j.status)).length },
          { icon: CheckCircle2, label: "Completed", value: jobs.filter(j => ['paid', 'closed'].includes(j.status)).length },
          { icon: Calendar, label: "Upcoming Appointments", value: appointments.filter(a => a.date && new Date(a.date) >= new Date()).length },
          { icon: DollarSign, label: "Total Invested", value: `$${jobs.reduce((s, j) => s + (j.paid_amount || 0), 0).toLocaleString()}` },
        ].map((stat, i) => (
          <Card key={i} className="p-5 border-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-navy-500/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-navy-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-heading font-bold">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Jobs */}
      <Card className="border-0 shadow-sm">
       <div className="p-5 border-b"><h3 className="font-heading font-semibold">Your Projects</h3></div>
       <div className="divide-y">
          {jobs.length > 0 ? jobs.map(job => (
            <button key={job.id} onClick={() => navigate(`/portal/jobs/${job.id}`)} className="w-full px-5 py-4 text-left hover:bg-muted/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{job.service_type?.replace(/_/g, ' ')} — {job.property_address}</h4>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${statusColors[job.status] || 'bg-muted'}`}>{job.status?.replace(/_/g, ' ')}</Badge>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              {job.description && <p className="text-sm text-muted-foreground">{job.description}</p>}
              <div className="flex gap-6 mt-2 text-xs text-muted-foreground">
                {job.start_date && <span>Started: {format(new Date(job.start_date), 'MMM d, yyyy')}</span>}
                {job.contract_amount && <span>Contract: ${job.contract_amount.toLocaleString()}</span>}
              </div>
            </button>
          )) : (
           <div className="px-5 py-12 text-center">
             <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
             <p className="text-sm text-muted-foreground">No projects yet. Contact us to get started!</p>
           </div>
         )}
       </div>
      </Card>
    </div>
  );
}