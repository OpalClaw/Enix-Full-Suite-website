import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Calendar, MapPin, Phone, Mail, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import LeadOverviewEditor from '@/components/crm/LeadOverviewEditor';
import LeadContactEditor from '@/components/crm/LeadContactEditor';
import LeadInsuranceEditor from '@/components/crm/LeadInsuranceEditor';
import EstimateBuilder from '@/components/crm/EstimateBuilder';
import { usePageTitle } from '@/hooks/usePageTitle';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-cyan-100 text-cyan-800',
  inspection_scheduled: 'bg-purple-100 text-purple-800',
  inspection_completed: 'bg-indigo-100 text-indigo-800',
  estimate_created: 'bg-yellow-100 text-yellow-800',
  estimate_sent: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  lost: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function LeadDetail() {
  usePageTitle('Lead Detail');
  const { leadId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [showEstimateDialog, setShowEstimateDialog] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [estimateData, setEstimateData] = useState({
    estimate_number: '',
    labor_cost: '',
    material_cost: '',
    tax: '',
    discount: '',
  });
  const [appointmentData, setAppointmentData] = useState({
    title: '',
    date: '',
    time: '',
    notes: '',
  });

  const { data: lead, isLoading } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => base44.entities.Lead.list().then(leads => leads.find(l => l.id === leadId)),
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates', leadId],
    queryFn: () => base44.entities.Estimate.filter({ lead_id: leadId }),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments', leadId],
    queryFn: () => base44.entities.Appointment.filter({ lead_id: leadId }),
  });

  const updateLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(leadId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const createEstimateMutation = useMutation({
    mutationFn: (data) => base44.entities.Estimate.create({...data, lead_id: leadId, customer_name: `${lead.first_name} ${lead.last_name}`, property_address: lead.address}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates', leadId] });
      setShowEstimateDialog(false);
      setEstimateData({estimate_number: '', labor_cost: '', material_cost: '', tax: '', discount: ''});
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create({...data, lead_id: leadId, customer_name: `${lead.first_name} ${lead.last_name}`, customer_phone: lead.phone}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', leadId] });
      setShowAppointmentDialog(false);
      setAppointmentData({title: '', date: '', time: '', notes: ''});
    },
  });

  const convertToJobMutation = useMutation({
    mutationFn: async () => {
      const currentYear = new Date().getFullYear();
      const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
      const jobNumber = `${currentYear}${sequence}`;

      const newJob = await base44.entities.Job.create({
        job_number: jobNumber,
        lead_id: leadId,
        customer_name: `${lead.first_name} ${lead.last_name}`,
        customer_email: lead.email,
        customer_phone: lead.phone,
        property_address: `${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`,
        service_type: lead.service_needed,
        property_type: lead.property_type,
        status: 'approved',
      });
      return newJob;
    },
    onSuccess: (newJob) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      navigate(`/crm/jobs/${newJob.id}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-3">Loading lead...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
          <p className="text-muted-foreground">Lead not found</p>
          <Button onClick={() => navigate('/crm/leads')} className="mt-4">
            Back to Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="p-6 flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/crm/leads')}
              className="mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="font-heading font-bold text-3xl">
                {lead.first_name} {lead.last_name}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {lead.city}, {lead.state} {lead.zip}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge className={statusColors[lead.status]}>
              {lead.status?.replace(/_/g, ' ')}
            </Badge>
            <Badge className={priorityColors[lead.priority]}>
              {lead.priority} Priority
            </Badge>
            <Button
              onClick={() => convertToJobMutation.mutate()}
              disabled={convertToJobMutation.isPending}
              className="mt-2 gap-2 bg-primary hover:bg-primary/90"
              size="sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              Convert to Job
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="estimates">Estimates</TabsTrigger>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="flex justify-end mb-4">
                <LeadOverviewEditor 
                  lead={lead} 
                  onSave={updateLeadMutation.mutate}
                  isSaving={updateLeadMutation.isPending}
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Service Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Service Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Service Type</p>
                      <p className="text-sm">{lead.service_needed?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Property Type</p>
                      <p className="text-sm">{lead.property_type || 'N/A'}</p>
                    </div>
                    {lead.square_footage && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Square Footage</p>
                        <p className="text-sm">{lead.square_footage.toLocaleString()} sq ft</p>
                      </div>
                    )}
                    {lead.lead_source && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Lead Source</p>
                        <p className="text-sm">{lead.lead_source?.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status & Assignment */}
                <Card>
                  <CardHeader>
                    <CardTitle>Status & Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Lead Status</p>
                      <p className="text-sm">{lead.status?.replace(/_/g, ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Priority</p>
                      <p className="text-sm">{lead.priority}</p>
                    </div>
                    {lead.assigned_to && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Assigned To</p>
                        <p className="text-sm">{lead.assigned_to}</p>
                      </div>
                    )}
                    {lead.inspection_date && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Inspection Date</p>
                        <p className="text-sm">{format(new Date(lead.inspection_date), 'MMM d, yyyy')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Property Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Address</p>
                    <p className="text-sm">
                      {lead.address && `${lead.address}, `}
                      {lead.city && `${lead.city}, `}
                      {lead.state}
                      {lead.zip && ` ${lead.zip}`}
                    </p>
                  </div>
                  {lead.building_name && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Building Name</p>
                      <p className="text-sm">{lead.building_name}</p>
                    </div>
                  )}
                  {lead.property_manager && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Property Manager</p>
                      <p className="text-sm">{lead.property_manager}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="relative">
                <LeadContactEditor 
                  lead={lead} 
                  onSave={updateLeadMutation.mutate}
                  isSaving={updateLeadMutation.isPending}
                />
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Phone</p>
                      <p className="text-sm font-medium">{lead.phone}</p>
                    </div>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Email</p>
                        <p className="text-sm font-medium">{lead.email}</p>
                      </div>
                    </div>
                  )}
                  {lead.follow_up_date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Follow-up Date</p>
                        <p className="text-sm">{format(new Date(lead.follow_up_date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Insurance Information */}
              <Card className="relative">
                <LeadInsuranceEditor 
                  lead={lead} 
                  onSave={updateLeadMutation.mutate}
                  isSaving={updateLeadMutation.isPending}
                />
                <CardHeader>
                  <CardTitle>Insurance Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {lead.insurance_claim ? (
                    <>
                      {lead.insurance_company && (
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Company</p>
                          <p className="text-sm">{lead.insurance_company}</p>
                        </div>
                      )}
                      {lead.claim_number && (
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Claim Number</p>
                          <p className="text-sm">{lead.claim_number}</p>
                        </div>
                      )}
                      {lead.adjuster_name && (
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Adjuster Name</p>
                          <p className="text-sm">{lead.adjuster_name}</p>
                        </div>
                      )}
                      {lead.adjuster_phone && (
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold mb-1">Adjuster Phone</p>
                          <p className="text-sm">{lead.adjuster_phone}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No insurance claim associated with this lead.</p>
                  )}
                </CardContent>
              </Card>

              {/* Estimates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Estimates</span>
                    <Button 
                      size="sm"
                      onClick={() => setShowEstimateDialog(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Create
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {estimates.length > 0 ? (
                    <div className="space-y-2">
                      {estimates.map(estimate => (
                        <Card key={estimate.id} className="p-3">
                          <p className="font-medium text-sm">#{estimate.estimate_number}</p>
                          <p className="text-xs text-muted-foreground">Total: ${(estimate.labor_cost + estimate.material_cost + estimate.tax - estimate.discount).toFixed(2)}</p>
                          <Badge className="mt-2">{estimate.status}</Badge>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No estimates yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>Appointments</span>
                    <Button 
                      size="sm"
                      onClick={() => setShowAppointmentDialog(true)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Schedule
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <div className="space-y-2">
                      {appointments.map(apt => (
                        <Card key={apt.id} className="p-3">
                          <p className="font-medium text-sm">{apt.title}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(`${apt.date}T${apt.time}`), 'MMM d, yyyy h:mm a')}</p>
                          <Badge className="mt-2">{apt.status}</Badge>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
                  )}
                </CardContent>
              </Card>

              {/* Activity Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-orange-600 rounded-full mt-1.5"></div>
                        <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Lead created</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.created_date && format(new Date(lead.created_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm text-muted-foreground">More activity coming as you progress this lead</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {lead.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700">{lead.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-4">
              <Card className="relative">
                <LeadContactEditor 
                  lead={lead} 
                  onSave={updateLeadMutation.mutate}
                  isSaving={updateLeadMutation.isPending}
                />
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Phone</p>
                      <p className="text-sm font-medium">{lead.phone}</p>
                    </div>
                  </div>
                  {lead.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold">Email</p>
                        <p className="text-sm font-medium">{lead.email}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {lead.follow_up_date && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Follow-up Date
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{format(new Date(lead.follow_up_date), 'MMM d, yyyy')}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Insurance Tab */}
            <TabsContent value="insurance" className="space-y-4">
              {lead.insurance_claim ? (
                <Card className="relative">
                  <LeadInsuranceEditor 
                    lead={lead} 
                    onSave={updateLeadMutation.mutate}
                    isSaving={updateLeadMutation.isPending}
                  />
                  <CardHeader>
                    <CardTitle>Insurance Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lead.insurance_company && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Company</p>
                        <p className="text-sm">{lead.insurance_company}</p>
                      </div>
                    )}
                    {lead.claim_number && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Claim Number</p>
                        <p className="text-sm">{lead.claim_number}</p>
                      </div>
                    )}
                    {lead.adjuster_name && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Adjuster Name</p>
                        <p className="text-sm">{lead.adjuster_name}</p>
                      </div>
                    )}
                    {lead.adjuster_phone && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold mb-1">Adjuster Phone</p>
                        <p className="text-sm">{lead.adjuster_phone}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">No insurance claim associated with this lead.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Estimates Tab */}
            <TabsContent value="estimates" className="space-y-4">
              {!showEstimateDialog ? (
                <Button 
                  onClick={() => setShowEstimateDialog(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Create Estimate
                </Button>
              ) : (
                <EstimateBuilder 
                  lead={lead}
                  onCreate={createEstimateMutation.mutate}
                  isLoading={createEstimateMutation.isPending}
                  onClose={() => setShowEstimateDialog(false)}
                />
              )}

              {estimates.length > 0 ? (
                <div className="space-y-2">
                  {estimates.map(estimate => (
                    <Card key={estimate.id}>
                      <CardContent className="pt-6">
                        <p className="font-medium">#{estimate.estimate_number}</p>
                        <p className="text-sm text-muted-foreground">Total: ${(estimate.labor_cost + estimate.material_cost + estimate.tax - estimate.discount).toFixed(2)}</p>
                        <Badge className="mt-2">{estimate.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">No estimates yet.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments" className="space-y-4">
              <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Schedule Appointment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Appointment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold mb-1 block">Title</label>
                      <Input
                        value={appointmentData.title}
                        onChange={(e) => setAppointmentData({...appointmentData, title: e.target.value})}
                        placeholder="Inspection, Follow-up, etc."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold mb-1 block">Date</label>
                        <Input
                          type="date"
                          value={appointmentData.date}
                          onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold mb-1 block">Time</label>
                        <Input
                          type="time"
                          value={appointmentData.time}
                          onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold mb-1 block">Notes</label>
                      <Textarea
                        value={appointmentData.notes}
                        onChange={(e) => setAppointmentData({...appointmentData, notes: e.target.value})}
                        placeholder="Any additional notes..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => createAppointmentMutation.mutate({...appointmentData, type: 'inspection', status: 'scheduled'})}
                        disabled={createAppointmentMutation.isPending}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Schedule
                      </Button>
                      <Button variant="outline" onClick={() => setShowAppointmentDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {appointments.length > 0 ? (
                <div className="space-y-2">
                  {appointments.map(apt => (
                    <Card key={apt.id}>
                      <CardContent className="pt-6">
                        <p className="font-medium">{apt.title}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(`${apt.date}T${apt.time}`), 'MMM d, yyyy h:mm a')}</p>
                        <Badge className="mt-2">{apt.status}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                  <CardDescription>All actions and changes for this lead</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-orange-600 rounded-full mt-1.5"></div>
                        <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Lead created</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.created_date && format(new Date(lead.created_date), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-3 h-3 bg-gray-300 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm text-muted-foreground">More activity coming as you progress this lead</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}