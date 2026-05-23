import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Mail, Copy, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function EstimateViewer({ estimate, onEdit, onEmail, onExportPDF }) {
  const [selectedUpgradeIndices, setSelectedUpgradeIndices] = useState(
    estimate.selected_upgrades || []
  );

  const upgradeCost = estimate.upgrade_options
    ?.filter((_, idx) => selectedUpgradeIndices.includes(idx))
    .reduce((sum, upgrade) => sum + (upgrade.price || 0), 0) || 0;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">Estimate #{estimate.estimate_number}</h1>
          <p className="text-muted-foreground">{estimate.customer_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[estimate.status] || 'bg-gray-100'}>
            {estimate.status?.replace(/_/g, ' ')}
          </Badge>
          <Button variant="outline" size="icon" onClick={onEdit}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={onExportPDF}>
            <Download className="w-4 h-4" />
          </Button>
          <Button onClick={onEmail} className="gap-2">
            <Mail className="w-4 h-4" /> Send
          </Button>
        </div>
      </div>

      {/* Professional Estimate Document Preview */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 space-y-8 bg-white">
          {/* Header Section */}
          <div className="flex items-start justify-between border-b pb-6">
            <div>
              <h2 className="font-heading font-bold text-2xl">ESTIMATE</h2>
              <p className="text-muted-foreground text-sm">Enix Exteriors</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-semibold">Estimate #: {estimate.estimate_number}</p>
              <p className="text-sm text-muted-foreground">Date: {format(new Date(estimate.created_date), 'MMM d, yyyy')}</p>
              {estimate.expiration_date && (
                <p className="text-sm text-muted-foreground">Expires: {format(new Date(estimate.expiration_date), 'MMM d, yyyy')}</p>
              )}
            </div>
          </div>

          {/* Customer & Property Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-sm mb-3">Bill To:</h4>
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{estimate.customer_name}</p>
                <p>{estimate.property_address}</p>
                {estimate.customer_email && <p>{estimate.customer_email}</p>}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Project Details:</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Service:</span> {estimate.service_type?.replace(/_/g, ' ')}</p>
                <p><span className="text-muted-foreground">Type:</span> {estimate.property_type?.replace(/_/g, ' ')}</p>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <h4 className="font-semibold text-sm mb-3">Scope of Work</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Description</th>
                    <th className="px-4 py-2 text-right font-semibold w-20">Qty</th>
                    <th className="px-4 py-2 text-right font-semibold w-24">Unit Price</th>
                    <th className="px-4 py-2 text-right font-semibold w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.line_items?.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-right">${(item.unit_price || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-semibold">${(item.total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Optional Upgrades */}
          {estimate.upgrade_options && estimate.upgrade_options.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-3">Optional Upgrades</h4>
              <div className="space-y-2">
                {estimate.upgrade_options.map((upgrade, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedUpgradeIndices.includes(idx)}
                      onChange={() => {
                        if (selectedUpgradeIndices.includes(idx)) {
                          setSelectedUpgradeIndices(selectedUpgradeIndices.filter(i => i !== idx));
                        } else {
                          setSelectedUpgradeIndices([...selectedUpgradeIndices, idx]);
                        }
                      }}
                      className="w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{upgrade.name}</p>
                      <p className="text-xs text-muted-foreground">{upgrade.description}</p>
                    </div>
                    <p className="font-semibold">+${(upgrade.price || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {estimate.notes && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
            </div>
          )}

          {/* Totals Summary */}
          <div className="border-t pt-6">
            <div className="space-y-2 ml-auto w-80">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Materials & Labor</span>
                <span>${(estimate.material_cost + estimate.labor_cost).toLocaleString()}</span>
              </div>
              {selectedUpgradeIndices.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Selected Upgrades</span>
                  <span>${upgradeCost.toLocaleString()}</span>
                </div>
              )}
              {estimate.waste_percentage > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Waste ({estimate.waste_percentage}%)</span>
                  <span>${((estimate.material_cost + estimate.labor_cost + upgradeCost) * estimate.waste_percentage / 100).toLocaleString()}</span>
                </div>
              )}
              {estimate.tax > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax ({estimate.tax}%)</span>
                  <span>${estimate.tax?.toLocaleString()}</span>
                </div>
              )}
              {estimate.overhead_profit > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Overhead & Profit ({estimate.overhead_profit}%)</span>
                  <span>${(estimate.material_cost * (estimate.overhead_profit / 100)).toLocaleString()}</span>
                </div>
              )}
              {estimate.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${estimate.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t pt-3">
                <span>Total Estimate</span>
                <span className="text-primary">${estimate.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="border-t pt-6 space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Terms & Conditions</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This estimate is valid for 30 days from the date listed above. Prices are subject to change if project scope changes. 
                A 50% deposit is required to schedule work. Final payment is due upon completion. All materials are warrantied as per manufacturer specifications.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 pt-6 border-t">
              <div>
                <p className="text-xs text-muted-foreground mb-6">Customer Signature</p>
                <div className="border-b border-gray-900"></div>
                <p className="text-xs text-muted-foreground mt-1">Date: _________</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-6">Authorized Representative</p>
                <div className="border-b border-gray-900"></div>
                <p className="text-xs text-muted-foreground mt-1">Date: _________</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Internal Notes */}
      {estimate.internal_notes && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-sm">Internal Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{estimate.internal_notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}