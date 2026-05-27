import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
} from 'date-fns';
import { toast } from 'sonner';

const TYPE_COLORS = {
  inspection: 'bg-blue-100 text-blue-700',
  estimate: 'bg-purple-100 text-purple-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  production: 'bg-orange-100 text-orange-700',
  final_inspection: 'bg-green-100 text-green-700',
  meeting: 'bg-indigo-100 text-indigo-700',
  consultation: 'bg-cyan-100 text-cyan-700',
};

const APPT_TYPES = [
  'inspection',
  'estimate',
  'follow_up',
  'production',
  'final_inspection',
  'meeting',
  'consultation',
];

const EMPTY = {
  title: '',
  appointment_type: 'inspection',
  date: '',
  time: '09:00',
  duration_minutes: 60,
  customer_name: '',
  customer_phone: '',
  address: '',
  job_id: '',
  notes: '',
};

function combineToISO(dateStr, timeStr) {
  if (!dateStr) return null;
  const t = timeStr || '00:00';
  return new Date(`${dateStr}T${t}:00`).toISOString();
}

export default function CRMCalendar() {
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('scheduled_at', 500),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', 'for-appts'],
    queryFn: () => base44.entities.Job.list('-created_at', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Appointment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment scheduled');
      setForm(EMPTY);
      setOpen(false);
    },
    onError: (e) => toast.error(e?.message || 'Failed to schedule'),
  });

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const appointmentsByDay = useMemo(() => {
    const map = new Map();
    for (const a of appointments) {
      if (!a.scheduled_at) continue;
      const key = format(new Date(a.scheduled_at), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    }
    return map;
  }, [appointments]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter((a) => a.scheduled_at && new Date(a.scheduled_at).getTime() >= now)
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
      .slice(0, 10);
  }, [appointments]);

  const submit = (e) => {
    e.preventDefault();
    if (!form.title || !form.date) {
      toast.error('Title and date are required');
      return;
    }
    const scheduled_at = combineToISO(form.date, form.time);
    if (!scheduled_at) {
      toast.error('Invalid date');
      return;
    }
    createMutation.mutate({
      title: form.title,
      appointment_type: form.appointment_type,
      scheduled_at,
      duration_minutes: Number(form.duration_minutes) || 60,
      customer_name: form.customer_name || undefined,
      customer_phone: form.customer_phone || undefined,
      address: form.address || undefined,
      job_id: form.job_id || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Calendar</h1>
          <p className="text-muted-foreground">Manage appointments and scheduling</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New appointment
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-2xl">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate((d) => addMonths(d, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate((d) => addMonths(d, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center font-semibold text-sm p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, i) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayAppts = appointmentsByDay.get(key) || [];
                  const isCurrent = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div
                      key={i}
                      className={`min-h-24 p-2 border rounded-lg ${
                        isToday
                          ? 'bg-navy-50 border-navy-300'
                          : isCurrent
                          ? 'bg-white'
                          : 'bg-muted/30'
                      } ${!isCurrent ? 'opacity-50' : ''}`}
                    >
                      <p
                        className={`text-sm font-semibold mb-1 ${
                          isToday ? 'text-navy-700' : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </p>
                      <div className="space-y-1">
                        {dayAppts.slice(0, 2).map((apt) => (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${
                              TYPE_COLORS[apt.appointment_type] || 'bg-gray-100'
                            }`}
                            title={`${apt.title} at ${format(new Date(apt.scheduled_at), 'h:mm a')}`}
                          >
                            {apt.title}
                          </div>
                        ))}
                        {dayAppts.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{dayAppts.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {upcoming.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
              )}
              {upcoming.map((apt) => (
                <div
                  key={apt.id}
                  className="p-2 border rounded hover:bg-muted/50 cursor-pointer"
                >
                  <p className="text-sm font-semibold">{apt.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(apt.scheduled_at), 'MMM d, yyyy · h:mm a')}
                  </p>
                  {apt.appointment_type && (
                    <Badge
                      className={`text-xs mt-1 ${
                        TYPE_COLORS[apt.appointment_type] || 'bg-gray-100'
                      }`}
                    >
                      {apt.appointment_type.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New appointment</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={form.appointment_type}
                onValueChange={(v) => setForm({ ...form, appointment_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min="15"
                step="15"
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Customer name</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Customer phone</Label>
              <Input
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Link to job</Label>
              <Select
                value={form.job_id}
                onValueChange={(v) => setForm({ ...form, job_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="(optional)" />
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
                {createMutation.isPending ? 'Scheduling…' : 'Schedule'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
