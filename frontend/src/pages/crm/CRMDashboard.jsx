import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, AlertCircle, Clock, DollarSign, CheckCircle2, 
  Users, FileText, Zap, ArrowRight, Calendar, Briefcase, Settings as SettingsIcon
} from 'lucide-react';
import { format } from 'date-fns';
import DashboardSettings from '@/components/crm/DashboardSettings';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function CRMDashboard() {
  usePageTitle('CRM Dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 100),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 100),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 50),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 20),
  });

  // Pipeline calculations
  const leads_pipeline = leads.filter(l => ['new', 'contacted', 'inspection_scheduled'].includes(l.status)).length;
  const prospects = leads.filter(l => ['inspection_completed', 'estimate_created', 'estimate_sent'].includes(l.status)).length;
  const approved = jobs.filter(j => j.status === 'approved').length;
  const completed = jobs.filter(j => j.status === 'final_inspection').length;
  const invoiced = invoices.length;
  const activeJobs = jobs.filter(j => !['closed', 'paid'].includes(j.status)).length;

  const prospectRevenue = leads.filter(l => ['inspection_completed', 'estimate_created', 'estimate_sent'].includes(l.status)).reduce((sum, l) => sum + (l.estimate_amount || 0), 0);
  const approvedRevenue = jobs.filter(j => j.status === 'approved').reduce((sum, j) => sum + (j.contract_amount || 0), 0);
  const completedRevenue = jobs.filter(j => j.status === 'final_inspection').reduce((sum, j) => sum + (j.contract_amount || 0), 0);
  const invoicedRevenue = invoices.reduce((sum, i) => sum + (i.total || 0), 0);

  const overdueTasks = tasks.filter(t => t.status !== 'completed').length;
  const todaysTasks = tasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-heading font-bold text-3xl mb-1">Dashboard</h1>
        <p className="text-muted-foreground">Active Jobs: {activeJobs}</p>
      </div>

      {/* Content */}
      <div className="space-y-4 lg:space-y-6">
          {/* Current Pipeline Section */}
          <Card className="border-t-4 border-t-blue-500 shadow-md">
            <CardHeader className="bg-gray-50 border-b pb-3 lg:pb-4 px-4 lg:px-6 py-3 lg:py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <CardTitle className="text-lg lg:text-xl">Current Pipeline</CardTitle>
                <span className="text-xs lg:text-sm text-muted-foreground font-normal">Active Jobs: {activeJobs}</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-0 divide-x divide-y sm:divide-y-0">
                {/* Leads */}
                <Link to="/crm/leads" className="p-3 sm:p-4 lg:p-6 text-center hover:bg-gray-50 cursor-pointer transition block">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1">{leads_pipeline}</div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Leads</p>
                  <p className="hidden sm:block text-xs text-gray-400">New - Inspection</p>
                </Link>

                {/* Prospects */}
                <div className="p-3 sm:p-4 lg:p-6 text-center hover:bg-gray-50 cursor-pointer transition">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-1">{prospects}</div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Prospects</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">${(prospectRevenue / 1000).toFixed(0)}K</p>
                </div>

                {/* Approved */}
                <Link to="/crm/jobs" className="p-3 sm:p-4 lg:p-6 text-center hover:bg-gray-50 cursor-pointer transition block">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1">{approved}</div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Approved</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">${(approvedRevenue / 1000).toFixed(0)}K</p>
                </Link>

                {/* Completed */}
                <div className="p-3 sm:p-4 lg:p-6 text-center hover:bg-gray-50 cursor-pointer transition">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-600 mb-1">{completed}</div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Completed</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">${(completedRevenue / 1000).toFixed(0)}K</p>
                </div>

                {/* Invoiced */}
                <Link to="/crm/invoices" className="p-3 sm:p-4 lg:p-6 text-center hover:bg-gray-50 cursor-pointer transition block col-span-2 sm:col-span-1">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600 mb-1">{invoiced}</div>
                  <p className="text-xs sm:text-sm font-medium text-gray-700">Invoiced</p>
                  <p className="text-xs font-semibold text-gray-700 mt-1">${(invoicedRevenue / 1000).toFixed(0)}K</p>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Left: Action Items and Recent Leads */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Actions */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="p-4 lg:p-6">
                  <div className="grid grid-cols-2 gap-2 sm:gap-4">
                    <Link to="/crm/leads" className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                      <p className="font-semibold text-sm">New Lead</p>
                      <p className="text-xs text-muted-foreground mt-1">{leads.length} total</p>
                    </Link>
                    <Link to="/crm/jobs" className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition text-center">
                      <Briefcase className="w-8 h-8 mx-auto mb-2 text-green-600" />
                      <p className="font-semibold text-sm">Active Jobs</p>
                      <p className="text-xs text-muted-foreground mt-1">{activeJobs} active</p>
                    </Link>
                    <Link to="/crm/estimates" className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition text-center">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                      <p className="font-semibold text-sm">Estimates</p>
                      <p className="text-xs text-muted-foreground mt-1">Create estimate</p>
                    </Link>
                    <Link to="/crm/tasks" className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition text-center">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                      <p className="font-semibold text-sm">Tasks</p>
                      <p className="text-xs text-muted-foreground mt-1">{todaysTasks.length} today</p>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Leads */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg">Recent Leads</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {leads.slice(0, 5).map(lead => (
                      <div key={lead.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{lead.first_name} {lead.last_name}</p>
                          <p className="text-xs text-muted-foreground">{lead.phone} • {lead.city}, {lead.state}</p>
                        </div>
                        <Badge variant="outline" className="text-xs flex-shrink-0">{lead.status?.replace(/_/g, ' ')}</Badge>
                      </div>
                    ))}
                    {leads.length === 0 && (
                      <div className="p-6 text-center text-muted-foreground">
                        <p className="text-sm">No leads yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Sidebar */}
            <div className="space-y-6">
              {/* Today's Tasks */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg">Today's Tasks</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {todaysTasks.length > 0 ? (
                    <div className="divide-y">
                      {todaysTasks.slice(0, 4).map(task => (
                        <div key={task.id} className="p-4 hover:bg-gray-50">
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          <Badge className="mt-2 text-xs" variant="outline">{task.priority}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">No tasks for today</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Appointments */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg">Appointments</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {appointments.length > 0 ? (
                    <div className="divide-y">
                      {appointments.slice(0, 4).map(apt => (
                        <div key={apt.id} className="p-4 hover:bg-gray-50">
                          <p className="font-medium text-sm">{apt.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">{format(new Date(apt.date), 'MMM d')} at {apt.time}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      <p className="text-sm">No upcoming appointments</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Outstanding Invoices Alert */}
              {invoices.some(i => i.status !== 'paid') && (
                <Card className="border-0 shadow-sm border-l-4 border-l-orange-500">
                  <CardHeader className="bg-orange-50 border-b">
                    <CardTitle className="text-lg text-orange-700">Outstanding</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-2xl font-bold text-orange-600 mb-2">{invoices.filter(i => i.status !== 'paid').length}</p>
                    <p className="text-xs text-muted-foreground mb-3">Invoices awaiting payment</p>
                    <Link to="/crm/invoices" className="text-sm text-orange-600 hover:text-orange-700 font-semibold">
                      View Invoices →
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sales Leaderboard */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="bg-gray-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Leaderboard</CardTitle>
                <div className="flex gap-4 text-sm">
                  <button className="text-muted-foreground hover:text-foreground font-medium">Week</button>
                  <button className="text-muted-foreground hover:text-foreground font-medium">Month</button>
                  <button className="text-muted-foreground hover:text-foreground font-medium">YTD</button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {leads
                  .filter(l => l.assigned_to)
                  .reduce((acc, lead) => {
                    const existing = acc.find(x => x.rep === lead.assigned_to);
                    if (existing) {
                      existing.sales += lead.estimate_amount || 0;
                    } else {
                      acc.push({ rep: lead.assigned_to, sales: lead.estimate_amount || 0 });
                    }
                    return acc;
                  }, [])
                  .sort((a, b) => b.sales - a.sales)
                  .slice(0, 5)
                  .map((rep, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-gray-400 w-6">{idx + 1}</div>
                        <div>
                          <p className="font-medium text-sm">{rep.rep}</p>
                        </div>
                      </div>
                      <p className="font-bold text-sm">${(rep.sales / 1000).toFixed(0)}K</p>
                    </div>
                  ))}
                {leads.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    <p className="text-sm">No sales data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Schedule & Activity Count */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Work Schedule */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg">Work Schedule</CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-orange-600 mb-2">
                      {jobs.filter(j => j.completion_date && new Date(j.completion_date) < new Date()).length}
                    </p>
                    <p className="text-xs font-medium text-gray-700">Completed<br />Yesterday</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-green-600 mb-2">
                      {jobs.filter(j => j.status === 'in_production').length}
                    </p>
                    <p className="text-xs font-medium text-gray-700">Working<br />on Today</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-3xl font-bold text-blue-600 mb-2">
                      {jobs.filter(j => j.status === 'scheduled').length}
                    </p>
                    <p className="text-xs font-medium text-gray-700">30 Day<br />Outlook</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activity Count: Last 30 Days */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-lg">Activity Count: Last 30 Days</CardTitle>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-700 mb-2">{leads.filter(l => l.status === 'new').length}</p>
                    <p className="text-xs font-medium text-gray-600">New<br />Leads</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-700 mb-2">{jobs.filter(j => j.status === 'approved').length}</p>
                    <p className="text-xs font-medium text-gray-600">Jobs<br />Approved</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-700 mb-2">{jobs.filter(j => j.status === 'final_inspection').length}</p>
                    <p className="text-xs font-medium text-gray-600">Jobs<br />Completed</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-lg font-bold text-gray-700 mb-2">${(invoices.reduce((s, i) => s + (i.paid_amount || 0), 0) / 1000).toFixed(0)}K</p>
                    <p className="text-xs font-medium text-gray-600">Money<br />Collected</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-700 mb-2">{invoices.filter(i => i.status === 'sent').length}</p>
                    <p className="text-xs font-medium text-gray-600">Jobs<br />Invoiced</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-700 mb-2">{jobs.filter(j => j.status === 'closed').length}</p>
                    <p className="text-xs font-medium text-gray-600">Jobs<br />Closed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </div>
  );
}