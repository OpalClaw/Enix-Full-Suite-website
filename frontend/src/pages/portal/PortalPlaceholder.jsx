import React from 'react';
import { Card } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export default function PortalPlaceholder({ title }) {
  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">{title}</h1>
      <Card className="border-0 shadow-sm p-12 text-center">
        <Construction className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-lg mb-2">Coming Soon</h3>
        <p className="text-sm text-muted-foreground">This feature is being built. Check back soon!</p>
      </Card>
    </div>
  );
}