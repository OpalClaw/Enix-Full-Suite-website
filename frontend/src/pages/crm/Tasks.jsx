import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function Tasks() {
  const [statusFilter, setStatusFilter] = useState('not_started');
  const [taskUpdates, setTaskUpdates] = useState({});
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ taskId, updates }) => base44.entities.Task.update(taskId, updates),
    onSuccess: (_, { taskId }) => {
      setTaskUpdates(prev => {
        const updated = { ...prev };
        delete updated[taskId];
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task saved');
    },
  });

  const handleTaskUpdate = (taskId, field, value) => {
    setTaskUpdates(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [field]: value }
    }));
  };

  const saveTask = (taskId) => {
    if (taskUpdates[taskId]) {
      updateMutation.mutate({ taskId, updates: taskUpdates[taskId] });
    }
  };

  const filtered = statusFilter === 'all' ? tasks : tasks.filter(t => t.status === statusFilter);
  const overdue = tasks.filter(t => t.status === 'overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Tasks</h1>
          <p className="text-muted-foreground">Team action items and follow-ups</p>
        </div>
        <Button className="bg-navy-600 hover:bg-navy-700">
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      {overdue > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-red-700">{overdue} overdue task{overdue !== 1 ? 's' : ''}</span>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 flex-wrap">
        {['all', 'not_started', 'in_progress', 'completed'].map(s => (
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
         {filtered.map(task => {
           const hasChanges = !!taskUpdates[task.id];
           return (
             <Card key={task.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
               <CardContent className="p-4">
                 <div className="flex items-start gap-4">
                   <Checkbox 
                     className="mt-1"
                     checked={taskUpdates[task.id]?.status === 'completed' || task.status === 'completed'}
                     onCheckedChange={(checked) => handleTaskUpdate(task.id, 'status', checked ? 'completed' : 'not_started')}
                   />
                   <div className="flex-1 min-w-0">
                     <h3 className="font-semibold">{task.title}</h3>
                     {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                     <div className="flex gap-2 mt-2 flex-wrap">
                       {task.due_date && (
                         <Badge variant="outline" className="text-xs flex items-center gap-1">
                           <Calendar className="w-3 h-3" /> {format(new Date(task.due_date), 'MMM d')}
                         </Badge>
                       )}
                       <Badge className={`text-xs ${priorityColors[task.priority] || ''}`}>
                         {task.priority}
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
                     <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(task.id)}>
                       <Trash2 className="w-3 h-3" />
                     </Button>
                   </div>
                 </div>
               </CardContent>
             </Card>
           );
         })}
       </div>
    </div>
  );
}