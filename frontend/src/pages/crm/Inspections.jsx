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
import { Plus, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const SERVICE_TYPES = ['roofing', 'siding', 'windows', 'doors', 'gutters', 'storm_damage', 'exterior'];
const PROPERTY_TYPES = ['residential', 'commercial'];
const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];

const EMPTY = {
  lead_id: '',
  job_id: '',
  customer_name: '',
  property_address: '',
  property_type: 'residential',
  service_type: 'roofing',
  inspection_type: 'roofing',
  inspection_date: '',
  inspector_id: '',
  status: 'scheduled',
  recommended_scope: '',
  notes: '',
};

export default function Inspections() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: inspections = [], isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => base44.entities.Inspection.list('-inspection_date', 100),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_at', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Inspection.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspection scheduled');
      setForm(EMPTY);
      setOpen(false);
    },
    onError: (e) => toast.error(e?.message || 'Failed to create inspection'),
  });

  const eagleViewMutation = useMutation({
    mutationFn: (inspectionId) =>
      base44.functions.invoke('fetchEagleViewReport', { inspectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('EagleView report requested');
    },
    onError: (e) =>
      toast.error(
        e?.message ||
          'EagleView not configured — add credentials in Settings → Integrations',
      ),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!form.customer_name || !form.property_address || !form.inspection_date) {
      toast.error('Customer, address, and date are required');
      return;
    }
    createMutation.mutate({
      ...form,
      lead_id: form.lead_id || undefined,
      job_id: form.job_id || undefined,
      inspection_date: new Date(form.inspection_date).toISOString(),
    });
  };

  const completed = inspections.filter((i) => i.status === 'completed').length;
  const pending = inspections.filter((i) => i.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Inspections</h1>
          <p className="text-muted-foreground">Property assessments and reports</p>
        </div>
        <Button className="bg-navy-600 hover:bg-navy-700" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Inspection
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Inspections</p>
            <p className="text-2xl font-bold">{inspections.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-orange-600">{pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {isLoading && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading inspections…
          </p>
        )}
        {!isLoading && inspections.length === 0 && (
          <p className="text-sm text-muted-foreground">No inspections yet.</p>
        )}
        {inspections.map((inspection) => (
          <Card
            key={inspection.id}
            className="border-0 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{inspection.customer_name || '—'}</p>
                  {inspection.property_address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {inspection.property_address}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold text-sm capitalize">
                    {inspection.service_type?.replace(/_/g, ' ') || '—'}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {inspection.property_type || ''}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold text-sm">
                    {inspection.inspection_date
                      ? format(new Date(inspection.inspection_date), 'MMM d, yyyy')
                      : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    className={
                      inspection.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : inspection.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }
                  >
                    {inspection.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-end justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => eagleViewMutation.mutate(inspection.id)}
                    disabled={eagleViewMutation.isPending}
                  >
                    EagleView
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule inspection</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Lead (optional)</Label>
              <Select
                value={form.lead_id}
                onValueChange={(v) => setForm({ ...form, lead_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to a lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.first_name} {l.last_name} — {l.address || 'no address'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Customer *</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.inspection_date}
                onChange={(e) => setForm({ ...form, inspection_date: e.target.value })}
                required
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Property address *</Label>
              <Input
                value={form.property_address}
                onChange={(e) => setForm({ ...form, property_address: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Property type</Label>
              <Select
                value={form.property_type}
                onValueChange={(v) => setForm({ ...form, property_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Service</Label>
              <Select
                value={form.service_type}
                onValueChange={(v) => setForm({ ...form, service_type: v, inspection_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1" />
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
                {createMutation.isPending ? 'Scheduling…' : 'Schedule inspection'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
