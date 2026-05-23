import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Phone, Mail, MessageSquare, Phone as CallIcon, Calendar } from 'lucide-react';

export default function ProjectManagerCard({ job }) {
  const pmName = job?.assigned_pm_name || 'Project Manager';
  const pmPhone = job?.assigned_pm_phone || '';
  const pmEmail = job?.assigned_pm_email || '';
  const pmInitial = pmName.charAt(0).toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          Your Project Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
            {pmInitial}
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="font-semibold text-lg">{pmName}</p>
            {pmPhone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Phone className="w-4 h-4" />
                <a href={`tel:${pmPhone}`} className="hover:text-primary">{pmPhone}</a>
              </div>
            )}
            {pmEmail && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${pmEmail}`} className="hover:text-primary">{pmEmail}</a>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" className="flex flex-col items-center justify-center h-auto py-3">
            <MessageSquare className="w-4 h-4 mb-1" />
            <span className="text-xs">Message</span>
          </Button>
          {pmPhone && (
            <Button size="sm" variant="outline" className="flex flex-col items-center justify-center h-auto py-3">
              <CallIcon className="w-4 h-4 mb-1" />
              <span className="text-xs">Call</span>
            </Button>
          )}
          <Button size="sm" variant="outline" className="flex flex-col items-center justify-center h-auto py-3">
            <Calendar className="w-4 h-4 mb-1" />
            <span className="text-xs">Schedule</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}