import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function EstimateTemplate({ estimate, showSignature = true }) {
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    sent: 'bg-purple-100 text-purple-700',
    viewed: 'bg-indigo-100 text-indigo-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-orange-100 text-orange-700',
    converted_to_contract: 'bg-emerald-100 text-emerald-700',
  };

  const totalTax = estimate.tax_total || 0;
  const totalProfit = estimate.total_profit || 0;
  const finalTotal = estimate.total || estimate.subtotal || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-600">ESTIMATE</h1>
          <p className="text-muted-foreground">#{estimate.estimate_number}</p>
        </div>
        <div className="text-right">
          <div className="mb-2">
            <Badge className={statusColors[estimate.status]}>
              {estimate.status?.replace(/_/g, ' ')}
            </Badge>
          </div>
          {estimate.version && (
            <p className="text-xs text-muted-foreground">Version {estimate.version}</p>
          )}
        </div>
      </div>

      {/* Company & Customer Info */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-sm mb-2">FROM</h3>
          <p className="text-sm">ENIX Exteriors</p>
          <p className="text-xs text-muted-foreground">Professional Roofing & Exterior Services</p>
        </div>
        <div>
          <h3 className="font-semibold text-sm mb-2">BILL TO</h3>
          <p className="text-sm font-semibold">{estimate.customer_name}</p>
          <p className="text-xs">{estimate.property_address}</p>
          <p className="text-xs">{estimate.property_city}, {estimate.property_state} {estimate.property_zip}</p>
          <p className="text-xs text-muted-foreground">{estimate.customer_email}</p>
        </div>
      </div>

      {/* Estimate Details */}
      <div className="grid grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Estimate #</p>
          <p className="font-semibold">{estimate.estimate_number}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="font-semibold">{estimate.created_date ? format(new Date(estimate.created_date), 'MMM d, yyyy') : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Expires</p>
          <p className="font-semibold">{estimate.expiration_date ? format(new Date(estimate.expiration_date), 'MMM d, yyyy') : 'N/A'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Service Type</p>
          <p className="font-semibold">{estimate.service_type?.replace(/_/g, ' ')}</p>
        </div>
      </div>

      {/* Insurance Info */}
      {estimate.insurance_claim && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <p className="text-sm"><span className="font-semibold">Insurance Claim:</span> {estimate.insurance_company}</p>
            <p className="text-sm"><span className="font-semibold">Claim #:</span> {estimate.claim_number}</p>
          </CardContent>
        </Card>
      )}

      {/* Scope of Work */}
      {estimate.scope_of_work && (
        <div>
          <h3 className="font-semibold mb-2">Scope of Work</h3>
          <p className="text-sm whitespace-pre-wrap">{estimate.scope_of_work}</p>
        </div>
      )}

      {/* Line Items */}
      {estimate.line_items?.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Materials & Services</h3>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-2 text-left">Item</th>
                  <th className="px-4 py-2 text-right">Qty</th>
                  <th className="px-4 py-2 text-right">Unit</th>
                  <th className="px-4 py-2 text-right">Unit Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {estimate.line_items.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'}>
                    <td className="px-4 py-2">
                      <p className="font-medium">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{item.unit_type}</td>
                    <td className="px-4 py-2 text-right">${(item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-right font-semibold">${(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end">
        <Card className="w-full md:w-96">
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-semibold">${(estimate.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalTax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span className="font-semibold">${totalTax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {totalProfit > 0 && (
              <div className="flex justify-between text-sm">
                <span>Profit:</span>
                <span className="font-semibold">${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between">
              <span className="font-bold">Total:</span>
              <span className="text-2xl font-bold text-primary">${finalTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {estimate.client_notes && (
        <div>
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-sm">{estimate.client_notes}</p>
        </div>
      )}

      {/* Terms & Conditions */}
      {estimate.terms_conditions && (
        <div className="pt-4 border-t">
          <h3 className="font-semibold text-sm mb-2">Terms & Conditions</h3>
          <p className="text-xs whitespace-pre-wrap text-muted-foreground">{estimate.terms_conditions}</p>
        </div>
      )}

      {/* Signature Section */}
      {showSignature && (
        <div className="grid grid-cols-2 gap-8 pt-8 border-t">
          <div>
            <p className="text-sm font-semibold mb-8">Customer Signature</p>
            <div className="border-b border-black h-8"></div>
            <p className="text-xs text-muted-foreground mt-1">Date</p>
          </div>
          <div>
            <p className="text-sm font-semibold mb-8">Authorized By</p>
            <div className="border-b border-black h-8"></div>
            <p className="text-xs text-muted-foreground mt-1">{estimate.sales_rep}</p>
          </div>
        </div>
      )}
    </div>
  );
}