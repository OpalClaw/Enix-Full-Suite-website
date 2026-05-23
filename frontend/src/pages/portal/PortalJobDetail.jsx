import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, FileText, Calendar, MessageSquare, Image, Wrench, DollarSign, Shield, Loader2, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import JobDetailCard from '@/components/portal/JobDetailCard';
import ProjectStatusCard from '@/components/portal/ProjectStatusCard';
import RecentActivityFeed from '@/components/portal/RecentActivityFeed';
import NotificationsPanel from '@/components/portal/NotificationsPanel';
import ProjectManagerCard from '@/components/portal/ProjectManagerCard';

const statusColors = {
  approved: 'bg-blue-100 text-blue-700',
  material_ordered: 'bg-yellow-100 text-yellow-700',
  scheduled: 'bg-purple-100 text-purple-700',
  in_production: 'bg-orange-100 text-orange-700',
  final_inspection: 'bg-green-100 text-green-700',
  invoiced: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

export default function PortalJobDetail() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: job, isLoading: jobLoading } = useQuery({
    queryKey: ['portalJob', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const jobs = await base44.entities.Job.filter({ customer_email: user.email });
      return jobs[0] || null;
    },
    enabled: !!user?.email,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['portal-invoices', job?.id],
    queryFn: () => base44.entities.Invoice.filter({ job_id: job.id }),
    enabled: !!job?.id,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['portal-documents', job?.id],
    queryFn: () => base44.entities.SmartDocument.filter({ job_id: job.id }),
    enabled: !!job?.id,
  });

  const { data: warranties = [] } = useQuery({
    queryKey: ['portal-warranties', job?.id],
    queryFn: () => base44.entities.Warranty.filter({ job_id: job.id }),
    enabled: !!job?.id,
  });

  if (userLoading || jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-16 text-center">
            <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No project found</h2>
            <p className="text-muted-foreground">No project found for this account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
  const totalPaid = invoices.reduce((sum, invoice) => sum + (invoice.paid_amount || 0), 0);
  const outstandingBalance = totalInvoiced - totalPaid;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl">{job.customer_name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <Badge className={statusColors[job.status]}>{job.status?.replace(/_/g, ' ')}</Badge>
          <p className="text-muted-foreground">Job #{job.job_number}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Project Amount</p>
            <p className="text-2xl font-bold">${(job.contract_amount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Balance Due</p>
            <p className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              ${outstandingBalance.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="warranty">Warranty</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p>{job.property_address}</p>
                  <p className="text-sm text-muted-foreground">{job.city}, {job.state} {job.zip}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Service Type</p>
                <p className="font-semibold">{job.service_type}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-semibold">{job.start_date ? format(new Date(job.start_date), 'MMM d, yyyy') : 'TBD'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expected Completion</p>
                  <p className="font-semibold">{job.completion_date ? format(new Date(job.completion_date), 'MMM d, yyyy') : 'TBD'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {job.scope_of_work && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scope of Work</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{job.scope_of_work}</p>
              </CardContent>
            </Card>
          )}

          {job.assigned_pm && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Project Manager</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{job.assigned_pm}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">No invoices yet</p>
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">Invoice #{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(invoice.invoice_date), 'MMM d, yyyy')}</p>
                    </div>
                    <Badge>{invoice.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount Due</p>
                      <p className="font-bold">${invoice.total?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount Paid</p>
                      <p className="font-bold">${invoice.paid_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                  {invoice.payment_link && (
                    <a href={invoice.payment_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      Pay Invoice →
                    </a>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {!job.document_urls || job.document_urls.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">No documents available yet</p>
              </CardContent>
            </Card>
          ) : (
            job.document_urls.map((url, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex-1">
                      Document {idx + 1}
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {job.photo_urls && job.photo_urls.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Project Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {job.photo_urls.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg overflow-hidden hover:opacity-80">
                    <img src={url} alt={`Project photo ${idx + 1}`} className="w-full h-32 object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="warranty" className="space-y-4">
          {warranties.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <p className="text-muted-foreground">Warranty information will be available after project completion</p>
              </CardContent>
            </Card>
          ) : (
            warranties.map((warranty) => (
              <Card key={warranty.id}>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Warranty Type</p>
                    <p className="font-semibold">{warranty.warranty_type}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-semibold">{format(new Date(warranty.start_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expires</p>
                      <p className="font-semibold">{format(new Date(warranty.end_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  {warranty.manufacturer && (
                    <div>
                      <p className="text-xs text-muted-foreground">Manufacturer</p>
                      <p className="font-semibold">{warranty.manufacturer}</p>
                    </div>
                  )}
                  {warranty.coverage_details && (
                    <div>
                      <p className="text-xs text-muted-foreground">Coverage Details</p>
                      <p className="text-sm">{warranty.coverage_details}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}