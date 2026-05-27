import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Plus, Send, Loader2, FileEdit } from 'lucide-react';
import { toast } from 'sonner';
import { CreateJobFromContract } from '@/components/crm/WorkflowActions';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_signature: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-yellow-100 text-yellow-700',
  signed: 'bg-green-100 text-green-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  void: 'bg-red-100 text-red-700',
};

const EMPTY = {
  template_id: '',
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  property_address: '',
  title: '',
  contract_price: '',
  estimate_id: '',
  job_id: '',
};

export default function Contracts() {
  const queryClient = useQueryClient();
  const [selectedContract, setSelectedContract] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_at', 100),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['contract-templates'],
    queryFn: () =>
      base44.entities.SmartDocument.filter({ document_type: 'contract_template' }),
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates', 'for-contracts'],
    queryFn: () => base44.entities.Estimate.list('-created_at', 100),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contract.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success(`Contract ${created.contract_number} created`);
      setForm(EMPTY);
      setOpen(false);
    },
    onError: (e) => toast.error(e?.message || 'Failed to create contract'),
  });

  const sendMutation = useMutation({
    mutationFn: (contractId) =>
      base44.functions.invoke('sendContractForSignature', { contractId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Sent for signature');
      setSelectedContract(null);
    },
    onError: (e) =>
      toast.error(
        e?.message ||
          'Send failed — confirm DocuSign credentials in Settings → Integrations',
      ),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.title) {
      toast.error('Customer and title are required');
      return;
    }
    createMutation.mutate({
      ...form,
      template_id: form.template_id || undefined,
      estimate_id: form.estimate_id || undefined,
      contract_price: form.contract_price ? Number(form.contract_price) : undefined,
    });
  };

  const signed = contracts.filter((c) => c.signed).length;
  const pending = contracts.filter(
    (c) => c.status === 'pending_signature' || c.status === 'sent',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Contracts</h1>
          <p className="text-muted-foreground">Manage customer agreements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/crm/contracts/templates">
              <FileEdit className="w-4 h-4 mr-2" /> Templates
            </Link>
          </Button>
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New contract
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Contracts</p>
            <p className="text-2xl font-bold">{contracts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Signed</p>
            <p className="text-2xl font-bold text-green-600">{signed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Signature</p>
            <p className="text-2xl font-bold text-orange-600">{pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        )}
        {!isLoading && contracts.length === 0 && (
          <p className="text-sm text-muted-foreground">No contracts yet.</p>
        )}
        {contracts.map((contract) => (
          <Card
            key={contract.id}
            className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedContract(contract)}
          >
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Contract</p>
                  <p className="font-semibold">{contract.contract_number || contract.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold text-sm">{contract.customer_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-semibold">
                    {contract.contract_price
                      ? `$${Number(contract.contract_price).toLocaleString()}`
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Signature</p>
                  <Badge
                    className={
                      contract.signed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {contract.signed ? 'Signed' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <Badge className={statusColors[contract.status] || 'bg-gray-100'}>
                    {contract.status?.replace(/_/g, ' ')}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                    <FileText className="w-4 h-4 mr-1" /> View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Contract #{selectedContract.contract_number || selectedContract.id.slice(0, 8)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedContract.customer_name || '—'}</p>
                  {selectedContract.customer_email && (
                    <p className="text-xs text-muted-foreground">
                      {selectedContract.customer_email}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedContract.status]}>
                    {selectedContract.status?.replace(/_/g, ' ')}
                  </Badge>
                  {selectedContract.docusign_envelope_id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      DocuSign envelope: {selectedContract.docusign_envelope_id.slice(0, 10)}…
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contract price</p>
                <p className="text-2xl font-bold">
                  {selectedContract.contract_price
                    ? `$${Number(selectedContract.contract_price).toLocaleString()}`
                    : '—'}
                </p>
              </div>
              {!selectedContract.signed && (
                <div className="pt-3 border-t">
                  <Button
                    className="w-full"
                    onClick={() => sendMutation.mutate(selectedContract.id)}
                    disabled={
                      sendMutation.isPending || !selectedContract.customer_email
                    }
                  >
                    {sendMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Send for signature
                      </>
                    )}
                  </Button>
                  {!selectedContract.customer_email && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Add a customer email before sending.
                    </p>
                  )}
                </div>
              )}
              {selectedContract.signed && (
                <div className="pt-3 border-t">
                  <CreateJobFromContract contract={selectedContract} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New contract</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Template</Label>
              <Select
                value={form.template_id}
                onValueChange={(v) => setForm({ ...form, template_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="(none — blank contract)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.document_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Residential roofing — 123 Main St"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Customer name *</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Customer email</Label>
              <Input
                type="email"
                value={form.customer_email}
                onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Customer phone</Label>
              <Input
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Contract price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.contract_price}
                onChange={(e) => setForm({ ...form, contract_price: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Property address</Label>
              <Input
                value={form.property_address}
                onChange={(e) => setForm({ ...form, property_address: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Link to estimate</Label>
              <Select
                value={form.estimate_id}
                onValueChange={(v) => setForm({ ...form, estimate_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="(optional)" />
                </SelectTrigger>
                <SelectContent>
                  {estimates.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.estimate_number || e.id.slice(0, 8)} — $
                      {Number(e.total || 0).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create contract'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
