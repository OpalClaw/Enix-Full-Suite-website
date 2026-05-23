import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';

const unitTypes = ['SQ', 'SF', 'LF', 'EA', 'Bundle', 'Roll', 'Sheet', 'Panel', 'Piece', 'Box', 'Tube', 'Gallon', 'Pail', 'Hour', 'Day', 'Crew Day', 'Trip', 'Job', 'Ton', 'Load', 'Dumpster'];

const serviceTypes = [
  { value: 'residential_roofing', label: 'Residential Roofing' },
  { value: 'commercial_roofing', label: 'Commercial Roofing' },
  { value: 'roof_repair', label: 'Roof Repair' },
  { value: 'siding', label: 'Siding' },
  { value: 'windows', label: 'Windows' },
  { value: 'doors', label: 'Doors' },
  { value: 'gutters', label: 'Gutters' },
  { value: 'storm_damage', label: 'Storm Damage' },
  { value: 'other', label: 'Other' },
];

const estimateTypes = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'repair', label: 'Repair' },
  { value: 'maintenance', label: 'Maintenance' },
];

export default function EstimateTemplateForm({ template, onSuccess }) {
  const [formData, setFormData] = useState({
    template_name: '',
    service_type: 'residential_roofing',
    estimate_type: 'residential',
    default_markup_percentage: 30,
    default_waste_percentage: 10,
    tax_rate: 0,
    default_terms_and_conditions: '',
    default_line_items: [],
    active: true,
  });

  useEffect(() => {
    if (template) {
      setFormData(template);
    }
  }, [template]);

  const saveTemplateMutation = useMutation({
    mutationFn: async (data) => {
      if (template?.id) {
        return base44.entities.EstimateTemplates.update(template.id, data);
      } else {
        return base44.entities.EstimateTemplates.create(data);
      }
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleAddLineItem = () => {
    setFormData({
      ...formData,
      default_line_items: [
        ...(formData.default_line_items || []),
        { category: 'materials', item_name: '', unit_type: 'SQ', unit_cost: 0 }
      ]
    });
  };

  const handleUpdateLineItem = (idx, field, value) => {
    const items = [...(formData.default_line_items || [])];
    items[idx][field] = value;
    setFormData({ ...formData, default_line_items: items });
  };

  const handleRemoveLineItem = (idx) => {
    const items = formData.default_line_items.filter((_, i) => i !== idx);
    setFormData({ ...formData, default_line_items: items });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveTemplateMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Template Name *</label>
          <Input
            value={formData.template_name}
            onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
            placeholder="e.g., Residential Roof Replacement"
            className="mt-1"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold">Service Type *</label>
            <Select value={formData.service_type} onValueChange={(value) => setFormData({ ...formData, service_type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(st => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold">Estimate Type *</label>
            <Select value={formData.estimate_type} onValueChange={(value) => setFormData({ ...formData, estimate_type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {estimateTypes.map(et => (
                  <SelectItem key={et.value} value={et.value}>{et.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold">Markup %</label>
            <Input
              type="number"
              value={formData.default_markup_percentage}
              onChange={(e) => setFormData({ ...formData, default_markup_percentage: parseFloat(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Waste %</label>
            <Input
              type="number"
              value={formData.default_waste_percentage}
              onChange={(e) => setFormData({ ...formData, default_waste_percentage: parseFloat(e.target.value) })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Tax Rate %</label>
            <Input
              type="number"
              step="0.01"
              value={formData.tax_rate}
              onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Terms & Conditions</label>
          <Textarea
            value={formData.default_terms_and_conditions}
            onChange={(e) => setFormData({ ...formData, default_terms_and_conditions: e.target.value })}
            placeholder="Default T&C text for estimates using this template..."
            className="mt-1"
            rows={4}
          />
        </div>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Default Line Items</CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={handleAddLineItem}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {(formData.default_line_items || []).map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
              <Input
                placeholder="Item name"
                value={item.item_name}
                onChange={(e) => handleUpdateLineItem(idx, 'item_name', e.target.value)}
                className="col-span-4 h-8 text-sm"
              />
              <Select value={item.unit_type} onValueChange={(value) => handleUpdateLineItem(idx, 'unit_type', value)}>
                <SelectTrigger className="col-span-2 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Cost"
                value={item.unit_cost}
                onChange={(e) => handleUpdateLineItem(idx, 'unit_cost', parseFloat(e.target.value))}
                className="col-span-3 h-8 text-sm"
              />
              <button
                type="button"
                onClick={() => handleRemoveLineItem(idx)}
                className="col-span-1 text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => onSuccess()}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-orange-600 hover:bg-orange-700"
          disabled={saveTemplateMutation.isPending}
        >
          {saveTemplateMutation.isPending ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </form>
  );
}