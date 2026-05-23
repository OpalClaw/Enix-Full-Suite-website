import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';

const jobStatuses = [
  'approved',
  'material_ordered',
  'scheduled',
  'in_production',
  'final_inspection',
  'invoiced',
  'paid',
  'closed',
  'on_hold',
];

export default function JobStatusUpdater({ jobId, currentStatus, onSuccess }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: (status) => base44.entities.Job.update(jobId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setOpen(false);
      onSuccess?.();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CheckCircle className="w-4 h-4" /> Update Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Job Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {jobStatuses.map(status => (
            <Button
              key={status}
              variant={currentStatus === status ? 'default' : 'outline'}
              className="w-full justify-start"
              onClick={() => updateStatusMutation.mutate(status)}
              disabled={updateStatusMutation.isPending}
            >
              {status.replace(/_/g, ' ')}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}