import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DollarSign, Calendar, AlertCircle, Send, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  partially_paid: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

export default function Invoices() {
  usePageTitle('Invoices');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sendData, setSendData] = useState({ email: '', message: '' });
  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 100),
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: sendData.email,
        subject: `Invoice ${selectedInvoice.invoice_number}`,
        body: `${sendData.message}\n\nInvoice Total: $${selectedInvoice.total?.toLocaleString()}\nDue Date: ${selectedInvoice.due_date}\n\nThank you for your business!`,
      });
      
      await base44.entities.Invoice.update(selectedInvoice.id, { status: 'sent' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSendOpen(false);
      setSendData({ email: '', message: '' });
      setSelectedInvoice(null);
    },
    onError: (error) => {
      toast({ title: 'Failed to send invoice', description: error?.message || 'Unknown error', variant: 'destructive' });
    },
  });

  const handleSendClick = (invoice) => {
    setSelectedInvoice(invoice);
    setSendData({ email: invoice.customer_email || '', message: `Please find your invoice attached. Payment is due on ${invoice.due_date}.` });
    setSendOpen(true);
  };

  const filtered = statusFilter === 'all' ? invoices : invoices.filter(i => i.status === statusFilter);

  const totalOutstanding = filtered.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total - (i.paid_amount || 0)), 0);
  const totalPaid = filtered.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Invoices</h1>
          <p className="text-muted-foreground">Manage payments and billing</p>
        </div>
        <Dialog open={sendOpen && selectedInvoice} onOpenChange={(open) => {
          if (!open) {
            setSendOpen(false);
            setSelectedInvoice(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Invoice {selectedInvoice?.invoice_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient Email</label>
                <Input
                  type="email"
                  value={sendData.email}
                  onChange={(e) => setSendData({ ...sendData, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={sendData.message}
                  onChange={(e) => setSendData({ ...sendData, message: e.target.value })}
                  className="w-full p-2 border rounded-md text-sm min-h-20"
                />
              </div>
              <Button
                onClick={() => sendInvoiceMutation.mutate()}
                disabled={!sendData.email || sendInvoiceMutation.isPending}
                className="w-full bg-navy-600 hover:bg-navy-700"
              >
                {sendInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">${totalOutstanding.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue'].map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {s.replace(/_/g, ' ')}
          </Button>
        ))}
      </div>

      {/* Invoices List */}
      <div className="space-y-2">
        {filtered.map(invoice => {
          const balance = invoice.total - (invoice.paid_amount || 0);
          return (
            <Card key={invoice.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice #</p>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due Date</p>
                    <p className="font-semibold">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">${invoice.total.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={`font-semibold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      ${balance.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-end justify-between">
                    <Badge className={statusColors[invoice.status] || 'bg-gray-100'}>
                      {invoice.status?.replace(/_/g, ' ')}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleSendClick(invoice)}>
                      <Send className="w-3 h-3 mr-1" /> Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No invoices found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}