import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PortalAppointments() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: appointments = [] } = useQuery({
    queryKey: ['portal-appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 20),
  });

  const userAppointments = appointments.filter(a => user && a.address?.includes(user.full_name?.split(' ')[0] || ''));
  const upcoming = userAppointments.filter(a => new Date(a.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">Appointments</h1>
      <div className="grid gap-3">
        {upcoming.length > 0 ? upcoming.map(apt => (
          <Card key={apt.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold">{apt.title}</h3>
                <div className="space-y-1 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {format(new Date(apt.date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  {apt.time && <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> {apt.time}</div>}
                  {apt.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {apt.address}</div>}
                </div>
                {apt.notes && <p className="text-sm mt-2 bg-muted/50 p-2 rounded">{apt.notes}</p>}
              </div>
              <Badge variant="outline">{apt.type}</Badge>
            </div>
          </Card>
        )) : (
          <Card className="p-12 text-center border-0 shadow-sm">
            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No upcoming appointments. We'll contact you soon!</p>
          </Card>
        )}
      </div>
    </div>
  );
}