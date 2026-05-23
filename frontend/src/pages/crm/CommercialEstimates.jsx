import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, MoreVertical, Trash2, Eye } from 'lucide-react';
import CommercialEstimateForm from '@/components/crm/CommercialEstimateForm';
import CommercialEstimateViewer from '@/components/crm/CommercialEstimateViewer';

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-gray-100 text-gray-800',
};

export default function CommercialEstimates() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const { data: estimates = [], isLoading } = useQuery({
    queryKey: ['commercialEstimates'],
    queryFn: () => base44.entities.CommercialEstimate.list(),
  });

  const deleteEstimateMutation = useMutation({
    mutationFn: (estimateId) => base44.entities.CommercialEstimate.delete(estimateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercialEstimates'] });
    },
  });

  const filteredEstimates = estimates.filter((est) =>
    est.building_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    est.estimate_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEstimates = estimates.length;
  const totalValue = estimates.reduce((sum, est) => sum + (est.total_estimate || 0), 0);
  const approvedCount = estimates.filter((est) => est.status === 'approved').length;

  if (isLoading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Commercial Estimates</h1>
        <Button onClick={() => { setShowForm(true); setSelectedLeadId(null); }} className="gap-2">
          <Plus className="w-4 h-4" /> New Estimate
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-gray-600 text-sm mb-2">Total Estimates</div>
            <div className="text-3xl font-bold">{totalEstimates}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-gray-600 text-sm mb-2">Total Value</div>
            <div className="text-3xl font-bold">${(totalValue / 1000).toFixed(1)}K</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-gray-600 text-sm mb-2">Approved</div>
            <div className="text-3xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by building name or estimate #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1"
        />
      </div>

      {/* Estimates List */}
      <div className="grid gap-4">
        {filteredEstimates.map((estimate) => (
          <Card key={estimate.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{estimate.building_name}</h3>
                    <Badge className={statusColors[estimate.status]}>
                      {estimate.status}
                    </Badge>
                    {estimate.service_agreement_included && (
                      <Badge variant="outline">Service Plan</Badge>
                    )}
                    {estimate.is_phased_project && (
                      <Badge variant="outline">Phased</Badge>
                    )}
                    {estimate.is_multi_building && (
                      <Badge variant="outline">{estimate.building_count} Buildings</Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {estimate.estimate_number} • {estimate.roof_system} • {estimate.property_address}
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Size:</span>
                      <span className="ml-1 font-medium">{estimate.roof_size_sqft.toLocaleString()} sq ft</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Penetrations:</span>
                      <span className="ml-1 font-medium">{estimate.number_of_penetrations}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">HVAC:</span>
                      <span className="ml-1 font-medium">{estimate.hvac_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Cranes:</span>
                      <span className="ml-1 font-medium">{estimate.crane_required ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-primary mb-4">
                    ${estimate.total_estimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  {estimate.service_agreement_included && (
                    <div className="text-sm text-gray-600 mb-2">
                      Service: ${estimate.service_agreement_annual_cost}/year
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedEstimate(estimate)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteEstimateMutation.mutate(estimate.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEstimates.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            No commercial estimates found. Create one to get started!
          </CardContent>
        </Card>
      )}

      {/* Forms and Viewers */}
      <CommercialEstimateForm
        leadId={selectedLeadId}
        open={showForm}
        onClose={() => setShowForm(false)}
      />
      {selectedEstimate && (
        <CommercialEstimateViewer
          estimate={selectedEstimate}
          open={!!selectedEstimate}
          onClose={() => setSelectedEstimate(null)}
        />
      )}
    </div>
  );
}