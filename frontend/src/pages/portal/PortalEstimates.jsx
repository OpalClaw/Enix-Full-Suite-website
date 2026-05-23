import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';

export default function PortalEstimates() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ['portal-estimates'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Job.filter({ client_user_email: user.email });
    },
    enabled: !!user?.email,
  });

  const estimates = jobs.filter(j => j.estimate_amount).sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">Estimates & Proposals</h1>
      <div className="grid gap-3">
        {estimates.length > 0 ? estimates.map(est => (
          <Card key={est.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{est.service_type?.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-muted-foreground">{est.property_address}</p>
                <p className="text-lg font-heading font-bold text-navy-500 mt-2">${est.estimate_amount?.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{est.status?.replace(/_/g, ' ')}</Badge>
                <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
              </div>
            </div>
          </Card>
        )) : (
          <Card className="p-12 text-center border-0 shadow-sm">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No estimates yet. Contact us for a free quote!</p>
          </Card>
        )}
      </div>
    </div>
  );
}