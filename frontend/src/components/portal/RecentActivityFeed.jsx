import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Upload, FileText, DollarSign, CheckCircle2, Camera } from 'lucide-react';
import { format } from 'date-fns';

const activityIcons = {
  message: MessageSquare,
  document: FileText,
  photo: Camera,
  invoice: DollarSign,
  update: CheckCircle2,
  file: Upload,
};

export default function RecentActivityFeed({ job }) {
  const activities = [
    {
      id: 1,
      type: 'update',
      title: 'Project Status Updated',
      description: 'Your project has moved to "In Production"',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      user: 'John Manager',
    },
    {
      id: 2,
      type: 'document',
      title: 'New Document Available',
      description: 'Contract ready for signature',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      user: 'Office Staff',
    },
    {
      id: 3,
      type: 'photo',
      title: 'Progress Photos Uploaded',
      description: '12 new photos from Day 5 of work',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      user: 'Project Team',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => {
            const Icon = activityIcons[activity.type] || FileText;
            return (
              <div key={activity.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>{activity.user}</span>
                    <span>{format(activity.timestamp, 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}