import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const jobStatuses = [
  'lead',
  'estimate_sent',
  'approved',
  'material_ordered',
  'scheduled',
  'in_production',
  'final_inspection',
  'invoiced',
  'paid',
  'closed',
];

const statusColors = {
  lead: 'bg-red-50 border-red-200',
  estimate_sent: 'bg-orange-50 border-orange-200',
  approved: 'bg-blue-50 border-blue-200',
  material_ordered: 'bg-purple-50 border-purple-200',
  scheduled: 'bg-indigo-50 border-indigo-200',
  in_production: 'bg-orange-50 border-orange-200',
  final_inspection: 'bg-yellow-50 border-yellow-200',
  invoiced: 'bg-green-50 border-green-200',
  paid: 'bg-emerald-50 border-emerald-200',
  closed: 'bg-gray-50 border-gray-200',
};

const badgeColors = {
  lead: 'bg-red-100 text-red-800',
  estimate_sent: 'bg-orange-100 text-orange-800',
  approved: 'bg-blue-100 text-blue-800',
  material_ordered: 'bg-purple-100 text-purple-800',
  scheduled: 'bg-indigo-100 text-indigo-800',
  in_production: 'bg-orange-100 text-orange-800',
  final_inspection: 'bg-yellow-100 text-yellow-800',
  invoiced: 'bg-green-100 text-green-800',
  paid: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-800',
};

export default function JobBoard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data) => base44.entities.Job.update(data.jobId, { status: data.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const jobsByStatus = jobStatuses.reduce((acc, status) => {
    acc[status] = jobs.filter(job => job.status === status);
    return acc;
  }, {});

  const handleDragEnd = (result) => {
    const { draggableId, destination } = result;

    if (!destination) return;

    const newStatus = destination.droppableId;
    const jobId = draggableId;

    updateStatusMutation.mutate({ jobId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max p-4">
          {jobStatuses.map(status => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-80 rounded-lg border-2 p-4 transition-colors ${
                    snapshot.isDraggingOver
                      ? 'bg-primary/5 border-primary'
                      : statusColors[status]
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="font-semibold capitalize text-sm">
                      {status.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {jobsByStatus[status].length} job{jobsByStatus[status].length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {jobsByStatus[status].map((job, index) => (
                      <Draggable key={job.id} draggableId={job.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`rounded-md p-3 bg-white border cursor-grab active:cursor-grabbing transition-all ${
                              snapshot.isDragging ? 'shadow-lg ring-2 ring-primary' : 'shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{job.customer_name}</p>
                                  <p className="text-xs text-muted-foreground">#{job.job_number}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/crm/jobs/${job.id}`)}
                                  className="h-6 w-6 p-0"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>

                              {job.contract_amount && (
                                <p className="text-xs font-semibold text-green-700">
                                  ${job.contract_amount.toLocaleString()}
                                </p>
                              )}

                              {job.service_type && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${badgeColors[status]}`}
                                >
                                  {job.service_type}
                                </Badge>
                              )}

                              {job.start_date && (
                                <p className="text-xs text-muted-foreground">
                                  Start: {new Date(job.start_date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  </div>

                  {provided.placeholder}

                  {jobsByStatus[status].length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs text-muted-foreground">No jobs</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}