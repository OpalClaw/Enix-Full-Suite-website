import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const WARRANTY_TYPES = [
  'manufacturer',
  'workmanship',
  'roofing',
  'siding',
  'windows',
  'doors',
  'gutters',
];

const EMPTY = {
  job_id: '',
  customer_name: '',
  customer_email: '',
  property_address: '',
  warranty_type: 'workmanship',
  manufacturer: '',
  coverage_years: 10,
  start_date: '',
  notes: '',
};

export default function Warranties() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: warranties = [], isLoading } = useQuery({
    queryKey: ['warranties'],
    queryFn: () => base44.entities.Warranty.list('-created_at', 100),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: () => base44.entities.Job.list('-created_at', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Warranty.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Warranty created');
      setForm(EMPTY);
      setOpen(false);
    },
    onError: (e) => toast.error(e?.message || 'Failed to create warranty'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Warranty.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Warranty deleted');
    },
    onError: (e) => toast.error(e?.message || 'Failed to delete warranty'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.job_id || !form.start_date || !form.coverage_years) {
      toast.error('Job, start date, and coverage years are required');
      return;
    }
    createMutation.mutate({
      ...form,
      coverage_years: Number(form.coverage_years),
      start_date: new Date(form.start_date).toISOString(),
    });
  };

  const active = warranties.filter((w) => w.active).length;
  const expired = warranties.filter((w) => !w.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Warranties</h1>
          <p className="text-muted-foreground">Track coverage and claims</p>
        </div>
        <Button className="bg-navy-600 hover:bg-navy-700" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Warranty
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Warranties</p>
            <p className="text-2xl font-bold">{warranties.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{active}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-orange-600">{expired}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading warranties…</p>}
        {!isLoading && warranties.length === 0 && (
          <p className="text-sm text-muted-foreground">No warranties yet.</p>
        )}
        {warranties.map((warranty) => (
          <Card key={warranty.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{warranty.customer_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold text-sm">
                    {warranty.warranty_type?.replace(/_/g, ' ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold">
                    {warranty.duration_years ?? warranty.coverage_years} years
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="font-semibold text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />{' '}
                    {warranty.end_date ? format(new Date(warranty.end_date), 'MMM yyyy') : '—'}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <Badge
                    className={
                      warranty.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {warranty.active ? 'Active' : 'Expired'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Delete this warranty?')) deleteMutation.mutate(warranty.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New warranty</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Job *</Label>
              <Select
                value={form.job_id}
                onValueChange={(v) => setForm({ ...form, job_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.job_number || j.id.slice(0, 8)} — {j.customer_name || 'Untitled'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Customer name</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
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
            <div className="col-span-2 space-y-1">
              <Label>Property address</Label>
              <Input
                value={form.property_address}
                onChange={(e) => setForm({ ...form, property_address: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Type *</Label>
              <Select
                value={form.warranty_type}
                onValueChange={(v) => setForm({ ...form, warranty_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WARRANTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Manufacturer</Label>
              <Input
                value={form.manufacturer}
                onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Start date *</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Coverage (years) *</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={form.coverage_years}
                onChange={(e) => setForm({ ...form, coverage_years: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
            <DialogFooter className="col-span-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create warranty'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
