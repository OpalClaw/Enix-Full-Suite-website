import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, X } from 'lucide-react';

export default function EstimateForm({ leadId, jobId, onSuccess, trigger = 'New Estimate' }) {
  const [open, setOpen] = useState(false);
  const [lineItems, setLineItems] = useState([{ description: '', quantity: 1, unit_price: 0 }]);
  const [formData, setFormData] = useState({
    estimate_number: `EST-${Date.now()}`,
    lead_id: leadId,
    customer_name: '',
    customer_email: '',
    property_address: '',
    service_type: 'residential_roofing',
    property_type: 'residential',
    labor_cost: 0,
    material_cost: 0,
    tax: 0,
    discount: 0,
    notes: '',
  });

  // Fetch lead data when dialog opens
  const { data: lead } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadId ? base44.entities.Lead.get(leadId) : null,
    enabled: open && !!leadId,
  });

  // Pre-populate form with lead data
  useEffect(() => {
    if (lead && open) {
      setFormData(prev => ({
        ...prev,
        customer_name: lead.first_name && lead.last_name ? `${lead.first_name} ${lead.last_name}` : prev.customer_name,
        customer_email: lead.email || prev.customer_email,
        property_address: lead.address || prev.property_address,
        service_type: lead.service_needed || prev.service_type,
        property_type: lead.property_type || prev.property_type,
      }));
    }
  }, [lead, open]);

  const queryClient = useQueryClient();

  const createEstimateMutation = useMutation({
    mutationFn: async () => {
      const total = (lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)) + 
                   Number(formData.labor_cost) + 
                   Number(formData.material_cost) + 
                   Number(formData.tax) - 
                   Number(formData.discount);
      
      return base44.entities.Estimate.create({
        ...formData,
        total,
        line_items: lineItems.filter(item => item.description),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimates', leadId] });
      if (jobId) queryClient.invalidateQueries({ queryKey: ['estimates', jobId] });
      setOpen(false);
      setLineItems([{ description: '', quantity: 1, unit_price: 0 }]);
      onSuccess?.();
    },
  });

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setLineItems(newItems);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) + 
                  Number(formData.labor_cost) + 
                  Number(formData.material_cost) + 
                  Number(formData.tax) - 
                  Number(formData.discount);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Estimate</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); createEstimateMutation.mutate(); }} className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-3">
            <Input 
              placeholder="Customer Name" 
              value={formData.customer_name} 
              onChange={(e) => setFormData({...formData, customer_name: e.target.value})} 
            />
            <Input 
              placeholder="Customer Email" 
              type="email"
              value={formData.customer_email} 
              onChange={(e) => setFormData({...formData, customer_email: e.target.value})} 
            />
          </div>

          <Input 
            placeholder="Property Address" 
            value={formData.property_address} 
            onChange={(e) => setFormData({...formData, property_address: e.target.value})} 
          />

          {/* Service Type */}
          <div className="grid grid-cols-2 gap-3">
            <select 
              className="h-9 rounded-md border border-input px-3"
              value={formData.service_type}
              onChange={(e) => setFormData({...formData, service_type: e.target.value})}
            >
              <option value="residential_roofing">Residential Roofing</option>
              <option value="commercial_roofing">Commercial Roofing</option>
              <option value="roof_repair">Roof Repair</option>
              <option value="siding">Siding</option>
              <option value="windows">Windows</option>
            </select>
            <select 
              className="h-9 rounded-md border border-input px-3"
              value={formData.property_type}
              onChange={(e) => setFormData({...formData, property_type: e.target.value})}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          {/* Line Items */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Line Items</label>
            {lineItems.map((item, index) => (
              <div key={index} className="flex gap-2 items-end">
                <input 
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                  className="flex-1 h-9 rounded-md border border-input px-3 text-sm"
                />
                <input 
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value))}
                  className="w-16 h-9 rounded-md border border-input px-3 text-sm"
                />
                <input 
                  type="number"
                  placeholder="Price"
                  value={item.unit_price}
                  onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value))}
                  className="w-24 h-9 rounded-md border border-input px-3 text-sm"
                />
                <span className="w-24 text-right text-sm font-medium">
                  ${(item.quantity * item.unit_price).toLocaleString()}
                </span>
                {lineItems.length > 1 && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveLineItem(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleAddLineItem}
              className="mt-2"
            >
              + Add Line Item
            </Button>
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-3">
            <Input 
              type="number"
              placeholder="Labor Cost" 
              value={formData.labor_cost} 
              onChange={(e) => setFormData({...formData, labor_cost: e.target.value})} 
            />
            <Input 
              type="number"
              placeholder="Material Cost" 
              value={formData.material_cost} 
              onChange={(e) => setFormData({...formData, material_cost: e.target.value})} 
            />
            <Input 
              type="number"
              placeholder="Tax" 
              value={formData.tax} 
              onChange={(e) => setFormData({...formData, tax: e.target.value})} 
            />
            <Input 
              type="number"
              placeholder="Discount" 
              value={formData.discount} 
              onChange={(e) => setFormData({...formData, discount: e.target.value})} 
            />
          </div>

          {/* Notes */}
          <Textarea 
            placeholder="Estimate notes..." 
            value={formData.notes} 
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="min-h-20"
          />

          {/* Total */}
          <div className="bg-muted p-3 rounded-md flex items-center justify-between">
            <span className="font-semibold">Total:</span>
            <span className="text-2xl font-bold">${subtotal.toLocaleString()}</span>
          </div>

          <Button type="submit" className="w-full bg-navy-600 hover:bg-navy-700" disabled={createEstimateMutation.isPending}>
            Create Estimate
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}