import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';

export function CreateCustomerFromLead({ lead, onSuccess }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const customer = await base44.entities.Customer.create({
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        mobile: lead.phone,
        property_address: lead.address,
        property_city: lead.city,
        property_state: lead.state,
        property_zip: lead.zip,
        customer_type: lead.property_type === 'commercial' ? 'property_manager' : 'homeowner',
      });
      return customer;
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created from lead');
      setOpen(false);
      onSuccess?.(customer);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <ArrowRight className="w-3 h-3" />
          Create Customer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Customer from Lead</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded">
            <p className="text-sm"><strong>Name:</strong> {lead.first_name} {lead.last_name}</p>
            <p className="text-sm"><strong>Phone:</strong> {lead.phone}</p>
            <p className="text-sm"><strong>Property:</strong> {lead.address}</p>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Creating...' : 'Confirm & Create Customer'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateEstimateFromLead({ lead }) {
  const [open, setOpen] = useState(false);
  const [estimateNumber, setEstimateNumber] = useState(`EST-${Date.now().toString().slice(-6)}`);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Estimate.create({
        estimate_number: estimateNumber,
        lead_id: lead.id,
        customer_name: `${lead.first_name} ${lead.last_name}`,
        customer_email: lead.email,
        property_address: lead.address,
        service_type: lead.service_needed,
        property_type: lead.property_type,
        total: 0,
        status: 'draft',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Estimate created');
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <ArrowRight className="w-3 h-3" />
          Create Estimate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Estimate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Estimate Number</Label>
            <Input value={estimateNumber} onChange={(e) => setEstimateNumber(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Creating...' : 'Create Estimate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ConvertEstimateToContract({ estimate }) {
  const [open, setOpen] = useState(false);
  const [contractNumber, setContractNumber] = useState(`CNT-${Date.now().toString().slice(-6)}`);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Contract.create({
        contract_number: contractNumber,
        estimate_id: estimate.id,
        customer_name: estimate.customer_name,
        customer_email: estimate.customer_email,
        property_address: estimate.property_address,
        service_type: estimate.service_type,
        contract_price: estimate.total,
        status: 'draft',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      toast.success('Contract created from estimate');
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <ArrowRight className="w-3 h-3" />
          Create Contract
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Contract from Estimate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded">
            <p className="text-sm"><strong>Amount:</strong> ${estimate.total?.toLocaleString()}</p>
            <p className="text-sm"><strong>Service:</strong> {estimate.service_type}</p>
          </div>
          <div>
            <Label>Contract Number</Label>
            <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Creating...' : 'Create Contract'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateJobFromContract({ contract }) {
  const [open, setOpen] = useState(false);
  const [jobNumber, setJobNumber] = useState(`JOB-${Date.now().toString().slice(-6)}`);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Job.create({
        job_number: jobNumber,
        contract_id: contract.id,
        customer_name: contract.customer_name,
        customer_email: contract.customer_email,
        property_address: contract.property_address,
        service_type: contract.service_type,
        contract_amount: contract.contract_price,
        status: 'approved',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created from contract');
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-2">
          <ArrowRight className="w-3 h-3" />
          Create Job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Job from Contract</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded">
            <p className="text-sm"><strong>Contract:</strong> {contract.contract_number}</p>
            <p className="text-sm"><strong>Amount:</strong> ${contract.contract_price?.toLocaleString()}</p>
          </div>
          <div>
            <Label>Job Number</Label>
            <Input value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} />
          </div>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Creating...' : 'Create Job'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}