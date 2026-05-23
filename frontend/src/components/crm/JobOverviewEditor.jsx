import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, MapPin, Calendar, Edit2, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function JobOverviewEditor({ job }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: job.customer_name,
    customer_phone: job.customer_phone,
    customer_email: job.customer_email,
    property_address: job.property_address,
    city: job.city,
    state: job.state,
    zip: job.zip,
    service_type: job.service_type,
    property_type: job.property_type,
    start_date: job.start_date,
    completion_date: job.completion_date,
    scope_of_work: job.scope_of_work,
    assigned_sales: job.assigned_sales,
    assigned_pm: job.assigned_pm,
    assigned_crew: job.assigned_crew,
  });

  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Job.update(job.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-900 mb-1 block">Name</label>
                <Input
                  value={formData.customer_name}
                  onChange={(e) => handleChange('customer_name', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-900 mb-1 block">Phone</label>
                <Input
                  value={formData.customer_phone}
                  onChange={(e) => handleChange('customer_phone', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-900 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) => handleChange('customer_email', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Project Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-900 mb-1 block">Service Type</label>
                <Input
                  value={formData.service_type}
                  onChange={(e) => handleChange('service_type', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-900 mb-1 block">Property Type</label>
                <Input
                  value={formData.property_type}
                  onChange={(e) => handleChange('property_type', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-900 mb-1 block">Start Date</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-900 mb-1 block">Completion</label>
                  <Input
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => handleChange('completion_date', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Property Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Address"
              value={formData.property_address}
              onChange={(e) => handleChange('property_address', e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
              <Input
                placeholder="State"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
              />
              <Input
                placeholder="Zip"
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Scope of Work */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scope of Work</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.scope_of_work}
              onChange={(e) => handleChange('scope_of_work', e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Team Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-1 block">Sales Rep</label>
              <Input
                value={formData.assigned_sales}
                onChange={(e) => handleChange('assigned_sales', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-1 block">Project Manager</label>
              <Input
                value={formData.assigned_pm}
                onChange={(e) => handleChange('assigned_pm', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-900 mb-1 block">Crew</label>
              <Input
                value={formData.assigned_crew}
                onChange={(e) => handleChange('assigned_crew', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-primary">
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-4 h-4 mr-2" /> Edit Overview
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{job.customer_phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span>{job.customer_email}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p>{job.property_address}</p>
                <p className="text-sm text-muted-foreground">{job.city}, {job.state} {job.zip}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">Service Type</p>
              <p className="font-semibold">{job.service_type}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Property Type</p>
              <p className="font-semibold">{job.property_type}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Start Date</p>
                <p className="font-semibold">{job.start_date ? format(new Date(job.start_date), 'MMM d, yyyy') : 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completion</p>
                <p className="font-semibold">{job.completion_date ? format(new Date(job.completion_date), 'MMM d, yyyy') : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scope of Work */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scope of Work</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">{job.scope_of_work || 'No scope defined'}</p>
        </CardContent>
      </Card>

      {/* Team Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Sales Rep</p>
            <p className="font-semibold">{job.assigned_sales || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Project Manager</p>
            <p className="font-semibold">{job.assigned_pm || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Crew</p>
            <p className="font-semibold">{job.assigned_crew || 'Unassigned'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}