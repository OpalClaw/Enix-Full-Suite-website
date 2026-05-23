import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Copy, Eye, Download, FileText, DollarSign, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import EstimatePricingEngine from '@/components/crm/EstimatePricingEngine';
import LineItemEditor from '@/components/crm/LineItemEditor';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  sent: 'bg-purple-100 text-purple-700',
  viewed: 'bg-indigo-100 text-indigo-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-orange-100 text-orange-700',
  converted_to_contract: 'bg-emerald-100 text-emerald-700',
};

const serviceTypeLabels = {
  residential_roofing: 'Residential Roofing',
  commercial_roofing: 'Commercial Roofing',
  roof_repair: 'Roof Repair',
  tpo_roofing: 'TPO Roofing',
  bur_roofing: 'BUR Roofing',
  metal_roofing: 'Metal Roofing',
  siding: 'Siding',
  windows: 'Windows',
  doors: 'Doors',
  gutters: 'Gutters',
  storm_damage: 'Storm Damage',
};

export default function EstimatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewEstimate, setShowNewEstimate] = useState(false);
  const [newEstimate, setNewEstimate] = useState({
    estimate_number: `EST-${Date.now()}`,
    customer_name: '',
    customer_email: '',
    property_address: '',
    property_city: '',
    property_state: '',
    property_zip: '',
    service_type: 'residential_roofing',
    line_items: [],
    status: 'draft',
    subtotal: 0,
    total: 0,
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => base44.entities.Estimate.list(),
  });

  const createEstimateMutation = useMutation({
    mutationFn: (data) => base44.entities.Estimate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setShowNewEstimate(false);
      setNewEstimate({
        estimate_number: `EST-${Date.now()}`,
        customer_name: '',
        customer_email: '',
        property_address: '',
        property_city: '',
        property_state: '',
        property_zip: '',
        service_type: 'residential_roofing',
        line_items: [],
        status: 'draft',
        subtotal: 0,
        total: 0,
      });
    },
  });

  const filteredEstimates = estimates.filter(est => {
    const matchesSearch =
      est.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      est.estimate_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || est.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalValue = estimates.reduce((sum, est) => sum + (est.total || 0), 0);
  const approvedCount = estimates.filter(est => est.status === 'approved').length;

  const handleCreateEstimate = async () => {
    if (!newEstimate.customer_name || !newEstimate.property_address) {
      alert('Please fill in customer name and property address');
      return;
    }
    await createEstimateMutation.mutateAsync({
      ...newEstimate,
      created_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Estimates</h1>
          <p className="text-muted-foreground">Create and manage project estimates</p>
        </div>
        <Dialog open={showNewEstimate} onOpenChange={setShowNewEstimate}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> New Estimate
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Estimate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Customer Name"
                value={newEstimate.customer_name}
                onChange={(e) => setNewEstimate({ ...newEstimate, customer_name: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={newEstimate.customer_email}
                onChange={(e) => setNewEstimate({ ...newEstimate, customer_email: e.target.value })}
              />
              <Input
                placeholder="Property Address"
                value={newEstimate.property_address}
                onChange={(e) => setNewEstimate({ ...newEstimate, property_address: e.target.value })}
              />
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="City"
                  value={newEstimate.property_city}
                  onChange={(e) => setNewEstimate({ ...newEstimate, property_city: e.target.value })}
                />
                <Input
                  placeholder="State"
                  value={newEstimate.property_state}
                  onChange={(e) => setNewEstimate({ ...newEstimate, property_state: e.target.value })}
                />
                <Input
                  placeholder="ZIP"
                  value={newEstimate.property_zip}
                  onChange={(e) => setNewEstimate({ ...newEstimate, property_zip: e.target.value })}
                />
              </div>
              <Select value={newEstimate.service_type} onValueChange={(value) => setNewEstimate({ ...newEstimate, service_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(serviceTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div>
                <h3 className="font-semibold mb-3">Line Items</h3>
                <LineItemEditor
                  lineItems={newEstimate.line_items}
                  onChange={(items) => setNewEstimate({ ...newEstimate, line_items: items })}
                />
              </div>

              <EstimatePricingEngine
                lineItems={newEstimate.line_items}
                onCalculationChange={(calcs) => setNewEstimate({ ...newEstimate, ...calcs })}
              />

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNewEstimate(false)}>Cancel</Button>
                <Button onClick={handleCreateEstimate} disabled={createEstimateMutation.isPending}>
                  {createEstimateMutation.isPending ? 'Creating...' : 'Create Estimate'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Estimates</p>
                <p className="text-2xl font-bold">{estimates.length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or estimate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estimates List */}
      <div className="space-y-3">
        {filteredEstimates.map(estimate => (
          <Card key={estimate.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{estimate.customer_name}</h3>
                    <Badge className={statusColors[estimate.status]}>
                      {estimate.status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">#{estimate.estimate_number}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Service</p>
                      <p className="font-medium">{serviceTypeLabels[estimate.service_type]}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-bold">${(estimate.total || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">{estimate.created_date ? format(new Date(estimate.created_date), 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expires</p>
                      <p className="font-medium">{estimate.expiration_date ? format(new Date(estimate.expiration_date), 'MMM d, yyyy') : 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" title="View">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Duplicate">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Export PDF">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEstimates.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No estimates found. Create your first estimate to get started.</p>
        </Card>
      )}
    </div>
  );
}