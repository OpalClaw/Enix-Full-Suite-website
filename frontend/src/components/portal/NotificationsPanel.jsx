import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, FileText, DollarSign } from 'lucide-react';

export default function NotificationsPanel({ messages = [], invoices = [] }) {
  const unreadMessages = messages.filter(m => !m.read).length;
  const overdueInvoices = invoices.filter(inv => inv.status === 'overdue').length;
  const pendingDocuments = invoices.filter(inv => inv.status === 'sent' || inv.status === 'viewed').length;

  const notifications = [
    { 
      id: 1, 
      icon: MessageSquare, 
      label: 'Unread Messages', 
      count: unreadMessages, 
      color: 'blue' 
    },
    { 
      id: 2, 
      icon: FileText, 
      label: 'Documents Pending', 
      count: pendingDocuments, 
      color: 'purple' 
    },
    { 
      id: 3, 
      icon: DollarSign, 
      label: 'Overdue Invoices', 
      count: overdueInvoices, 
      color: 'red' 
    },
  ];

  const colorMap = {
    blue: 'bg-blue-500/20 text-blue-700 border-blue-200',
    purple: 'bg-purple-500/20 text-purple-700 border-purple-200',
    red: 'bg-red-500/20 text-red-700 border-red-200',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map(notif => {
          const Icon = notif.icon;
          return (
            <div
              key={notif.id}
              className={`p-4 rounded-lg border flex items-center justify-between ${colorMap[notif.color]}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{notif.label}</span>
              </div>
              <Badge variant="secondary" className="text-lg font-bold">
                {notif.count}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}