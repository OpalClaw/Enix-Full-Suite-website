import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock } from 'lucide-react';

const PROJECT_STAGES = [
  { id: 'inspection', label: 'Inspection Scheduled', icon: Clock },
  { id: 'estimate', label: 'Estimate Sent', icon: Clock },
  { id: 'contract', label: 'Contract Signed', icon: CheckCircle2 },
  { id: 'materials', label: 'Materials Ordered', icon: Clock },
  { id: 'scheduled', label: 'Scheduled', icon: Clock },
  { id: 'production', label: 'In Production', icon: Clock },
  { id: 'final', label: 'Final Inspection', icon: Clock },
  { id: 'invoice', label: 'Invoice Sent', icon: Clock },
  { id: 'warranty', label: 'Warranty Issued', icon: CheckCircle2 },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
];

export default function ProjectStatusCard({ job }) {
  const currentStageIndex = PROJECT_STAGES.findIndex(stage => stage.id === job?.status?.toLowerCase().replace(/\s+/g, ''));
  const progressPercentage = Math.max(0, ((currentStageIndex + 1) / PROJECT_STAGES.length) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Project Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Progress */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Current Stage */}
        <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
          <p className="text-xs text-muted-foreground mb-1">Current Stage</p>
          <p className="text-lg font-bold text-foreground">{job?.status || 'Pending'}</p>
        </div>

        {/* Milestones */}
        <div>
          <h4 className="font-semibold text-sm mb-3">Upcoming Milestones</h4>
          <div className="space-y-2">
            {job?.next_milestone && (
              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{job.next_milestone}</p>
                  <p className="text-xs text-muted-foreground">{new Date(job.next_milestone_date).toLocaleDateString()}</p>
                </div>
              </div>
            )}
            {!job?.next_milestone && (
              <p className="text-sm text-muted-foreground">No upcoming milestones</p>
            )}
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-xs text-muted-foreground">Last CRM Update</span>
          <span className="text-xs font-medium">
            {job?.updated_date ? new Date(job.updated_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}