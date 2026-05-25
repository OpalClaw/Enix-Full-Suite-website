import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';
import { format } from 'date-fns';

export default function ProposalViewer({ proposal, onClose, isPreview = false }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('proposal-content');
      const canvas = await html2canvas(element, { scale: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`${proposal.proposal_number}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between gap-4">
          <DialogTitle>Proposal Preview</DialogTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div id="proposal-content" className="bg-white text-black p-8 space-y-8">
          {/* Cover Page */}
          <div className="border-b pb-8 mb-8">
            <div className="flex items-center justify-between mb-12">
              {proposal.company_logo_url && (
                <img src={proposal.company_logo_url} alt="Company Logo" className="h-12" />
              )}
              <div className="text-right">
                <h1 className="text-3xl font-bold">{proposal.company_name}</h1>
                <p className="text-sm text-gray-600">{proposal.company_phone}</p>
                <p className="text-sm text-gray-600">{proposal.company_email}</p>
              </div>
            </div>

            <div className="text-center space-y-4 py-16">
              <h2 className="text-4xl font-bold">PROJECT PROPOSAL</h2>
              <p className="text-2xl text-gray-600">Proposal #{proposal.proposal_number}</p>
              <p className="text-lg text-gray-500">{format(new Date(proposal.created_date), 'MMMM d, yyyy')}</p>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="font-bold mb-2">FOR:</p>
                  <p>{proposal.customer_name}</p>
                  <p>{proposal.property_address}</p>
                  <p>{proposal.customer_email}</p>
                </div>
                <div>
                  <p className="font-bold mb-2">SERVICE:</p>
                  <p>{proposal.service_type}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Summary */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold border-b pb-3">Project Summary</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{proposal.project_summary}</p>
          </div>

          {/* Scope of Work */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold border-b pb-3">Scope of Work</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{proposal.scope_of_work}</p>
          </div>

          {/* Material Specifications */}
          {proposal.material_specifications?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold border-b pb-3">Material Specifications</h3>
              <div className="space-y-3">
                {proposal.material_specifications.map((material, idx) => (
                  <div key={idx} className="border p-4 rounded">
                    <p className="font-bold">{material.product_name}</p>
                    <p className="text-sm text-gray-600">{material.brand} | {material.color}</p>
                    <p className="text-sm text-gray-700 mt-2">{material.specifications}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color Selections */}
          {proposal.color_selections?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold border-b pb-3">Color Selections</h3>
              <div className="grid grid-cols-2 gap-4">
                {proposal.color_selections.map((color, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 border rounded">
                    <div
                      className="w-12 h-12 rounded border"
                      style={{ backgroundColor: color.color_code || '#ccc' }}
                    />
                    <div className="text-sm">
                      <p className="font-semibold">{color.item}</p>
                      <p className="text-gray-600">{color.color_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Tiers */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold border-b pb-3">Package Options</h3>
            <div className="grid grid-cols-3 gap-4">
              {proposal.pricing_tiers.map((tier) => (
                <div
                  key={tier.tier}
                  className={`border rounded-lg p-4 ${proposal.selected_tier === tier.tier ? 'border-blue-600 bg-blue-50' : ''}`}
                >
                  <p className="text-lg font-bold capitalize mb-2">{tier.tier}</p>
                  <p className="text-sm text-gray-600 mb-3">{tier.description}</p>
                  <p className="text-2xl font-bold text-blue-600">${tier.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade Options */}
          {proposal.upgrade_options?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold border-b pb-3">Available Upgrades</h3>
              <div className="space-y-3">
                {proposal.upgrade_options.map((upgrade, idx) => (
                  <div key={idx} className="border p-4 rounded flex justify-between items-start">
                    <div>
                      <p className="font-bold">{upgrade.name}</p>
                      <p className="text-sm text-gray-600">{upgrade.description}</p>
                    </div>
                    <p className="font-bold text-blue-600">${upgrade.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold border-b pb-3">Project Timeline</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-semibold">{format(new Date(proposal.start_date), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expected Completion</p>
                <p className="font-semibold">{format(new Date(proposal.completion_date), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{proposal.timeline_days} days</p>
              </div>
            </div>
          </div>

          {/* Warranty */}
          <div className="space-y-4 bg-gray-50 p-4 rounded">
            <h3 className="text-2xl font-bold border-b pb-3">Warranty</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Warranty Type</p>
                <p className="font-semibold capitalize">{proposal.warranty_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{proposal.warranty_years} years</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-4">{proposal.warranty_details}</p>
          </div>

          {/* Financing */}
          {proposal.financing_available && (
            <div className="space-y-4 bg-blue-50 p-4 rounded">
              <h3 className="text-2xl font-bold">Financing Available</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{proposal.financing_options}</p>
            </div>
          )}

          {/* Pricing Breakdown */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-2xl font-bold border-b pb-3">Pricing Breakdown</h3>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${proposal.subtotal.toLocaleString()}</span>
              </div>
              {proposal.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>${proposal.tax.toLocaleString()}</span>
                </div>
              )}
              {proposal.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${proposal.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-bold border-t pt-2">
                <span>Total:</span>
                <span>${proposal.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Schedule */}
          {proposal.payment_schedule?.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-2xl font-bold border-b pb-3">Payment Schedule</h3>
              <div className="space-y-2">
                {proposal.payment_schedule.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-2 border-b">
                    <span>{item.milestone}</span>
                    <span>${item.amount.toLocaleString()} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms & Conditions */}
          {proposal.terms_and_conditions && (
            <div className="space-y-4 bg-gray-50 p-4 rounded text-sm">
              <h3 className="text-2xl font-bold border-b pb-3">Terms & Conditions</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{proposal.terms_and_conditions}</p>
            </div>
          )}

          {/* Signature Section */}
          <div className="pt-12 border-t">
            <h3 className="text-2xl font-bold border-b pb-3 mb-8">Customer Approval</h3>
            <div className="grid grid-cols-2 gap-16">
              <div>
                <p className="text-sm text-gray-600 mb-8">Customer Signature</p>
                <div className="border-t border-gray-400 pt-1">
                  {proposal.customer_signature && (
                    <img src={proposal.customer_signature} alt="Signature" className="h-16" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">{proposal.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-8">Date</p>
                <div className="border-t border-gray-400 pt-1">
                  {proposal.signature_date && (
                    <p className="mt-2">{format(new Date(proposal.signature_date), 'MMMM d, yyyy')}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 text-center text-xs text-gray-600">
            <p>{proposal.company_name}</p>
            <p>{proposal.company_phone} | {proposal.company_website}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}