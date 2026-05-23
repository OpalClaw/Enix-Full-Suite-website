import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Download, Eye } from 'lucide-react';

export default function PortalInvoices() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: jobs = [] } = useQuery({
    queryKey: ['portal-invoices'],
    queryFn: async () => {
      if (!user?.email) return [];
      return base44.entities.Job.filter({ client_user_email: user.email });
    },
    enabled: !!user?.email,
  });

  const invoices = jobs.filter(j => j.invoice_amount).sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date));
  const totalDue = invoices.reduce((s, j) => s + ((j.invoice_amount || 0) - (j.paid_amount || 0)), 0);
  const totalPaid = invoices.reduce((s, j) => s + (j.paid_amount || 0), 0);

  return (
    <div>
      <h1 className="font-heading font-bold text-2xl mb-4">Invoices & Payments</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 border-0 shadow-sm"><div><p className="text-xs text-muted-foreground">Total Paid</p><p className="text-2xl font-heading font-bold text-green-600">${totalPaid.toLocaleString()}</p></div></Card>
        <Card className="p-4 border-0 shadow-sm"><div><p className="text-xs text-muted-foreground">Amount Due</p><p className="text-2xl font-heading font-bold text-orange-600">${totalDue.toLocaleString()}</p></div></Card>
      </div>

      <div className="grid gap-3">
        {invoices.length > 0 ? invoices.map(inv => {
          const amountDue = (inv.invoice_amount || 0) - (inv.paid_amount || 0);
          return (
            <Card key={inv.id} className="p-4 border-0 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{inv.service_type?.replace(/_/g, ' ')}</h3>
                  <p className="text-sm text-muted-foreground">{inv.property_address}</p>
                  <p className="text-lg font-heading font-bold text-navy-500 mt-2">${inv.invoice_amount?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={amountDue > 0 ? 'destructive' : 'default'}>{amountDue > 0 ? `$${amountDue.toLocaleString()} due` : 'Paid'}</Badge>
                  <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          );
        }) : (
          <Card className="p-12 text-center border-0 shadow-sm">
            <DollarSign className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          </Card>
        )}
      </div>
    </div>
  );
}