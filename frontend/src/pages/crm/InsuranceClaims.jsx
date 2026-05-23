import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, TrendingUp, DollarSign, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import InsuranceClaimForm from '@/components/crm/InsuranceClaimForm';
import InsuranceClaimDetail from '@/components/crm/InsuranceClaimDetail';

const statusColors = {
  new: 'bg-blue-100 text-blue-700',
  submitted: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  supplemented: 'bg-purple-100 text-purple-700',
  denied: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

export default function InsuranceClaims() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const queryClient = useQueryClient();

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['insuranceClaims'],
    queryFn: () => base44.entities.InsuranceClaim.list(),
  });

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claim_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.insurance_carrier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.claim_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary metrics
  const totalACV = claims.reduce((sum, c) => sum + (c.acv_amount || 0), 0);
  const totalRCV = claims.reduce((sum, c) => sum + (c.rcv_amount || 0), 0);
  const totalApproved = claims.reduce((sum, c) => sum + (c.approved_amount || 0), 0);
  const pendingSupplements = claims.filter(c => c.supplements?.some(s => s.status === 'draft' || s.status === 'submitted')).length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-96"><p className="text-muted-foreground">Loading claims...</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Insurance Claims</h1>
          <p className="text-muted-foreground">Manage insurance estimates and supplements</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Claim
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total ACV</p>
                <p className="text-2xl font-bold">${(totalACV / 1000).toFixed(1)}k</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total RCV</p>
                <p className="text-2xl font-bold">${(totalRCV / 1000).toFixed(1)}k</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Approved Amount</p>
                <p className="text-2xl font-bold">${(totalApproved / 1000).toFixed(1)}k</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Pending Supplements</p>
                <p className="text-2xl font-bold">{pendingSupplements}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Claim #, customer, carrier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-40">
          <label className="text-xs text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
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
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No claims found
            </CardContent>
          </Card>
        ) : (
          filteredClaims.map(claim => (
            <Card key={claim.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedClaim(claim)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">Claim #{claim.claim_number}</h3>
                      <Badge className={statusColors[claim.claim_status]}>
                        {claim.claim_status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-medium">{claim.customer_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Carrier</p>
                        <p className="font-medium">{claim.insurance_carrier}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">ACV / RCV</p>
                        <p className="font-medium">${(claim.acv_amount || 0).toLocaleString()} / ${(claim.rcv_amount || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Loss Date</p>
                        <p className="font-medium">{claim.date_of_loss ? format(new Date(claim.date_of_loss), 'MMM d, yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Forms */}
      {showForm && (
        <InsuranceClaimForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['insuranceClaims'] });
            setShowForm(false);
          }}
        />
      )}

      {selectedClaim && (
        <InsuranceClaimDetail
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ['insuranceClaims'] })}
        />
      )}
    </div>
  );
}