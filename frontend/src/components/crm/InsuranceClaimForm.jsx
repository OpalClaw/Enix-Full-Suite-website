import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function InsuranceClaimForm({ onClose, onSuccess, initialClaim = null }) {
  const [claim, setClaim] = useState(initialClaim || {
    lead_id: '',
    customer_name: '',
    property_address: '',
    insurance_carrier: '',
    claim_number: '',
    date_of_loss: '',
    adjuster_name: '',
    adjuster_phone: '',
    adjuster_email: '',
    deductible: 0,
    acv_amount: 0,
    rcv_amount: 0,
    depreciation_amount: 0,
    recoverable_depreciation: 0,
    mortgage_company: '',
    mortgage_check_required: false,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.InsuranceClaim.create(data),
    onSuccess: () => {
      toast.success('Claim created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to create claim: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.InsuranceClaim.update(initialClaim.id, data),
    onSuccess: () => {
      toast.success('Claim updated successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to update claim: ' + error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!claim.claim_number || !claim.customer_name || !claim.insurance_carrier) {
      toast.error('Please fill in required fields');
      return;
    }

    if (initialClaim) {
      updateMutation.mutate(claim);
    } else {
      createMutation.mutate(claim);
    }
  };

  const handleInputChange = (field, value) => {
    setClaim(prev => ({
      ...prev,
      [field]: field.includes('_') && ['deductible', 'acv_amount', 'rcv_amount', 'depreciation_amount'].includes(field)
        ? parseFloat(value) || 0
        : value,
    }));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialClaim ? 'Edit Claim' : 'New Insurance Claim'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="mortgage">Mortgage</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Customer Name *</label>
                  <Input
                    value={claim.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Claim Number *</label>
                  <Input
                    value={claim.claim_number}
                    onChange={(e) => handleInputChange('claim_number', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Insurance Carrier *</label>
                  <Input
                    value={claim.insurance_carrier}
                    onChange={(e) => handleInputChange('insurance_carrier', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Date of Loss</label>
                  <Input
                    type="date"
                    value={claim.date_of_loss}
                    onChange={(e) => handleInputChange('date_of_loss', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Property Address</label>
                <Input
                  value={claim.property_address}
                  onChange={(e) => handleInputChange('property_address', e.target.value)}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Adjuster Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Adjuster Name"
                    value={claim.adjuster_name}
                    onChange={(e) => handleInputChange('adjuster_name', e.target.value)}
                  />
                  <Input
                    placeholder="Phone"
                    value={claim.adjuster_phone}
                    onChange={(e) => handleInputChange('adjuster_phone', e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={claim.adjuster_email}
                    onChange={(e) => handleInputChange('adjuster_email', e.target.value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Deductible</label>
                  <Input
                    type="number"
                    value={claim.deductible}
                    onChange={(e) => handleInputChange('deductible', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">ACV (Actual Cash Value)</label>
                  <Input
                    type="number"
                    value={claim.acv_amount}
                    onChange={(e) => handleInputChange('acv_amount', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">RCV (Replacement Cost Value)</label>
                  <Input
                    type="number"
                    value={claim.rcv_amount}
                    onChange={(e) => handleInputChange('rcv_amount', e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Depreciation Amount</label>
                  <Input
                    type="number"
                    value={claim.depreciation_amount}
                    onChange={(e) => handleInputChange('depreciation_amount', e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Recoverable Depreciation</label>
                <Input
                  type="number"
                  value={claim.recoverable_depreciation}
                  onChange={(e) => handleInputChange('recoverable_depreciation', e.target.value)}
                  placeholder="0"
                />
              </div>

              <Card className="bg-blue-50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ACV - Deductible:</span>
                    <span className="font-semibold">${((claim.acv_amount || 0) - (claim.deductible || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>RCV - Deductible:</span>
                    <span className="font-semibold">${((claim.rcv_amount || 0) - (claim.deductible || 0)).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t pt-2">
                    <span>Recoverable Depreciation:</span>
                    <span>${(claim.recoverable_depreciation || 0).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mortgage Tab */}
            <TabsContent value="mortgage" className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground">Mortgage Company</label>
                <Input
                  value={claim.mortgage_company}
                  onChange={(e) => handleInputChange('mortgage_company', e.target.value)}
                  placeholder="Enter mortgage company name"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="mortgage_required"
                  checked={claim.mortgage_check_required}
                  onChange={(e) => handleInputChange('mortgage_check_required', e.target.checked)}
                />
                <label htmlFor="mortgage_required" className="text-sm">Mortgage check required</label>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {initialClaim ? 'Update Claim' : 'Create Claim'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}