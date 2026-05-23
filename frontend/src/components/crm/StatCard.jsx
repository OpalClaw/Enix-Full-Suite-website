import React from 'react';
import { Card } from '@/components/ui/card';

export default function StatCard({ title, value, icon: Icon, trend, color = "text-navy-500" }) {
  return (
    <Card className="p-5 border-0 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          {trend && <p className="text-xs text-green-600 font-medium mt-1">{trend}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg bg-navy-500/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </Card>
  );
}