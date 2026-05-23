import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import DOMPurify from 'dompurify';

export default function JobInvoiceBuilder({ job, estimates }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState('');
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    status: 'draft',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices', job.id],
    queryFn: () => base44.entities.Invoice.filter({ job_id: job.id }),
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data) => {
      const estimate = estimates.find((e) => e.id === selectedEstimate);
      const invoiceData = {
        ...data,
        job_id: job.id,
        customer_name: job.customer_name,
        customer_email: job.customer_email,
        property_address: job.property_address,
        estimate_id: selectedEstimate,
        total: estimate?.total || 0,
        paid_amount: 0,
      };
      await base44.entities.Invoice.create(invoiceData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices', job.id] });
      setShowForm(false);
      setFormData({ invoice_number: '', invoice_date: new Date().toISOString().split('T')[0], due_date: '', status: 'draft', notes: '' });
      setSelectedEstimate('');
    },
  });

  const handleCreate = () => {
    if (!formData.invoice_number || !selectedEstimate) return;
    createInvoiceMutation.mutate(formData);
  };

  const downloadInvoice = async (invoice) => {
    const estimate = estimates.find((e) => e.id === invoice.estimate_id);
    const element = document.createElement('div');
    const rawMarkup = `
      <div style="padding: 40px; max-width: 900px; font-family: Arial, sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px;">
          <div>
            <h1 style="margin: 0; font-size: 24px;">INVOICE</h1>
            <p style="margin: 5px 0; color: #666;">Invoice #${invoice.invoice_number}</p>
          </div>
          <div style="text-align: right; padding: 20px; background: #f0f0f0; border-radius: 8px;">
            <p style="margin: 5px 0; font-weight: bold;">${job.customer_name}</p>
            <p style="margin: 5px 0; font-size: 12px;">${job.property_address}</p>
            <p style="margin: 5px 0; font-size: 12px;">${job.city}, ${job.state} ${job.zip}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <p style="margin: 0 0 5px 0; font-weight: bold;">FROM:</p>
            <p style="margin: 0; font-weight: bold;">Enix Exteriors</p>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Contact for details</p>
          </div>
          <div>
            <p style="margin: 0 0 5px 0; font-weight: bold;">BILL TO:</p>
            <p style="margin: 0; font-weight: bold;">${job.customer_name}</p>
            <p style="margin: 5px 0; font-size: 12px;">${job.customer_email}</p>
            <p style="margin: 5px 0; font-size: 12px;">${job.customer_phone}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 40px;">
          <div>
            <p style="margin: 0; font-size: 12px; color: #666;">Invoice Date</p>
            <p style="margin: 5px 0; font-weight: bold;">${new Date(invoice.invoice_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 12px; color: #666;">Due Date</p>
            <p style="margin: 5px 0; font-weight: bold;">${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>
          <div>
            <p style="margin: 0; font-size: 12px; color: #666;">Job #</p>
            <p style="margin: 5px 0; font-weight: bold;">${job.job_number}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
          <thead>
            <tr style="background: #f0f0f0;">
              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qty</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Unit Price</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${estimate?.line_items?.map(item => `
              <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${item.description}</td>
                <td style="padding: 10px; text-align: center; border: 1px solid #ddd;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${parseFloat(item.unit_price).toFixed(2)}</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">$${parseFloat(item.total).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #333;">
              <p style="margin: 0; font-weight: bold;">TOTAL DUE:</p>
              <p style="margin: 0; font-weight: bold; font-size: 18px;">$${parseFloat(invoice.total).toFixed(2)}</p>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
          <div style="border-top: 1px solid #ddd; padding-top: 20px;">
            <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 12px;">NOTES:</p>
            <p style="margin: 0; font-size: 12px; color: #666;">${invoice.notes}</p>
          </div>
        ` : ''}
      </div>
    `;

    element.innerHTML = DOMPurify.sanitize(rawMarkup);
    document.body.appendChild(element);
    const canvas = await html2canvas(element);
    document.body.removeChild(element);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
    pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
  };

  return (
    <div className="space-y-4">
      <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowForm(true)}>
        <Plus className="w-4 h-4 mr-2" /> Create Invoice
      </Button>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Invoice from Estimate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold block mb-2">Select Estimate *</label>
              <Select value={selectedEstimate} onValueChange={setSelectedEstimate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose estimate" />
                </SelectTrigger>
                <SelectContent>
                  {estimates.map(est => (
                    <SelectItem key={est.id} value={est.id}>
                      Estimate #{est.estimate_number} - ${est.total?.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2">Invoice Number *</label>
              <Input
                value={formData.invoice_number}
                onChange={(e) => setFormData({...formData, invoice_number: e.target.value})}
                placeholder="INV-001"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2">Invoice Date</label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({...formData, invoice_date: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2">Due Date</label>
              <Input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-2">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Add payment terms, thank you message, etc."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={createInvoiceMutation.isPending} className="flex-1">
                {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
            </div>
            </DialogContent>
            </Dialog>

      {invoices.map(invoice => (
        <Card key={invoice.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-semibold">Invoice #{invoice.invoice_number}</p>
                <p className="text-xs text-muted-foreground">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => downloadInvoice(invoice)}>
                <Download className="w-4 h-4 mr-1" /> Download
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-bold">${parseFloat(invoice.total).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid</p>
                <p className="font-bold">${parseFloat(invoice.paid_amount || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {invoices.length === 0 && <p className="text-muted-foreground text-center py-8">No invoices yet</p>}
    </div>
  );
}