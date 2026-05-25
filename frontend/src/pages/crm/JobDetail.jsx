import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import EstimateBuilder from '@/components/crm/EstimateBuilder';
import JobStatusUpdater from '@/components/crm/JobStatusUpdater';
import JobOverviewEditor from '@/components/crm/JobOverviewEditor';
import JobInvoiceBuilder from '@/components/crm/JobInvoiceBuilder';
import JobDocumentsTab from '@/components/crm/JobDocumentsTab';
import { jobStatusColors } from '@/lib/jobStatusColors';

const statusColors = jobStatusColors;

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEstimateBuilder, setShowEstimateBuilder] = useState(false);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => base44.entities.Job.filter({ id: jobId }),
    select: (data) => data[0],
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates', jobId],
    queryFn: () => base44.entities.Estimate.filter({ lead_id: job?.lead_id }),
    enabled: !!job?.lead_id,
  });

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections', jobId],
    queryFn: () => base44.entities.Inspection.filter({ lead_id: job?.lead_id }),
    enabled: !!job?.lead_id,
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials', jobId],
    queryFn: () => base44.entities.Material.filter({ job_id: jobId }),
    enabled: !!jobId,
  });

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', jobId],
    queryFn: () => base44.entities.Invoice.filter({ job_id: jobId }),
    enabled: !!jobId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', jobId],
    queryFn: () => base44.entities.Message.filter({ job_id: jobId }),
    enabled: !!jobId,
  });

  const { data: warranties = [] } = useQuery({
    queryKey: ['warranties', jobId],
    queryFn: () => base44.entities.Warranty.filter({ job_id: jobId }),
    enabled: !!jobId,
  });

  if (!job) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading job details...</p>
      </div>
    );
  }

  const totalMaterialsCost = materials.reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalInvoiced = invoices.reduce((sum, i) => sum + (i.total || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/crm/jobs')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="font-heading font-bold text-3xl">{job.customer_name}</h1>
            <p className="text-muted-foreground">Job #{job.job_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[job.status]}>
            {job.status?.replace(/_/g, ' ')}
          </Badge>
          <JobStatusUpdater jobId={jobId} currentStatus={job.status} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Contract Amount</p>
            <p className="text-2xl font-bold">${(job.contract_amount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Materials Cost</p>
            <p className="text-2xl font-bold">${totalMaterialsCost.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invoiced</p>
            <p className="text-2xl font-bold">${totalInvoiced.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="estimates">Estimates</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <JobOverviewEditor job={job} />
        </TabsContent>

        {/* Estimates Tab */}
        <TabsContent value="estimates" className="space-y-4">
          {showEstimateBuilder && job && (
            <EstimateBuilder
              lead={job}
              onCreate={async (estData) => {
                await base44.entities.Estimate.create({
                  ...estData,
                  lead_id: job.lead_id,
                  job_id: jobId,
                  customer_name: job.customer_name,
                  customer_email: job.customer_email,
                  property_address: job.property_address,
                });
                queryClient.invalidateQueries({ queryKey: ['estimates', jobId] });
                setShowEstimateBuilder(false);
              }}
              isLoading={false}
              onClose={() => setShowEstimateBuilder(false)}
            />
          )}
          {!showEstimateBuilder && (
            <Button className="bg-primary hover:bg-primary/90 mb-4" onClick={() => setShowEstimateBuilder(true)}>
              + Create Estimate
            </Button>
          )}
          {estimates.map(est => (
            <Card key={est.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold">Estimate #{est.estimate_number}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(est.created_date), 'MMM d, yyyy')}</p>
                  </div>
                  <Badge>{est.status}</Badge>
                </div>
                <p className="text-2xl font-bold">${est.total?.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
          {estimates.length === 0 && <p className="text-muted-foreground">No estimates</p>}
        </TabsContent>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-4">
          {materials.map(material => (
            <Card key={material.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{material.product_name}</p>
                    <p className="text-xs text-muted-foreground">{material.supplier}</p>
                  </div>
                  <Badge>{material.status?.replace(/_/g, ' ')}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-1">{material.quantity} {material.unit}</p>
                <p className="font-semibold">${material.cost?.toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
          {materials.length === 0 && <p className="text-muted-foreground">No materials ordered</p>}
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <JobInvoiceBuilder job={job} estimates={estimates} />
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {messages.map(msg => (
            <Card key={msg.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{msg.sender_name}</p>
                    <p className="text-xs text-muted-foreground">{msg.sender_role}</p>
                  </div>
                  {msg.is_internal && <Badge variant="outline">Internal</Badge>}
                </div>
                <p className="text-sm">{msg.content}</p>
              </CardContent>
            </Card>
          ))}
          {messages.length === 0 && <p className="text-muted-foreground">No messages</p>}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <JobDocumentsTab job={job} />
        </TabsContent>
      </Tabs>

      {/* Warranty Section */}
      {warranties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Warranty Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warranties.map(w => (
              <div key={w.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{w.warranty_type}</p>
                  <p className="text-xs text-muted-foreground">{w.duration_years} years</p>
                </div>
                <p className="text-xs text-muted-foreground">{w.manufacturer}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}