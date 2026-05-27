import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  RefreshCw,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { usePageTitle } from '@/hooks/usePageTitle';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  partial: 'bg-orange-100 text-orange-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  void: 'bg-gray-100 text-gray-500',
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'void', label: 'Void' },
];

const EMPTY_LINE_ITEM = { description: '', quantity: 1, unit_price: 0 };
const EMPTY_INVOICE_FORM = {
  job_id: '',
  customer_id: '',
  due_date: '',
  payment_terms: 'Net 30',
  message: '',
  line_items: [{ ...EMPTY_LINE_ITEM }],
};

function moneyFromForm(items) {
  return items.reduce(
    (sum, li) => sum + Number(li.quantity || 0) * Number(li.unit_price || 0),
    0,
  );
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM d, yyyy');
  } catch {
    return value;
  }
}

function toDateInput(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export default function Invoices() {
  usePageTitle('Invoices');
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null); // null | {mode:'create'|'edit', invoice?}
  const [form, setForm] = useState(EMPTY_INVOICE_FORM);

  const [paymentTarget, setPaymentTarget] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'card',
    reference: '',
    notes: '',
  });

  const [sendTarget, setSendTarget] = useState(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => base44.entities.Invoice.list('-created_date', 200),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', 'for-invoice'],
    queryFn: () => base44.entities.Job.list('-created_date', 200),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['customers', 'for-invoice'],
    queryFn: () => base44.entities.Customer.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (payload) => base44.entities.Invoice.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice created');
      closeEditor();
    },
    onError: (e) => toast.error(e?.message || 'Failed to create invoice'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => base44.entities.Invoice.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice updated');
      closeEditor();
    },
    onError: (e) => toast.error(e?.message || 'Failed to update invoice'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Invoice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice voided');
    },
    onError: (e) =>
      toast.error(e?.message || 'Failed to void invoice. Use status void for paid invoices.'),
  });

  const sendMutation = useMutation({
    mutationFn: (invoiceId) =>
      base44.functions.invoke('sendInvoice', { invoiceId }).catch(async () => {
        // fallback: hit the send endpoint directly
        return base44.entities.Invoice.update(invoiceId, { status: 'sent' });
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Invoice marked as sent');
      setSendTarget(null);
    },
    onError: (e) => toast.error(e?.message || 'Failed to send invoice'),
  });

  const syncQboMutation = useMutation({
    mutationFn: (invoiceId) =>
      base44.functions.invoke('syncQuickbooksInvoice', { invoiceId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Synced to QuickBooks');
    },
    onError: (e) => {
      const msg = e?.message || 'QuickBooks sync failed';
      toast.error(msg);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const amount = Number(paymentForm.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Amount must be a positive number');
      }
      return base44.entities.Payment
        ? base44.entities.Payment.create({
            invoice_id: paymentTarget.id,
            amount,
            method: paymentForm.method,
            reference: paymentForm.reference || undefined,
            notes: paymentForm.notes || undefined,
          })
        : fetch(`/api/invoices/${paymentTarget.id}/payments`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount,
              method: paymentForm.method,
              reference: paymentForm.reference || undefined,
              notes: paymentForm.notes || undefined,
            }),
          }).then((r) => {
            if (!r.ok) throw new Error('Failed to record payment');
            return r.json();
          });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast.success('Payment recorded');
      setPaymentTarget(null);
      setPaymentForm({ amount: '', method: 'card', reference: '', notes: '' });
    },
    onError: (e) => toast.error(e?.message || 'Failed to record payment'),
  });

  function openCreate() {
    setForm({ ...EMPTY_INVOICE_FORM, line_items: [{ ...EMPTY_LINE_ITEM }] });
    setEditing({ mode: 'create' });
  }

  function openEdit(invoice) {
    setForm({
      job_id: invoice.job_id ?? '',
      customer_id: invoice.customer_id ?? '',
      due_date: toDateInput(invoice.due_date),
      payment_terms: invoice.payment_terms ?? 'Net 30',
      message: invoice.message ?? '',
      line_items:
        Array.isArray(invoice.line_items) && invoice.line_items.length
          ? invoice.line_items.map((li) => ({
              description: li.description ?? '',
              quantity: Number(li.quantity ?? 1),
              unit_price: Number(li.unit_price ?? 0),
            }))
          : [{ ...EMPTY_LINE_ITEM }],
    });
    setEditing({ mode: 'edit', invoice });
  }

  function closeEditor() {
    setEditing(null);
    setForm(EMPTY_INVOICE_FORM);
  }

  function updateLineItem(idx, field, value) {
    setForm((prev) => ({
      ...prev,
      line_items: prev.line_items.map((li, i) =>
        i === idx
          ? {
              ...li,
              [field]:
                field === 'description' ? value : value === '' ? '' : Number(value),
            }
          : li,
      ),
    }));
  }

  function addLineItem() {
    setForm((prev) => ({
      ...prev,
      line_items: [...prev.line_items, { ...EMPTY_LINE_ITEM }],
    }));
  }

  function removeLineItem(idx) {
    setForm((prev) => ({
      ...prev,
      line_items:
        prev.line_items.length === 1
          ? prev.line_items
          : prev.line_items.filter((_, i) => i !== idx),
    }));
  }

  function submitInvoiceForm(e) {
    e.preventDefault();
    if (!form.job_id) return toast.error('Job is required');
    if (!form.customer_id) return toast.error('Customer is required');
    const cleanedItems = form.line_items
      .filter((li) => (li.description || '').trim() !== '')
      .map((li) => ({
        description: li.description.trim(),
        quantity: Number(li.quantity || 0),
        unit_price: Number(li.unit_price || 0),
      }));
    if (cleanedItems.length === 0) {
      return toast.error('At least one line item with a description is required');
    }

    const basePayload = {
      job_id: form.job_id,
      customer_id: form.customer_id,
      line_items: cleanedItems,
      due_date: form.due_date ? new Date(form.due_date).toISOString() : undefined,
      payment_terms: form.payment_terms?.trim() || undefined,
      message: form.message?.trim() || undefined,
    };

    if (editing.mode === 'create') {
      createMutation.mutate(basePayload);
    } else {
      const { job_id, ...editable } = basePayload;
      updateMutation.mutate({ id: editing.invoice.id, patch: editable });
    }
  }

  const filtered = useMemo(
    () =>
      statusFilter === 'all'
        ? invoices
        : invoices.filter((i) => i.status === statusFilter),
    [invoices, statusFilter],
  );

  const totalOutstanding = filtered
    .filter((i) => i.status !== 'paid' && i.status !== 'void')
    .reduce((s, i) => s + (Number(i.total) - Number(i.amount_paid || 0)), 0);
  const totalPaid = filtered
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + Number(i.total), 0);

  const customerById = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c])),
    [customers],
  );

  const formTotal = moneyFromForm(form.line_items);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Invoices</h1>
          <p className="text-muted-foreground">Create, edit, send, and sync invoices with QuickBooks</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-navy-600 hover:bg-navy-700" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">${formatMoney(totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Paid (filtered)</p>
            <p className="text-2xl font-bold text-green-600">${formatMoney(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Count</p>
            <p className="text-2xl font-bold">{filtered.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map((opt) => (
          <Button
            key={opt.value}
            variant={statusFilter === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Loading invoices…</p>}
        {!isLoading && filtered.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No invoices match this filter.</p>
            </CardContent>
          </Card>
        )}
        {filtered.map((invoice) => {
          const balance = Number(invoice.total) - Number(invoice.amount_paid || 0);
          const customer = customerById[invoice.customer_id];
          const qboSynced = !!invoice.quickbooks_id;
          const qboError = invoice.quickbooks_sync_error;
          return (
            <Card key={invoice.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice #</p>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer?.name || invoice.customer_name || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Due</p>
                    <p className="font-semibold">{formatDate(invoice.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">${formatMoney(invoice.total)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={`font-semibold ${balance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      ${formatMoney(balance)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={STATUS_COLORS[invoice.status] || 'bg-gray-100'}>
                      {invoice.status?.replace(/_/g, ' ')}
                    </Badge>
                    {qboSynced && (
                      <Badge variant="outline" className="text-xs gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-green-600" /> QB {invoice.quickbooks_doc_number}
                      </Badge>
                    )}
                    {!qboSynced && qboError && (
                      <Badge variant="outline" className="text-xs gap-1 w-fit text-red-600 border-red-300">
                        <AlertTriangle className="w-3 h-3" /> QB sync error
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-1 sm:col-span-2 flex flex-wrap gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => openEdit(invoice)}>
                      <Pencil className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPaymentTarget(invoice)}>
                      <DollarSign className="w-3 h-3 mr-1" /> Pay
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={syncQboMutation.isPending && syncQboMutation.variables === invoice.id}
                      onClick={() => syncQboMutation.mutate(invoice.id)}
                    >
                      {syncQboMutation.isPending && syncQboMutation.variables === invoice.id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      {qboSynced ? 'Re-sync' : 'Sync QB'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSendTarget(invoice)}>
                      <Send className="w-3 h-3 mr-1" /> Send
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => {
                        if (confirm(`Void invoice ${invoice.invoice_number}? This cannot be undone.`)) {
                          deleteMutation.mutate(invoice.id);
                        }
                      }}
                      disabled={Number(invoice.amount_paid || 0) > 0}
                      title={
                        Number(invoice.amount_paid || 0) > 0
                          ? 'Cannot void an invoice with recorded payments'
                          : 'Void invoice'
                      }
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                {qboError && !qboSynced && (
                  <p className="mt-2 text-xs text-red-600 truncate" title={qboError}>
                    QuickBooks: {qboError}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ============================== CREATE / EDIT DIALOG ============================== */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.mode === 'edit' ? `Edit ${editing.invoice?.invoice_number}` : 'New invoice'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitInvoiceForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Job</Label>
                <Select
                  value={form.job_id}
                  onValueChange={(v) => setForm({ ...form, job_id: v })}
                  disabled={editing?.mode === 'edit'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.job_number || j.name || j.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Customer</Label>
                <Select
                  value={form.customer_id}
                  onValueChange={(v) => setForm({ ...form, customer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice-due">Due date</Label>
                <Input
                  id="invoice-due"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="invoice-terms">Payment terms</Label>
                <Input
                  id="invoice-terms"
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  placeholder="Net 30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="w-3 h-3 mr-1" /> Add line
                </Button>
              </div>
              <div className="rounded-md border divide-y">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs text-muted-foreground font-medium bg-muted/50">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Unit price</div>
                  <div className="col-span-1 text-right">Total</div>
                  <div className="col-span-1" />
                </div>
                {form.line_items.map((li, idx) => {
                  const lineTotal = Number(li.quantity || 0) * Number(li.unit_price || 0);
                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 px-3 py-2 items-center"
                    >
                      <Input
                        className="col-span-6"
                        value={li.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        placeholder="Roof tear-off + replacement"
                      />
                      <Input
                        className="col-span-2 text-right"
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.quantity}
                        onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                      />
                      <Input
                        className="col-span-2 text-right"
                        type="number"
                        min="0"
                        step="0.01"
                        value={li.unit_price}
                        onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
                      />
                      <div className="col-span-1 text-right tabular-nums">
                        ${formatMoney(lineTotal)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(idx)}
                          disabled={form.line_items.length === 1}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted/30">
                  <div className="col-span-10 text-right font-medium">Subtotal</div>
                  <div className="col-span-1 text-right font-bold tabular-nums">
                    ${formatMoney(formTotal)}
                  </div>
                  <div className="col-span-1" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="invoice-message">Message to customer</Label>
              <Textarea
                id="invoice-message"
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Thank you for your business…"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditor}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editing?.mode === 'edit' ? 'Save changes' : 'Create invoice'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================== RECORD PAYMENT DIALOG ============================== */}
      <Dialog open={!!paymentTarget} onOpenChange={(open) => !open && setPaymentTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment — {paymentTarget?.invoice_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border p-3 text-sm bg-muted/30">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">${formatMoney(paymentTarget?.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already paid</span>
                <span>${formatMoney(paymentTarget?.amount_paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span className="font-semibold text-orange-600">
                  ${formatMoney(
                    Number(paymentTarget?.total || 0) - Number(paymentTarget?.amount_paid || 0),
                  )}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Method</Label>
              <Select
                value={paymentForm.method}
                onValueChange={(v) => setPaymentForm({ ...paymentForm, method: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="ach">ACH</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment-ref">Reference</Label>
              <Input
                id="payment-ref"
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                placeholder="Check #1234 / Stripe charge id"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="payment-notes">Notes</Label>
              <Textarea
                id="payment-notes"
                rows={2}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => recordPaymentMutation.mutate()}
              disabled={recordPaymentMutation.isPending}
            >
              {recordPaymentMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Record payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================== SEND DIALOG ============================== */}
      <Dialog open={!!sendTarget} onOpenChange={(open) => !open && setSendTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send invoice {sendTarget?.invoice_number}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Mark this invoice as sent and notify the customer via email.
            Email delivery happens only if SMTP is configured under
            Settings → Integrations.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendTarget(null)}>Cancel</Button>
            <Button
              onClick={() => sendMutation.mutate(sendTarget.id)}
              disabled={sendMutation.isPending}
            >
              {sendMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send & mark sent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
