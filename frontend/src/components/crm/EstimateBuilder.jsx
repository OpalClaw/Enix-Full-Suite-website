import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Trash2, Plus } from 'lucide-react';
import TemplateSelector from './TemplateSelector';

export default function EstimateBuilder({ lead, onCreate, isLoading, onClose }) {
  const [showTemplateSelector, setShowTemplateSelector] = useState(true);
  const [formData, setFormData] = useState({
    estimate_number: '',
    service_type: lead.service_needed || '',
    labor_cost: '',
    material_cost: '',
    tax: '',
    discount: '',
    notes: '',
  });
  const [lineItems, setLineItems] = useState([]);
  const [upgradeOptions, setUpgradeOptions] = useState([]);

  const handleTemplateSelect = (template) => {
    if (template) {
      setLineItems(
        (template.default_line_items || []).map(item => ({
          description: item.item_name || '',
          unit_type: item.unit_type || 'SQ',
          quantity: item.quantity || 1,
          unit_price: item.unit_cost || 0,
          total: (item.quantity || 1) * (item.unit_cost || 0),
        }))
      );
      setFormData(prev => ({
        ...prev,
        service_type: template.service_type || prev.service_type,
        labor_cost: '',
        material_cost: '',
        tax: template.tax_rate || 0,
        discount: 0,
        notes: template.default_terms_and_conditions || '',
      }));
    }
    setShowTemplateSelector(false);
  };

  const unitTypes = [
    { value: 'SQ', label: 'SQ - Roofing Square (100 SF)' },
    { value: 'SF', label: 'SF - Square Foot' },
    { value: 'LF', label: 'LF - Linear Foot' },
    { value: 'Bundle', label: 'Bundle - Shingles' },
    { value: 'Roll', label: 'Roll - Material roll' },
    { value: 'Sheet', label: 'Sheet - Individual sheet' },
    { value: 'Panel', label: 'Panel - Roofing panel' },
    { value: 'Piece', label: 'Piece - Single item' },
    { value: 'Cap', label: 'Cap - Ridge cap piece' },
    { value: 'Tube', label: 'Tube - Sealant tube' },
    { value: 'Box', label: 'Box - Box quantity' },
    { value: 'Coil', label: 'Coil - Coil material' },
    { value: 'Carton', label: 'Carton - Carton packaging' },
  ];

  const laborCost = parseFloat(formData.labor_cost) || 0;
  const materialCost = parseFloat(formData.material_cost) || 0;
  const lineItemsTotal = lineItems.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const subtotal = laborCost + materialCost + lineItemsTotal;
  const tax = parseFloat(formData.tax) || 0;
  const discount = parseFloat(formData.discount) || 0;
  const total = subtotal + tax - discount;

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', unit_type: 'SQ', quantity: 1, unit_price: 0, total: 0 }]);
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = {...updated[index], [field]: value};
    if (field === 'quantity' || field === 'unit_price') {
      const qty = parseFloat(updated[index].quantity) || 0;
      const price = parseFloat(updated[index].unit_price) || 0;
      updated[index].total = qty * price;
    }
    setLineItems(updated);
  };

  const removeLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const addUpgradeOption = () => {
    setUpgradeOptions([...upgradeOptions, { name: '', price: 0 }]);
  };

  const updateUpgradeOption = (index, field, value) => {
    const updated = [...upgradeOptions];
    updated[index] = {...updated[index], [field]: value};
    setUpgradeOptions(updated);
  };

  const removeUpgradeOption = (index) => {
    setUpgradeOptions(upgradeOptions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onCreate({...formData, total, status: 'draft', line_items: lineItems, upgrade_options: upgradeOptions});
  };

  if (showTemplateSelector) {
    return (
      <TemplateSelector
        serviceType={lead.service_needed}
        onSelect={handleTemplateSelect}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-2xl">Create Estimate</CardTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Customer Info Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Name</p>
                <p className="text-sm font-medium">{lead.first_name} {lead.last_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">Property</p>
                <p className="text-sm font-medium">{lead.address}</p>
              </div>
            </div>
          </div>

          {/* Estimate Number Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-2">
              Estimate Number *
            </label>
            <Input
              value={formData.estimate_number}
              onChange={(e) => setFormData({...formData, estimate_number: e.target.value})}
              placeholder="EST-001"
              className="border-gray-300"
            />
          </div>

          {/* Service Type Section */}
          <div>
            <label className="block text-xs font-semibold text-gray-900 mb-2">
              Service Type *
            </label>
            <Select
              value={formData.service_type}
              onValueChange={(value) => setFormData({...formData, service_type: value})}
            >
              <SelectTrigger className="border-gray-300">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential_roofing">Residential Roofing</SelectItem>
                <SelectItem value="commercial_roofing">Commercial Roofing</SelectItem>
                <SelectItem value="roof_repair">Roof Repair</SelectItem>
                <SelectItem value="siding">Siding</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="gutters">Gutters</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Costs Section */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-gray-900 mb-4">Costs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">
                  Labor Cost
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.labor_cost}
                    onChange={(e) => setFormData({...formData, labor_cost: e.target.value})}
                    placeholder="0.00"
                    className="pl-7 border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">
                  Material Cost
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.material_cost}
                    onChange={(e) => setFormData({...formData, material_cost: e.target.value})}
                    placeholder="0.00"
                    className="pl-7 border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">
                  Tax
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.tax}
                    onChange={(e) => setFormData({...formData, tax: e.target.value})}
                    placeholder="0.00"
                    className="pl-7 border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-2">
                  Discount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    placeholder="0.00"
                    className="pl-7 border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Total Section */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">-${discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-orange-200 pt-2 text-orange-600">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-gray-900">Line Items</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addLineItem}
                className="text-orange-600 border-orange-300"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-3 pb-2 border-b border-gray-200">
                <div className="col-span-3 text-xs font-semibold text-gray-600">Description</div>
                <div className="col-span-2 text-xs font-semibold text-gray-600">Unit</div>
                <div className="col-span-2 text-xs font-semibold text-gray-600">Qty</div>
                <div className="col-span-2 text-xs font-semibold text-gray-600">Unit Price</div>
                <div className="col-span-2 text-right text-xs font-semibold text-gray-600">Total</div>
                <div className="col-span-1"></div>
              </div>
              {lineItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                    className="col-span-3 text-sm h-8 border-gray-300"
                  />
                  <Select
                    value={item.unit_type || 'SQ'}
                    onValueChange={(value) => updateLineItem(idx, 'unit_type', value)}
                  >
                    <SelectTrigger className="col-span-2 text-sm h-8 border-gray-300">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {unitTypes.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="0"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
                    className="col-span-2 text-sm h-8 border-gray-300"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
                    className="col-span-2 text-sm h-8 border-gray-300"
                  />
                  <div className="col-span-2 text-right pr-2">
                    <div className="text-sm font-semibold text-gray-900">${item.total.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => removeLineItem(idx)}
                    className="col-span-1 text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Options Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-sm text-gray-900">Upgrade Options</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addUpgradeOption}
                className="text-orange-600 border-orange-300"
              >
                <Plus className="w-3 h-3 mr-1" /> Add Option
              </Button>
            </div>
            <div className="space-y-2">
              {upgradeOptions.map((option, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <Input
                    placeholder="Option name"
                    value={option.name}
                    onChange={(e) => updateUpgradeOption(idx, 'name', e.target.value)}
                    className="flex-1 text-sm border-gray-300"
                  />
                  <div className="relative w-24">
                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={option.price}
                      onChange={(e) => updateUpgradeOption(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="pl-7 text-sm border-gray-300"
                    />
                  </div>
                  <button
                    onClick={() => removeUpgradeOption(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="border-t pt-4">
            <label className="block text-xs font-semibold text-gray-900 mb-2">
              Notes (Optional)
            </label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Add any additional notes about this estimate..."
              className="border-gray-300"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.estimate_number}
              className="bg-orange-600 hover:bg-orange-700 text-white flex-1"
            >
              {isLoading ? 'Creating...' : 'Create Estimate'}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}