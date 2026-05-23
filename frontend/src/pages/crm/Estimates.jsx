import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConvertEstimateToContract } from '@/components/crm/WorkflowActions';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
};

export default function Estimates() {
  const navigate = useNavigate();
  const [selectedEstimate, setSelectedEstimate] = useState(null);

  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => base44.entities.Estimate.list('-created_date', 100),
  });

  const totalValue = estimates.reduce((sum, e) => sum + (e.total || 0), 0);
  const approved = estimates.filter(e => e.customer_approved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Estimates</h1>
          <p className="text-muted-foreground">Create and manage proposals</p>
        </div>
        <Button className="bg-navy-600 hover:bg-navy-700" onClick={() => navigate('/crm/estimates/new')}>
          <Plus className="w-4 h-4 mr-2" /> New Estimate
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(1)}K</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-600">{approved}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Review</p>
            <p className="text-2xl font-bold">{estimates.filter(e => e.status === 'sent').length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {estimates.map(estimate => (
          <Card key={estimate.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedEstimate(estimate)}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{estimate.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-semibold text-sm">{estimate.service_type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> {estimate.total?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approval</p>
                  <Badge className={estimate.customer_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {estimate.customer_approved ? 'Approved' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <Badge className={statusColors[estimate.status] || 'bg-gray-100'}>
                    {estimate.status?.replace(/_/g, ' ')}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/crm/estimates/${estimate.id}`)}>View</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estimate Detail Modal */}
      {selectedEstimate && (
        <Dialog open={!!selectedEstimate} onOpenChange={() => setSelectedEstimate(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Estimate #{selectedEstimate.estimate_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedEstimate.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="font-semibold">{selectedEstimate.service_type?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${selectedEstimate.total?.toLocaleString()}</p>
              </div>
              <div className="flex gap-2 pt-3 border-t">
                {selectedEstimate.customer_approved && (
                  <ConvertEstimateToContract estimate={selectedEstimate} />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}