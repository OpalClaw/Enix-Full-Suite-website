import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Briefcase, DollarSign } from 'lucide-react';

export default function Reports() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 1000),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 1000),
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 1000),
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => base44.entities.Estimate.list('-created_date', 1000),
  });

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    const closedLeads = leads.filter(l => l.status === 'paid' || l.status === 'closed').length;
    const lostLeads = leads.filter(l => l.status === 'lost').length;
    const closeRate = totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : 0;

    const totalRevenue = jobs.reduce((sum, j) => sum + (j.contract_amount || 0), 0);
    const jobsInProduction = jobs.filter(j => j.status === 'in_production').length;
    const completedJobs = jobs.filter(j => j.status === 'closed').length;
    const averageJobValue = completedJobs > 0 ? (totalRevenue / completedJobs).toFixed(0) : 0;

    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);
    const outstandingBalance = totalInvoiced - totalPaid;

    const estimatesSent = estimates.filter(e => e.status !== 'draft').length;
    const estimatesApproved = estimates.filter(e => e.customer_approved).length;

    return {
      totalLeads,
      closedLeads,
      lostLeads,
      closeRate,
      totalRevenue,
      jobsInProduction,
      completedJobs,
      averageJobValue,
      totalInvoiced,
      totalPaid,
      outstandingBalance,
      estimatesSent,
      estimatesApproved,
    };
  }, [leads, jobs, invoices, estimates]);

  // Lead source breakdown
  const leadSources = useMemo(() => {
    const sources = {};
    leads.forEach(lead => {
      const source = lead.lead_source || 'other';
      sources[source] = (sources[source] || 0) + 1;
    });
    return Object.entries(sources).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    }));
  }, [leads]);

  // Jobs by status
  const jobsByStatus = useMemo(() => {
    const statuses = {};
    jobs.forEach(job => {
      const status = job.status || 'unknown';
      statuses[status] = (statuses[status] || 0) + 1;
    });
    return Object.entries(statuses).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    }));
  }, [jobs]);

  // Monthly revenue
  const monthlyRevenue = useMemo(() => {
    const months = {};
    jobs.forEach(job => {
      if (job.created_date) {
        const month = new Date(job.created_date).toLocaleString('default', { month: 'short', year: '2-digit' });
        months[month] = (months[month] || 0) + (job.contract_amount || 0);
      }
    });
    return Object.entries(months)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-12)
      .map(([name, value]) => ({
        name,
        revenue: Math.round(value / 1000),
      }));
  }, [jobs]);

  const COLORS = ['#003366', '#336bad', '#6690c2', '#99b5d6', '#ccdaeb'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-3xl">Reports & Analytics</h1>
        <p className="text-muted-foreground">Business performance and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Close Rate</p>
                <p className="text-3xl font-bold">{metrics.closeRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.closedLeads} of {metrics.totalLeads} leads</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${(metrics.totalRevenue / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.completedJobs} completed jobs</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Job Value</p>
                <p className="text-2xl font-bold">${(metrics.averageJobValue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground mt-1">{metrics.jobsInProduction} in production</p>
              </div>
              <Briefcase className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Outstanding Balance</p>
                <p className="text-2xl font-bold">${(metrics.outstandingBalance / 1000).toFixed(0)}K</p>
                <p className="text-xs text-muted-foreground mt-1">of ${(metrics.totalInvoiced / 1000).toFixed(0)}K invoiced</p>
              </div>
              <Users className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue (Last 12 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}K`} />
                <Line type="monotone" dataKey="revenue" stroke="#003366" strokeWidth={2} dot={{ fill: '#003366' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={leadSources} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Jobs by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobsByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#003366" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">New Leads</span>
              <Badge variant="outline">{leads.filter(l => l.status === 'new').length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">In Progress</span>
              <Badge variant="outline">{leads.filter(l => ['contacted', 'inspection_scheduled', 'estimate_created', 'follow_up'].includes(l.status)).length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Ready to Close</span>
              <Badge variant="outline">{leads.filter(l => ['estimate_sent', 'approved'].includes(l.status)).length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Closed/Won</span>
              <Badge className="bg-green-100 text-green-700">{metrics.closedLeads}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Lost</span>
              <Badge className="bg-red-100 text-red-700">{metrics.lostLeads}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimate Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Sent</span>
              <span className="font-bold">{metrics.estimatesSent}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Approved</span>
              <span className="font-bold text-green-600">{metrics.estimatesApproved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Approval Rate</span>
              <span className="font-bold">{metrics.estimatesSent > 0 ? ((metrics.estimatesApproved / metrics.estimatesSent) * 100).toFixed(0) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Invoiced</span>
              <span className="font-bold">${(metrics.totalInvoiced / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Paid</span>
              <span className="font-bold text-green-600">${(metrics.totalPaid / 1000).toFixed(0)}K</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Collection Rate</span>
              <span className="font-bold">{metrics.totalInvoiced > 0 ? ((metrics.totalPaid / metrics.totalInvoiced) * 100).toFixed(0) : 0}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overall Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Leads</span>
              <span className="font-bold">{metrics.totalLeads - metrics.closedLeads - metrics.lostLeads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Jobs</span>
              <span className="font-bold">{jobs.filter(j => !['closed', 'on_hold'].includes(j.status)).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Completed Jobs</span>
              <span className="font-bold text-green-600">{metrics.completedJobs}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}