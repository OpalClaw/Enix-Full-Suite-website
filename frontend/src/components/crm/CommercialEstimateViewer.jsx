import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CommercialEstimateViewer({ estimate, open, onClose }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('estimate-content');
      if (element) {
        const canvas = await html2canvas(element, { scale: 2 });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210;
        const pageHeight = 295;
        let heightLeft = canvas.height * imgWidth / canvas.width;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, heightLeft);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - canvas.height * imgWidth / canvas.width;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, heightLeft);
          heightLeft -= pageHeight;
        }

        pdf.save(`${estimate.estimate_number}.pdf`);
      }
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const squares = estimate.roof_size_squares || estimate.roof_size_sqft / 100;
  const materialCost = squares * estimate.material_cost_per_square;
  const laborCost = squares * estimate.labor_cost_per_square;
  const wasteAmount = (materialCost + laborCost) * (estimate.waste_percentage / 100);
  const subtotal = materialCost + laborCost + wasteAmount +
    estimate.equipment_cost + estimate.safety_setup_cost + estimate.crane_cost +
    estimate.material_staging_cost + estimate.night_weekend_labor_cost +
    estimate.tenant_coordination_cost + estimate.dump_fees;
  const overheadProfit = subtotal * (estimate.overhead_profit_percent / 100);
  const withOverhead = subtotal + overheadProfit;
  const tax = withOverhead * (estimate.tax_percent / 100);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commercial Estimate: {estimate.estimate_number}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" /> {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4">
            <div id="estimate-content" className="space-y-4 p-4 bg-white">
              <div className="border-b pb-4">
                <h2 className="text-2xl font-bold mb-4">{estimate.building_name}</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600">Estimate #</div>
                    <div className="font-semibold">{estimate.estimate_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Status</div>
                    <Badge className={estimate.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {estimate.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Building Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Property Manager:</span>
                      <div className="font-medium">{estimate.property_manager}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Phone:</span>
                      <div className="font-medium">{estimate.property_manager_phone}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Address:</span>
                      <div className="font-medium">{estimate.property_address}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Roof System:</span>
                      <div className="font-medium">{estimate.roof_system}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Roof Specifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Roof Size:</span>
                      <div className="font-medium">{estimate.roof_size_sqft.toLocaleString()} sq ft ({squares.toFixed(1)} squares)</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Penetrations:</span>
                      <div className="font-medium">{estimate.number_of_penetrations}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">HVAC/Drains:</span>
                      <div className="font-medium">{estimate.hvac_count} HVAC / {estimate.drain_count} Drains</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Tear-off Layers:</span>
                      <div className="font-medium">{estimate.tear_off_layers}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Total Estimate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-primary">
                    ${estimate.total_estimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </CardContent>
              </Card>

              {estimate.service_agreement_included && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Service Plan Included</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span>
                      <div className="font-medium">{estimate.service_agreement_type.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <div className="font-medium">{estimate.service_agreement_duration_years} years @ ${estimate.service_agreement_annual_cost.toLocaleString()}/year</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Maintenance Visits:</span>
                      <div className="font-medium">{estimate.maintenance_visits_per_year} per year</div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* SCOPE TAB */}
          <TabsContent value="scope" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {estimate.is_multi_building && (
                  <div className="p-3 bg-blue-50 rounded">
                    <span className="font-medium">Multi-Building Project ({estimate.building_count} buildings)</span>
                  </div>
                )}
                {estimate.is_phased_project && (
                  <div className="p-3 bg-purple-50 rounded">
                    <span className="font-medium">Phased Project ({estimate.project_phases?.length || 0} phases)</span>
                  </div>
                )}
                {estimate.crane_required && (
                  <div className="p-3 bg-orange-50 rounded">
                    <span className="font-medium">Crane Required: {estimate.crane_type}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {estimate.access_restrictions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Access Restrictions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{estimate.access_restrictions}</p>
                </CardContent>
              </Card>
            )}

            {estimate.safety_requirements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Safety Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{estimate.safety_requirements}</p>
                </CardContent>
              </Card>
            )}

            {estimate.maintenance_plan_details && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Maintenance Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{estimate.maintenance_plan_details}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* BREAKDOWN TAB */}
          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Pricing Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2 border-b pb-3">
                  <div className="flex justify-between">
                    <span>Material Cost ({squares.toFixed(1)} squares)</span>
                    <span className="font-medium">${materialCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor Cost ({squares.toFixed(1)} squares)</span>
                    <span className="font-medium">${laborCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Waste ({estimate.waste_percentage}%)</span>
                    <span className="font-medium">${wasteAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2 border-b pb-3">
                  {estimate.equipment_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Equipment</span>
                      <span className="font-medium">${estimate.equipment_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {estimate.safety_setup_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Safety Setup</span>
                      <span className="font-medium">${estimate.safety_setup_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {estimate.crane_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Crane</span>
                      <span className="font-medium">${estimate.crane_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {estimate.material_staging_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Material Staging</span>
                      <span className="font-medium">${estimate.material_staging_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {estimate.night_weekend_labor_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Night/Weekend Labor</span>
                      <span className="font-medium">${estimate.night_weekend_labor_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {estimate.tenant_coordination_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Tenant Coordination</span>
                      <span className="font-medium">${estimate.tenant_coordination_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {estimate.dump_fees > 0 && (
                    <div className="flex justify-between">
                      <span>Dump Fees</span>
                      <span className="font-medium">${estimate.dump_fees.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-b pb-3">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Overhead/Profit ({estimate.overhead_profit_percent}%)</span>
                    <span className="font-medium">${overheadProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                {estimate.tax_percent > 0 && (
                  <div className="flex justify-between border-b pb-3">
                    <span>Tax ({estimate.tax_percent}%)</span>
                    <span className="font-medium">${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {estimate.discount > 0 && (
                  <div className="flex justify-between border-b pb-3">
                    <span>Discount</span>
                    <span className="font-medium text-green-600">-${estimate.discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${estimate.total_estimate.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SERVICE TAB */}
          <TabsContent value="service" className="space-y-4">
            {estimate.service_agreement_included ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Service Agreement Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Agreement Type:</span>
                      <div className="font-medium">{estimate.service_agreement_type.replace(/_/g, ' ')}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <div className="font-medium">{estimate.service_agreement_duration_years} years</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Annual Cost:</span>
                      <div className="font-medium">${estimate.service_agreement_annual_cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Value (with estimate):</span>
                      <div className="font-bold text-primary">
                        ${(estimate.total_estimate + (estimate.service_agreement_annual_cost * estimate.service_agreement_duration_years)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Maintenance Visits/Year:</span>
                      <div className="font-medium">{estimate.maintenance_visits_per_year}</div>
                    </div>
                  </CardContent>
                </Card>

                {estimate.maintenance_plan_details && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Included Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{estimate.maintenance_plan_details}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500 text-sm">
                  No service agreement included with this estimate.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}