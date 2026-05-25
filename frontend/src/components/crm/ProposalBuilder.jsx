import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, FileText } from 'lucide-react';
import ProposalViewer from './ProposalViewer';

export default function ProposalBuilder({ estimateId, leadId, trigger = 'Create Proposal' }) {
  const [open, setOpen] = useState(false);
  const [proposal, setProposal] = useState({
    proposal_number: `PROP-${Date.now()}`,
    estimate_id: estimateId,
    lead_id: leadId,
    customer_name: '',
    customer_email: '',
    property_address: '',
    service_type: '',
    project_summary: '',
    scope_of_work: '',
    before_photos: [],
    after_photos: [],
    material_specifications: [],
    color_selections: [],
    pricing_tiers: [
      { tier: 'good', description: 'Standard package', price: 0, features: [] },
      { tier: 'better', description: 'Enhanced package', price: 0, features: [] },
      { tier: 'best', description: 'Premium package', price: 0, features: [] },
    ],
    selected_tier: 'good',
    upgrade_options: [],
    warranty_type: 'manufacturer',
    warranty_years: 5,
    warranty_details: '',
    timeline_days: 14,
    start_date: new Date().toISOString().split('T')[0],
    completion_date: '',
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    payment_schedule: [],
    financing_available: true,
    financing_options: '',
    terms_and_conditions: '',
    company_logo_url: '',
    company_name: 'Enix Exteriors',
    company_phone: '',
    company_email: '',
    company_website: '',
    notes: '',
  });

  const [newMaterial, setNewMaterial] = useState({ category: '', product_name: '', brand: '', color: '', specifications: '' });
  const [newColor, setNewColor] = useState({ item: '', color_code: '', color_name: '' });
  const [newUpgrade, setNewUpgrade] = useState({ name: '', description: '', price: 0 });
  const [viewerOpen, setViewerOpen] = useState(false);

  const queryClient = useQueryClient();

  const createProposalMutation = useMutation({
    mutationFn: (data) => base44.entities.Proposal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      setOpen(false);
    },
  });

  const handleChange = (field, value) => {
    setProposal(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'selected_tier') {
        const tier = prev.pricing_tiers.find(t => t.tier === value);
        updated.subtotal = tier?.price || 0;
        updated.total = updated.subtotal + (updated.tax || 0) - (updated.discount || 0);
      }
      return updated;
    });
  };

  const addMaterial = () => {
    if (newMaterial.product_name) {
      setProposal(prev => ({
        ...prev,
        material_specifications: [...prev.material_specifications, newMaterial],
      }));
      setNewMaterial({ category: '', product_name: '', brand: '', color: '', specifications: '' });
    }
  };

  const removeMaterial = (idx) => {
    setProposal(prev => ({
      ...prev,
      material_specifications: prev.material_specifications.filter((_, i) => i !== idx),
    }));
  };

  const addColor = () => {
    if (newColor.item) {
      setProposal(prev => ({
        ...prev,
        color_selections: [...prev.color_selections, newColor],
      }));
      setNewColor({ item: '', color_code: '', color_name: '' });
    }
  };

  const removeColor = (idx) => {
    setProposal(prev => ({
      ...prev,
      color_selections: prev.color_selections.filter((_, i) => i !== idx),
    }));
  };

  const addUpgrade = () => {
    if (newUpgrade.name) {
      setProposal(prev => ({
        ...prev,
        upgrade_options: [...prev.upgrade_options, { ...newUpgrade, selected: false }],
      }));
      setNewUpgrade({ name: '', description: '', price: 0 });
    }
  };

  const removeUpgrade = (idx) => {
    setProposal(prev => ({
      ...prev,
      upgrade_options: prev.upgrade_options.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async () => {
    const completionDate = new Date(proposal.start_date);
    completionDate.setDate(completionDate.getDate() + proposal.timeline_days);
    
    await createProposalMutation.mutateAsync({
      ...proposal,
      completion_date: completionDate.toISOString().split('T')[0],
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <FileText className="w-4 h-4" />
            {trigger}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Builder</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="materials">Materials</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Customer Name"
                    value={proposal.customer_name}
                    onChange={(e) => handleChange('customer_name', e.target.value)}
                  />
                  <Input
                    type="email"
                    placeholder="Customer Email"
                    value={proposal.customer_email}
                    onChange={(e) => handleChange('customer_email', e.target.value)}
                  />
                  <Input
                    placeholder="Property Address"
                    value={proposal.property_address}
                    onChange={(e) => handleChange('property_address', e.target.value)}
                  />
                  <Input
                    placeholder="Service Type"
                    value={proposal.service_type}
                    onChange={(e) => handleChange('service_type', e.target.value)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Project summary"
                    value={proposal.project_summary}
                    onChange={(e) => handleChange('project_summary', e.target.value)}
                    rows={3}
                  />
                  <Textarea
                    placeholder="Scope of work"
                    value={proposal.scope_of_work}
                    onChange={(e) => handleChange('scope_of_work', e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Materials Tab */}
            <TabsContent value="materials" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Material Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Category"
                      value={newMaterial.category}
                      onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                    />
                    <Input
                      placeholder="Product Name"
                      value={newMaterial.product_name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, product_name: e.target.value })}
                    />
                    <Input
                      placeholder="Brand"
                      value={newMaterial.brand}
                      onChange={(e) => setNewMaterial({ ...newMaterial, brand: e.target.value })}
                    />
                    <Input
                      placeholder="Color"
                      value={newMaterial.color}
                      onChange={(e) => setNewMaterial({ ...newMaterial, color: e.target.value })}
                    />
                    <Textarea
                      placeholder="Specifications"
                      value={newMaterial.specifications}
                      onChange={(e) => setNewMaterial({ ...newMaterial, specifications: e.target.value })}
                      rows={2}
                    />
                    <Button onClick={addMaterial} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" /> Add Material
                    </Button>
                  </div>

                  <div className="space-y-2 mt-6">
                    {proposal.material_specifications.map((material, idx) => (
                      <div key={idx} className="p-3 border rounded-lg flex items-start justify-between">
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">{material.product_name}</p>
                          <p className="text-xs text-muted-foreground">{material.brand} - {material.color}</p>
                          <p className="text-xs text-muted-foreground">{material.specifications}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeMaterial(idx)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Color Selections</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Item (e.g., Shingles, Siding)"
                      value={newColor.item}
                      onChange={(e) => setNewColor({ ...newColor, item: e.target.value })}
                    />
                    <Input
                      placeholder="Color Code"
                      value={newColor.color_code}
                      onChange={(e) => setNewColor({ ...newColor, color_code: e.target.value })}
                    />
                    <Input
                      placeholder="Color Name"
                      value={newColor.color_name}
                      onChange={(e) => setNewColor({ ...newColor, color_name: e.target.value })}
                    />
                    <Button onClick={addColor} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" /> Add Color
                    </Button>
                  </div>

                  <div className="space-y-2 mt-6">
                    {proposal.color_selections.map((color, idx) => (
                      <div key={idx} className="p-3 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: color.color_code || '#ccc' }}
                          />
                          <div className="text-sm">
                            <p className="font-semibold">{color.item}</p>
                            <p className="text-xs text-muted-foreground">{color.color_name}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeColor(idx)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pricing Tiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proposal.pricing_tiers.map((tier) => (
                    <div key={tier.tier} className="p-4 border rounded-lg space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tier"
                          value={tier.tier}
                          checked={proposal.selected_tier === tier.tier}
                          onChange={() => handleChange('selected_tier', tier.tier)}
                        />
                        <span className="font-semibold capitalize">{tier.tier}</span>
                      </label>
                      <Input
                        placeholder="Description"
                        value={tier.description}
                        onChange={(e) => {
                          const updated = proposal.pricing_tiers.map(t =>
                            t.tier === tier.tier ? { ...t, description: e.target.value } : t
                          );
                          handleChange('pricing_tiers', updated);
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={tier.price}
                        onChange={(e) => {
                          const updated = proposal.pricing_tiers.map(t =>
                            t.tier === tier.tier ? { ...t, price: parseFloat(e.target.value) } : t
                          );
                          handleChange('pricing_tiers', updated);
                          if (tier.tier === proposal.selected_tier) {
                            setProposal(prev => ({ ...prev, subtotal: parseFloat(e.target.value), total: parseFloat(e.target.value) + (prev.tax || 0) - (prev.discount || 0) }));
                          }
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upgrade Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Input
                      placeholder="Upgrade Name"
                      value={newUpgrade.name}
                      onChange={(e) => setNewUpgrade({ ...newUpgrade, name: e.target.value })}
                    />
                    <Textarea
                      placeholder="Description"
                      value={newUpgrade.description}
                      onChange={(e) => setNewUpgrade({ ...newUpgrade, description: e.target.value })}
                      rows={2}
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={newUpgrade.price}
                      onChange={(e) => setNewUpgrade({ ...newUpgrade, price: parseFloat(e.target.value) })}
                    />
                    <Button onClick={addUpgrade} variant="outline" className="w-full">
                      <Plus className="w-4 h-4 mr-2" /> Add Upgrade
                    </Button>
                  </div>

                  <div className="space-y-2 mt-6">
                    {proposal.upgrade_options.map((upgrade, idx) => (
                      <div key={idx} className="p-3 border rounded-lg flex items-start justify-between">
                        <div className="text-sm space-y-1">
                          <p className="font-semibold">{upgrade.name}</p>
                          <p className="text-xs text-muted-foreground">{upgrade.description}</p>
                          <p className="text-sm font-semibold text-primary">${upgrade.price.toLocaleString()}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeUpgrade(idx)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Totals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${proposal.subtotal.toLocaleString()}</span>
                  </div>
                  <Input
                    type="number"
                    placeholder="Tax"
                    value={proposal.tax}
                    onChange={(e) => {
                      const tax = parseFloat(e.target.value) || 0;
                      setProposal(prev => ({
                        ...prev,
                        tax,
                        total: prev.subtotal + tax - prev.discount,
                      }));
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Discount"
                    value={proposal.discount}
                    onChange={(e) => {
                      const discount = parseFloat(e.target.value) || 0;
                      setProposal(prev => ({
                        ...prev,
                        discount,
                        total: prev.subtotal + prev.tax - discount,
                      }));
                    }}
                  />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${proposal.total.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="date"
                    label="Start Date"
                    value={proposal.start_date}
                    onChange={(e) => handleChange('start_date', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Timeline (days)"
                    value={proposal.timeline_days}
                    onChange={(e) => handleChange('timeline_days', parseInt(e.target.value))}
                  />
                  <Input
                    type="number"
                    placeholder="Warranty (years)"
                    value={proposal.warranty_years}
                    onChange={(e) => handleChange('warranty_years', parseInt(e.target.value))}
                  />
                  <Input
                    placeholder="Warranty Type"
                    value={proposal.warranty_type}
                    onChange={(e) => handleChange('warranty_type', e.target.value)}
                  />
                  <Textarea
                    placeholder="Warranty Details"
                    value={proposal.warranty_details}
                    onChange={(e) => handleChange('warranty_details', e.target.value)}
                    rows={4}
                  />
                  <Textarea
                    placeholder="Financing Options"
                    value={proposal.financing_options}
                    onChange={(e) => handleChange('financing_options', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Terms Tab */}
            <TabsContent value="terms" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Terms & Conditions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Terms and conditions"
                    value={proposal.terms_and_conditions}
                    onChange={(e) => handleChange('terms_and_conditions', e.target.value)}
                    rows={6}
                  />
                  <Textarea
                    placeholder="Additional notes"
                    value={proposal.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setViewerOpen(true)}
              className="flex-1"
            >
              Preview
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createProposalMutation.isPending}
              className="flex-1"
            >
              {createProposalMutation.isPending ? 'Creating...' : 'Create Proposal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {viewerOpen && <ProposalViewer proposal={proposal} onClose={() => setViewerOpen(false)} isPreview />}
    </>
  );
}