import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function EstimatePricingEngine({ lineItems, onCalculationChange }) {
  const calculateTotals = () => {
    const materialTotal = lineItems
      .reduce((sum, item) => sum + (item.material_cost || 0) + (item.quantity * item.unit_price || 0), 0);

    const laborTotal = lineItems
      .reduce((sum, item) => sum + (item.labor_cost || 0), 0);

    const wasteTotal = lineItems
      .reduce((sum, item) => {
        const base = (item.quantity || 0) * (item.unit_price || 0);
        return sum + (base * (item.waste_percentage || 0) / 100);
      }, 0);

    const subtotal = materialTotal + laborTotal + wasteTotal;

    return {
      materialTotal: Math.round(materialTotal * 100) / 100,
      laborTotal: Math.round(laborTotal * 100) / 100,
      wasteTotal: Math.round(wasteTotal * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  };

  const { materialTotal, laborTotal, wasteTotal, subtotal } = calculateTotals();

  const handleCalculationChange = (field, value) => {
    onCalculationChange({
      subtotal,
      materialTotal,
      laborTotal,
      wasteTotal,
      [field]: parseFloat(value) || 0,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Materials</p>
            <p className="text-xl font-bold">${materialTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Labor</p>
            <p className="text-xl font-bold">${laborTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Waste</p>
            <p className="text-xl font-bold">${wasteTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Subtotal</p>
            <p className="text-xl font-bold">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Estimate Calculations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Tax %</label>
            <Input
              type="number"
              placeholder="0"
              onChange={(e) => handleCalculationChange('tax_percentage', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Overhead %</label>
            <Input
              type="number"
              placeholder="15"
              defaultValue="15"
              onChange={(e) => handleCalculationChange('overhead_percentage', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Profit %</label>
            <Input
              type="number"
              placeholder="20"
              defaultValue="20"
              onChange={(e) => handleCalculationChange('profit_percentage', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Discount %</label>
            <Input
              type="number"
              placeholder="0"
              onChange={(e) => handleCalculationChange('discount_percentage', e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}