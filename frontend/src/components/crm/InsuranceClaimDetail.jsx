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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  supplemented: 'bg-purple-100 text-purple-700',
  denied: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const supplementStatusColors = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
};

export default function InsuranceClaimDetail({ claim, onClose, onUpdate }) {
  const [editedClaim, setEditedClaim] = useState(claim);
  const [showAddSupplement, setShowAddSupplement] = useState(false);
  const [newSupplement, setNewSupplement] = useState({
    reason: '',
    amount_requested: 0,
    notes: '',
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.InsuranceClaim.update(claim.id, data),
    onSuccess: () => {
      toast.success('Claim updated');
      onUpdate();
    },
    onError: (error) => {
      toast.error('Failed to update claim: ' + error.message);
    },
  });

  const handleAddSupplement = () => {
    if (!newSupplement.reason || newSupplement.amount_requested <= 0) {
      toast.error('Please fill in all supplement fields');
      return;
    }

    const supplements = editedClaim.supplements || [];
    const newSupps = [
      ...supplements,
      {
        supplement_number: supplements.length + 1,
        submitted_date: null,
        approved_date: null,
        amount_requested: newSupplement.amount_requested,
        amount_approved: 0,
        reason: newSupplement.reason,
        status: 'draft',
        notes: newSupplement.notes,
      },
    ];

    setEditedClaim(prev => ({ ...prev, supplements: newSupps }));
    setNewSupplement({ reason: '', amount_requested: 0, notes: '' });
    setShowAddSupplement(false);
  };

  const handleRemoveSupplement = (index) => {
    const supplements = editedClaim.supplements?.filter((_, i) => i !== index) || [];
    setEditedClaim(prev => ({ ...prev, supplements }));
  };

  const handleSave = () => {
    updateMutation.mutate({
      ...editedClaim,
      claim_status: editedClaim.claim_status,
      supplements: editedClaim.supplements,
    });
  };

  const totalSupplementsRequested = (editedClaim.supplements || []).reduce(
    (sum, s) => sum + (s.amount_requested || 0),
    0
  );
  const totalSupplementsApproved = (editedClaim.supplements || []).reduce(
    (sum, s) => sum + (s.amount_approved || 0),
    0
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Claim #{editedClaim.claim_number}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="estimates">Estimates</TabsTrigger>
            <TabsTrigger value="supplements">Supplements</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Select value={editedClaim.claim_status} onValueChange={(value) => setEditedClaim(prev => ({ ...prev, claim_status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="supplemented">Supplemented</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Date of Loss</label>
                <Input
                  type="date"
                  value={editedClaim.date_of_loss}
                  onChange={(e) => setEditedClaim(prev => ({ ...prev, date_of_loss: e.target.value }))}
                />
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-muted-foreground">ACV</p>
                    <p className="font-bold">${(editedClaim.acv_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-muted-foreground">RCV</p>
                    <p className="font-bold">${(editedClaim.rcv_amount || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <p className="text-xs text-muted-foreground">Deductible</p>
                    <p className="font-bold">${(editedClaim.deductible || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-muted-foreground">Depreciation</p>
                    <p className="font-bold">${(editedClaim.depreciation_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adjuster Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <Input
                    value={editedClaim.adjuster_name}
                    onChange={(e) => setEditedClaim(prev => ({ ...prev, adjuster_name: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <Input
                    value={editedClaim.adjuster_phone}
                    onChange={(e) => setEditedClaim(prev => ({ ...prev, adjuster_phone: e.target.value }))}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <Input
                    value={editedClaim.adjuster_email}
                    onChange={(e) => setEditedClaim(prev => ({ ...prev, adjuster_email: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Estimates Tab */}
          <TabsContent value="estimates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estimate Comparison</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Our Estimate</p>
                    <p className="text-2xl font-bold">${(editedClaim.our_estimate_total || 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Insurance Estimate</p>
                    <p className="text-2xl font-bold">${(editedClaim.insurance_estimate_total || 0).toLocaleString()}</p>
                  </div>
                </div>
                {editedClaim.estimate_variance && (
                  <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                    <p className="text-xs text-muted-foreground">Variance</p>
                    <p className="font-bold text-lg">${Math.abs(editedClaim.estimate_variance).toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Scope of Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Our Scope</label>
                  <Textarea
                    value={editedClaim.scope_of_work_estimate}
                    onChange={(e) => setEditedClaim(prev => ({ ...prev, scope_of_work_estimate: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Insurance Scope</label>
                  <Textarea
                    value={editedClaim.scope_of_work_insurance}
                    onChange={(e) => setEditedClaim(prev => ({ ...prev, scope_of_work_insurance: e.target.value }))}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supplements Tab */}
          <TabsContent value="supplements" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">Supplement Summary</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Total Requested</p>
                    <p className="font-bold">${totalSupplementsRequested.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-xs text-muted-foreground">Total Approved</p>
                    <p className="font-bold">${totalSupplementsApproved.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowAddSupplement(true)} size="sm" gap="2">
                <Plus className="w-4 h-4" /> Add Supplement
              </Button>
            </div>

            {showAddSupplement && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4 space-y-3">
                  <Input
                    placeholder="Reason for supplement"
                    value={newSupplement.reason}
                    onChange={(e) => setNewSupplement(prev => ({ ...prev, reason: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Amount requested"
                    value={newSupplement.amount_requested}
                    onChange={(e) => setNewSupplement(prev => ({ ...prev, amount_requested: parseFloat(e.target.value) || 0 }))}
                  />
                  <Textarea
                    placeholder="Notes"
                    value={newSupplement.notes}
                    onChange={(e) => setNewSupplement(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddSupplement}>Add</Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddSupplement(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {(editedClaim.supplements || []).map((supplement, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">Supplement #{supplement.supplement_number}</h4>
                        <Badge className={supplementStatusColors[supplement.status]}>
                          {supplement.status}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveSupplement(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Reason</p>
                        <p>{supplement.reason}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Requested / Approved</p>
                        <p className="font-semibold">${supplement.amount_requested.toLocaleString()} / ${supplement.amount_approved?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                    {supplement.notes && <p className="text-sm text-muted-foreground bg-muted p-2 rounded">{supplement.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Document upload functionality coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}