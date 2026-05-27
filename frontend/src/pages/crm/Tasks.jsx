import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Plus, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-700',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  due_date: '',
  priority: 'medium',
  status: 'not_started',
  assignee_id: '',
  job_id: '',
};

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState('not_started');
  const [taskUpdates, setTaskUpdates] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
    onError: (e) => toast.error(e?.message || 'Failed to delete task'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, updates }) => base44.entities.Task.update(taskId, updates),
    onSuccess: (_, { taskId }) => {
      setTaskUpdates((prev) => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task saved');
    },
    onError: (e) => toast.error(e?.message || 'Failed to save task'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created');
      setForm(EMPTY_FORM);
      setDialogOpen(false);
    },
    onError: (e) => toast.error(e?.message || 'Failed to create task'),
  });

  const handleTaskUpdate = (taskId, field, value) => {
    setTaskUpdates((prev) => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value },
    }));
  };

  const saveTask = (taskId) => {
    if (taskUpdates[taskId]) {
      updateMutation.mutate({ taskId, updates: taskUpdates[taskId] });
    }
  };

  const submitCreate = (e) => {
    e?.preventDefault?.();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
      priority: form.priority,
      status: form.status,
      assignee_id: form.assignee_id || undefined,
      job_id: form.job_id || undefined,
    };
    createMutation.mutate(payload);
  };

  const filtered = statusFilter === 'all' ? tasks : tasks.filter((t) => t.status === statusFilter);
  const overdue = tasks.filter((t) => t.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Tasks</h1>
          <p className="text-muted-foreground">Team action items and follow-ups</p>
        </div>
        <Button className="bg-navy-600 hover:bg-navy-700" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      {overdue > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-700">
              {overdue} overdue task{overdue !== 1 ? 's' : ''}
            </span>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all', ...STATUSES].map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading tasks…</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No tasks match this filter.</p>
        )}
        {filtered.map((task) => {
          const hasChanges = !!taskUpdates[task.id];
          const completed = taskUpdates[task.id]?.status === 'completed' || task.status === 'completed';
          return (
            <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Checkbox
                    className="mt-1"
                    checked={completed}
                    onCheckedChange={(checked) =>
                      handleTaskUpdate(task.id, 'status', checked ? 'completed' : 'not_started')
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold ${completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {task.due_date && (
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(task.due_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                      {task.priority && (
                        <Badge className={`text-xs ${priorityColors[task.priority] || ''}`}>
                          {task.priority}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {(task.status || 'not_started').replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {hasChanges && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => saveTask(task.id)}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Delete this task?')) deleteMutation.mutate(task.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Follow up with customer"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="task-due">Due date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
