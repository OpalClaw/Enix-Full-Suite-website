import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

const appointmentTypeColors = {
  inspection: 'bg-blue-100 text-blue-700',
  estimate: 'bg-purple-100 text-purple-700',
  follow_up: 'bg-yellow-100 text-yellow-700',
  production: 'bg-orange-100 text-orange-700',
  final_inspection: 'bg-green-100 text-green-700',
  meeting: 'bg-indigo-100 text-indigo-700',
};

export default function CRMCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => base44.entities.Appointment.list('-date', 200),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getAppointmentsForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return appointments.filter(a => a.date === dayStr);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl">Calendar</h1>
        <p className="text-muted-foreground">Manage appointments and scheduling</p>
      </div>

      {/* Calendar Header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-2xl">{format(currentDate, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center font-semibold text-sm p-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, i) => {
                  const dayAppointments = getAppointmentsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={i}
                      className={`min-h-24 p-2 border rounded-lg ${
                        isToday ? 'bg-navy-50 border-navy-300' : isCurrentMonth ? 'bg-white' : 'bg-muted/30'
                      } ${!isCurrentMonth ? 'opacity-50' : ''}`}
                    >
                      <p className={`text-sm font-semibold mb-1 ${isToday ? 'text-navy-700' : ''}`}>
                        {format(day, 'd')}
                      </p>
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 2).map(apt => (
                          <div
                            key={apt.id}
                            className={`text-xs p-1 rounded truncate cursor-pointer ${appointmentTypeColors[apt.type] || 'bg-gray-100'}`}
                            title={`${apt.title} at ${apt.time}`}
                          >
                            {apt.title}
                          </div>
                        ))}
                        {dayAppointments.length > 2 && (
                          <p className="text-xs text-muted-foreground">+{dayAppointments.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Appointments */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Upcoming</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {appointments
                .filter(a => a.date >= format(new Date(), 'yyyy-MM-dd'))
                .sort((a, b) => new Date(`${a.date} ${a.time || '00:00'}`) - new Date(`${b.date} ${b.time || '00:00'}`))
                .slice(0, 10)
                .map(apt => (
                  <div key={apt.id} className="p-2 border rounded hover:bg-muted/50 cursor-pointer">
                    <p className="text-sm font-semibold">{apt.title}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(apt.date), 'MMM d, yyyy')}</p>
                    {apt.time && <p className="text-xs text-muted-foreground">{apt.time}</p>}
                    <Badge className={`text-xs mt-1 ${appointmentTypeColors[apt.type] || 'bg-gray-100'}`}>
                      {apt.type?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}