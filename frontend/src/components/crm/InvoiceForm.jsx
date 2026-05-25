import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Send, Loader2 } from 'lucide-react';

export default function InvoiceForm({ jobId, trigger = 'Create Invoice', onSuccess }) {
  const [open, setOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formData, setFormData] = useState({
    invoice_number: `INV-${Date.now()}`,
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    line_items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
  });
  const [sendData, setSendData] = useState({
    email: '',
    message: 'Please find your invoice attached. Payment is due on the date specified.',
  });

  const queryClient = useQueryClient();

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => {
      const subtotal = data.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      return base44.entities.Invoice.create({
        ...data,
        job_id: jobId,
        subtotal,
        tax,
        total,
        status: 'draft',
        invoice_date: new Date().toISOString().split('T')[0],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      setOpen(false);
      setFormData({
        invoice_number: `INV-${Date.now()}`,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        line_items: [{ description: '', quantity: 1, unit_price: 0, total: 0 }],
      });
      onSuccess?.();
    },
  });

  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      await base44.integrations.Core.SendEmail({
        to: sendData.email,
        subject: `Invoice ${selectedInvoice.invoice_number}`,
        body: `${sendData.message}\n\nInvoice Total: $${selectedInvoice.total?.toLocaleString()}\n\nThank you for your business!`,
      });
    },
    onSuccess: () => {
      setSendOpen(false);
      setSendData({ email: '', message: 'Please find your invoice attached. Payment is due on the date specified.' });
      setSelectedInvoice(null);
    },
  });

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...formData.line_items];
    newItems[index][field] = field === 'description' ? value : parseFloat(value) || 0;
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = (newItems[index].quantity || 0) * (newItems[index].unit_price || 0);
    }

    setFormData({ ...formData, line_items: newItems });
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      line_items: [...formData.line_items, { description: '', quantity: 1, unit_price: 0, total: 0 }],
    });
  };

  const removeLineItem = (index) => {
    setFormData({
      ...formData,
      line_items: formData.line_items.filter((_, i) => i !== index),
    });
  };

  const subtotal = formData.line_items.reduce((sum, item) => sum + (item.total || 0), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" /> {trigger}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Invoice Number</label>
                <Input
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label className="text-sm font-medium mb-2 block">Line Items</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {formData.line_items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                      className="col-span-5"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                      className="col-span-2"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.unit_price}
                      onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                      className="col-span-2"
                    />
                    <span className="col-span-2 flex items-center text-sm font-medium">
                      ${(item.total || 0).toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(idx)}
                      className="col-span-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={addLineItem} className="mt-2">
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {/* Totals */}
            <div className="bg-muted p-4 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%):</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span className="text-lg">${total.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={() => createInvoiceMutation.mutate(formData)}
              disabled={createInvoiceMutation.isPending || formData.line_items.length === 0}
              className="w-full bg-navy-600 hover:bg-navy-700"
            >
              {createInvoiceMutation.isPending ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Invoice Dialog */}
      {selectedInvoice && (
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Invoice {selectedInvoice.invoice_number}</DialogTitle>
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
      )}

      {/* Expose send method to parent */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setSendOpen(true)}
        style={{ display: 'none' }}
        id="invoice-send-trigger"
      />
    </>
  );
}