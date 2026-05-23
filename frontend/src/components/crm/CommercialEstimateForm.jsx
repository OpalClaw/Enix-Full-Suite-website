import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';

const ROOF_SYSTEMS = ['TPO', 'EPDM', 'BUR', 'Modified bitumen', 'Coatings', 'Metal roofing'];
const SERVICE_TYPES = ['maintenance_plan', 'service_agreement', 'preventative_maintenance'];

export default function CommercialEstimateForm({ leadId, open, onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('basic');
  const [phases, setPhases] = useState([]);
  const [form, setForm] = useState({
    estimate_number: `COM-${Date.now()}`,
    lead_id: leadId,
    building_name: '',
    property_manager: '',
    property_manager_phone: '',
    property_address: '',
    roof_system: 'TPO',
    roof_size_sqft: 0,
    roof_size_squares: 0,
    number_of_penetrations: 0,
    hvac_count: 0,
    drain_count: 0,
    access_restrictions: '',
    safety_requirements: '',
    crane_required: false,
    crane_type: '',
    tear_off_layers: 1,
    is_multi_building: false,
    building_count: 1,
    is_phased_project: false,
    material_cost_per_square: 0,
    labor_cost_per_square: 0,
    equipment_cost: 0,
    safety_setup_cost: 0,
    crane_cost: 0,
    material_staging_cost: 0,
    night_weekend_labor_cost: 0,
    tenant_coordination_cost: 0,
    dump_fees: 0,
    waste_percentage: 10,
    overhead_profit_percent: 25,
    tax_percent: 0,
    discount: 0,
    service_agreement_included: false,
    service_agreement_type: 'maintenance_plan',
    service_agreement_duration_years: 3,
    service_agreement_annual_cost: 0,
    maintenance_visits_per_year: 2,
    maintenance_plan_details: '',
    notes: '',
  });

  const calculateTotal = () => {
    const squares = form.roof_size_squares || form.roof_size_sqft / 100;
    const materialCost = squares * form.material_cost_per_square;
    const laborCost = squares * form.labor_cost_per_square;
    const wasteAmount = (materialCost + laborCost) * (form.waste_percentage / 100);
    
    const subtotal = materialCost + laborCost + wasteAmount +
      form.equipment_cost + form.safety_setup_cost + form.crane_cost +
      form.material_staging_cost + form.night_weekend_labor_cost +
      form.tenant_coordination_cost + form.dump_fees;

    const overheadProfit = subtotal * (form.overhead_profit_percent / 100);
    const withOverhead = subtotal + overheadProfit;
    const tax = withOverhead * (form.tax_percent / 100);
    const total = withOverhead + tax - form.discount;

    return total;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const estimateData = {
        ...form,
        roof_size_squares: form.roof_size_squares || form.roof_size_sqft / 100,
        project_phases: phases,
        total_estimate: calculateTotal(),
      };
      return base44.entities.CommercialEstimate.create(estimateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commercialEstimates'] });
      onClose();
      setForm({
        estimate_number: `COM-${Date.now()}`,
        lead_id: leadId,
        building_name: '',
        property_manager: '',
        property_manager_phone: '',
        property_address: '',
        roof_system: 'TPO',
        roof_size_sqft: 0,
        roof_size_squares: 0,
        number_of_penetrations: 0,
        hvac_count: 0,
        drain_count: 0,
        access_restrictions: '',
        safety_requirements: '',
        crane_required: false,
        crane_type: '',
        tear_off_layers: 1,
        is_multi_building: false,
        building_count: 1,
        is_phased_project: false,
        material_cost_per_square: 0,
        labor_cost_per_square: 0,
        equipment_cost: 0,
        safety_setup_cost: 0,
        crane_cost: 0,
        material_staging_cost: 0,
        night_weekend_labor_cost: 0,
        tenant_coordination_cost: 0,
        dump_fees: 0,
        waste_percentage: 10,
        overhead_profit_percent: 25,
        tax_percent: 0,
        discount: 0,
        service_agreement_included: false,
        service_agreement_type: 'maintenance_plan',
        service_agreement_duration_years: 3,
        service_agreement_annual_cost: 0,
        maintenance_visits_per_year: 2,
        maintenance_plan_details: '',
        notes: '',
      });
      setPhases([]);
    },
  });

  const addPhase = () => {
    setPhases([...phases, {
      phase_number: phases.length + 1,
      phase_description: '',
      start_date: '',
      completion_date: '',
      phase_cost: 0,
    }]);
  };

  const updatePhase = (index, field, value) => {
    const updated = [...phases];
    updated[index][field] = value;
    setPhases(updated);
  };

  const removePhase = (index) => {
    setPhases(phases.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Commercial Estimate</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="service">Service Plan</TabsTrigger>
          </TabsList>

          {/* BASIC INFO TAB */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Building Name *</label>
                <Input
                  value={form.building_name}
                  onChange={(e) => setForm({ ...form, building_name: e.target.value })}
                  placeholder="e.g., Downtown Office Complex"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Property Manager</label>
                <Input
                  value={form.property_manager}
                  onChange={(e) => setForm({ ...form, property_manager: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Manager Phone</label>
                <Input
                  value={form.property_manager_phone}
                  onChange={(e) => setForm({ ...form, property_manager_phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Property Address</label>
                <Input
                  value={form.property_address}
                  onChange={(e) => setForm({ ...form, property_address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Roof System *</label>
                <Select value={form.roof_system} onValueChange={(value) => setForm({ ...form, roof_system: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOF_SYSTEMS.map((sys) => (
                      <SelectItem key={sys} value={sys}>{sys}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Roof Size (sq ft) *</label>
                <Input
                  type="number"
                  value={form.roof_size_sqft}
                  onChange={(e) => setForm({ ...form, roof_size_sqft: parseFloat(e.target.value) || 0 })}
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={form.is_multi_building}
                onCheckedChange={(checked) => setForm({ ...form, is_multi_building: checked })}
              />
              <label className="text-sm font-medium">Multi-Building Project</label>
            </div>
            {form.is_multi_building && (
              <Input
                type="number"
                value={form.building_count}
                onChange={(e) => setForm({ ...form, building_count: parseInt(e.target.value) || 1 })}
                placeholder="Number of buildings"
              />
            )}
          </TabsContent>

          {/* SCOPE TAB */}
          <TabsContent value="scope" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Penetrations</label>
                <Input
                  type="number"
                  value={form.number_of_penetrations}
                  onChange={(e) => setForm({ ...form, number_of_penetrations: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">HVAC Units</label>
                <Input
                  type="number"
                  value={form.hvac_count}
                  onChange={(e) => setForm({ ...form, hvac_count: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Drain Count</label>
                <Input
                  type="number"
                  value={form.drain_count}
                  onChange={(e) => setForm({ ...form, drain_count: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tear-off Layers</label>
                <Input
                  type="number"
                  value={form.tear_off_layers}
                  onChange={(e) => setForm({ ...form, tear_off_layers: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Access Restrictions</label>
              <Textarea
                value={form.access_restrictions}
                onChange={(e) => setForm({ ...form, access_restrictions: e.target.value })}
                placeholder="e.g., Limited roof access, active building operations..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Safety Requirements</label>
              <Textarea
                value={form.safety_requirements}
                onChange={(e) => setForm({ ...form, safety_requirements: e.target.value })}
                placeholder="e.g., Fall protection, harnesses, safety briefings..."
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                checked={form.crane_required}
                onCheckedChange={(checked) => setForm({ ...form, crane_required: checked })}
              />
              <label className="text-sm font-medium">Crane Required</label>
            </div>
            {form.crane_required && (
              <Input
                value={form.crane_type}
                onChange={(e) => setForm({ ...form, crane_type: e.target.value })}
                placeholder="e.g., Mobile crane 25-ton"
              />
            )}
          </TabsContent>

          {/* PRICING TAB */}
          <TabsContent value="pricing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Base Material & Labor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Material per Square</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.material_cost_per_square}
                      onChange={(e) => setForm({ ...form, material_cost_per_square: parseFloat(e.target.value) || 0 })}
                      placeholder="300"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Labor per Square</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form.labor_cost_per_square}
                      onChange={(e) => setForm({ ...form, labor_cost_per_square: parseFloat(e.target.value) || 0 })}
                      placeholder="250"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Additional Costs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Equipment Cost</label>
                    <Input
                      type="number"
                      value={form.equipment_cost}
                      onChange={(e) => setForm({ ...form, equipment_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Safety Setup</label>
                    <Input
                      type="number"
                      value={form.safety_setup_cost}
                      onChange={(e) => setForm({ ...form, safety_setup_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Crane Cost</label>
                    <Input
                      type="number"
                      value={form.crane_cost}
                      onChange={(e) => setForm({ ...form, crane_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Material Staging</label>
                    <Input
                      type="number"
                      value={form.material_staging_cost}
                      onChange={(e) => setForm({ ...form, material_staging_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Night/Weekend Labor</label>
                    <Input
                      type="number"
                      value={form.night_weekend_labor_cost}
                      onChange={(e) => setForm({ ...form, night_weekend_labor_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tenant Coordination</label>
                    <Input
                      type="number"
                      value={form.tenant_coordination_cost}
                      onChange={(e) => setForm({ ...form, tenant_coordination_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Dump Fees</label>
                    <Input
                      type="number"
                      value={form.dump_fees}
                      onChange={(e) => setForm({ ...form, dump_fees: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Adjustments & Tax</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Waste %</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.waste_percentage}
                      onChange={(e) => setForm({ ...form, waste_percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Overhead/Profit %</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.overhead_profit_percent}
                      onChange={(e) => setForm({ ...form, overhead_profit_percent: parseFloat(e.target.value) || 0 })}
                      placeholder="25"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tax %</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.tax_percent}
                      onChange={(e) => setForm({ ...form, tax_percent: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Discount</label>
                    <Input
                      type="number"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-primary">
                  Total: ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            {form.is_phased_project && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>Project Phases</span>
                    <Button size="sm" onClick={addPhase} variant="outline">
                      <Plus className="w-4 h-4 mr-1" /> Add Phase
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {phases.map((phase, idx) => (
                    <Card key={idx} className="p-3 bg-muted/50">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <Input
                          placeholder="Phase description"
                          value={phase.phase_description}
                          onChange={(e) => updatePhase(idx, 'phase_description', e.target.value)}
                        />
                        <div className="flex gap-2">
                          <Input
                            type="date"
                            value={phase.start_date}
                            onChange={(e) => updatePhase(idx, 'start_date', e.target.value)}
                          />
                          <Input
                            type="date"
                            value={phase.completion_date}
                            onChange={(e) => updatePhase(idx, 'completion_date', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Phase cost"
                          value={phase.phase_cost}
                          onChange={(e) => updatePhase(idx, 'phase_cost', parseFloat(e.target.value) || 0)}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removePhase(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SERVICE PLAN TAB */}
          <TabsContent value="service" className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={form.service_agreement_included}
                onCheckedChange={(checked) => setForm({ ...form, service_agreement_included: checked })}
              />
              <label className="text-sm font-medium">Include Service Plan</label>
            </div>

            {form.service_agreement_included && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Service Type</label>
                    <Select value={form.service_agreement_type} onValueChange={(value) => setForm({ ...form, service_agreement_type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maintenance_plan">Maintenance Plan</SelectItem>
                        <SelectItem value="service_agreement">Service Agreement</SelectItem>
                        <SelectItem value="preventative_maintenance">Preventative Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Duration (years)</label>
                    <Input
                      type="number"
                      value={form.service_agreement_duration_years}
                      onChange={(e) => setForm({ ...form, service_agreement_duration_years: parseInt(e.target.value) || 1 })}
                      placeholder="3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Annual Cost</label>
                    <Input
                      type="number"
                      value={form.service_agreement_annual_cost}
                      onChange={(e) => setForm({ ...form, service_agreement_annual_cost: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Maintenance Visits/Year</label>
                    <Input
                      type="number"
                      value={form.maintenance_visits_per_year}
                      onChange={(e) => setForm({ ...form, maintenance_visits_per_year: parseInt(e.target.value) || 2 })}
                      placeholder="2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Maintenance Plan Details</label>
                  <Textarea
                    value={form.maintenance_plan_details}
                    onChange={(e) => setForm({ ...form, maintenance_plan_details: e.target.value })}
                    placeholder="e.g., Quarterly inspections, debris removal, caulking, sealant checks..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={form.is_phased_project}
                    onCheckedChange={(checked) => setForm({ ...form, is_phased_project: checked })}
                  />
                  <label className="text-sm font-medium">Phased Project</label>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div>
          <label className="text-sm font-medium">Notes</label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Estimate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}