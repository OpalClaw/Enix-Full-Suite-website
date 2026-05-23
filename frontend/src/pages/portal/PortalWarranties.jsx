import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function PortalWarranties() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ['portal-warranties'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Job.filter({ client_user_email: user.email });
    },
    enabled: !!user?.email,
  });

  const warranties = jobs.filter(j => j.warranty_type && j.warranty_expiry);

  const isExpiring = (expiry) => {
    const expiryDate = new Date(expiry);
    const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry < 365;
  };

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">Warranties</h1>
      <div className="grid gap-3">
        {warranties.length > 0 ? warranties.map(w => {
          const expiring = isExpiring(w.warranty_expiry);
          const expiryDate = new Date(w.warranty_expiry);
          const daysLeft = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
          return (
            <Card key={w.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                {expiring && <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />}
                {!expiring && <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
                <div className="flex-1">
                  <h3 className="font-semibold">{w.service_type?.replace(/_/g, ' ')}</h3>
                  <p className="text-sm text-muted-foreground">{w.warranty_type}</p>
                  <p className="text-sm font-medium mt-2">Expires: {format(expiryDate, 'MMMM d, yyyy')} ({daysLeft} days remaining)</p>
                </div>
                <Badge variant={expiring ? 'destructive' : 'outline'}>
                  {expiring ? 'Expiring' : 'Active'}
                </Badge>
              </div>
            </Card>
          );
        }) : (
          <Card className="p-12 text-center border-0 shadow-sm">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No active warranties</p>
          </Card>
        )}
      </div>
    </div>
  );
}