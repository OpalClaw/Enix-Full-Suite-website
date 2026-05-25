import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = [
  { value: 'tear_off', label: 'Tear Off' },
  { value: 'underlayment', label: 'Underlayment' },
  { value: 'ice_water_shield', label: 'Ice & Water Shield' },
  { value: 'shingles', label: 'Shingles' },
  { value: 'ridge_cap', label: 'Ridge Cap' },
  { value: 'flashing', label: 'Flashing' },
  { value: 'drip_edge', label: 'Drip Edge' },
  { value: 'ventilation', label: 'Ventilation' },
  { value: 'pipe_boots', label: 'Pipe Boots' },
  { value: 'skylights', label: 'Skylights' },
  { value: 'gutters', label: 'Gutters' },
  { value: 'siding', label: 'Siding' },
  { value: 'windows', label: 'Windows' },
  { value: 'doors', label: 'Doors' },
  { value: 'labor', label: 'Labor' },
  { value: 'dumpster', label: 'Dumpster' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'permit', label: 'Permit' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const UNIT_TYPES = [
  // Roofing Materials
  { value: 'SQ', label: 'SQ (Roofing Square)' },
  { value: 'SF', label: 'SF (Square Foot)' },
  { value: 'LF', label: 'LF (Linear Foot)' },
  { value: 'Bundle', label: 'Bundle' },
  { value: 'Roll', label: 'Roll' },
  { value: 'Sheet', label: 'Sheet' },
  { value: 'Panel', label: 'Panel' },
  { value: 'Piece', label: 'Piece' },
  { value: 'Cap', label: 'Cap' },
  { value: 'Tube', label: 'Tube' },
  { value: 'Box', label: 'Box' },
  { value: 'Coil', label: 'Coil' },
  { value: 'Carton', label: 'Carton' },
  // Labor Units
  { value: 'Per SQ', label: 'Per SQ' },
  { value: 'Per SF', label: 'Per SF' },
  { value: 'Per LF', label: 'Per LF' },
  { value: 'Hour', label: 'Hour' },
  { value: 'Day', label: 'Day' },
  { value: 'Crew Day', label: 'Crew Day' },
  { value: 'Trip', label: 'Trip' },
  { value: 'Job', label: 'Job' },
  // Commercial Coatings
  { value: 'Gallon', label: 'Gallon' },
  { value: 'Pail', label: 'Pail' },
  { value: 'Drum', label: 'Drum' },
  { value: 'Board', label: 'Board' },
  { value: 'Fastener Count', label: 'Fastener Count' },
  { value: 'Plate Count', label: 'Plate Count' },
  { value: 'Square', label: 'Square' },
  { value: 'Section', label: 'Section' },
  // Windows/Doors
  { value: 'EA', label: 'EA (Each)' },
  { value: 'Unit', label: 'Unit' },
  { value: 'Opening', label: 'Opening' },
  { value: 'Set', label: 'Set' },
];

export default function LineItemEditor({ lineItems, onChange }) {
  const calculateLineItemTotal = (item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    const materialCost = item.material_cost || 0;
    const laborCost = item.labor_cost || 0;
    const wastePercentage = item.waste_percentage || 0;

    const subtotal = quantity * unitPrice;
    const waste = subtotal * (wastePercentage / 100);
    return subtotal + waste + materialCost + laborCost;
  };

  const handleAddLineItem = () => {
    const newItem = {
      id: uuidv4(),
      category: '',
      item_name: '',
      description: '',
      quantity: 0,
      unit: 'SF',
      unit_price: 0,
      material_cost: 0,
      labor_cost: 0,
      waste_percentage: 0,
      taxable: true,
      total: 0,
    };
    onChange([...lineItems, newItem]);
  };

  const handleRemoveLineItem = (id) => {
    onChange(lineItems.filter(item => item.id !== id));
  };

  const handleUpdateLineItem = (id, field, value) => {
    const updated = lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        updatedItem.total = calculateLineItemTotal(updatedItem);
        return updatedItem;
      }
      return item;
    });
    onChange(updated);
  };

  const getTotalByCategory = (category) => {
    return lineItems
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const groupedByCategory = CATEGORIES.reduce((acc, cat) => {
    const items = lineItems.filter(item => item.category === cat.value);
    if (items.length > 0) {
      acc[cat.value] = { label: cat.label, items };
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedByCategory).map(([categoryValue, { label, items }]) => (
        <div key={categoryValue}>
          <h3 className="font-semibold text-sm mb-3">{label}</h3>
          <div className="space-y-3 mb-4">
            {items.map(item => (
              <Card key={item.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <Input
                    placeholder="Item name"
                    value={item.item_name}
                    onChange={(e) => handleUpdateLineItem(item.id, 'item_name', e.target.value)}
                    className="text-sm"
                  />
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleUpdateLineItem(item.id, 'description', e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Qty</label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <Select value={item.unit || 'SF'} onValueChange={(value) => handleUpdateLineItem(item.id, 'unit', value)}>
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIT_TYPES.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Unit Price</label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleUpdateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Material $</label>
                    <Input
                      type="number"
                      value={item.material_cost}
                      onChange={(e) => handleUpdateLineItem(item.id, 'material_cost', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Labor $</label>
                    <Input
                      type="number"
                      value={item.labor_cost}
                      onChange={(e) => handleUpdateLineItem(item.id, 'labor_cost', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Waste %</label>
                    <Input
                      type="number"
                      value={item.waste_percentage}
                      onChange={(e) => handleUpdateLineItem(item.id, 'waste_percentage', parseFloat(e.target.value) || 0)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold">${(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLineItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Button onClick={handleAddLineItem} variant="outline" className="w-full">
        <Plus className="w-4 h-4 mr-2" /> Add Line Item
      </Button>
    </div>
  );
}