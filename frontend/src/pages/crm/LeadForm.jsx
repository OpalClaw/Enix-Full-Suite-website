import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Save, X } from 'lucide-react';

export default function LeadForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [expandedSections, setExpandedSections] = useState({
    contact: true,
    address: true,
    service: true,
    insurance: false,
    additional: false,
  });

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    service_needed: 'residential_roofing',
    property_type: 'residential',
    insurance_claim: false,
    claim_number: '',
    insurance_company: '',
    adjuster_name: '',
    adjuster_phone: '',
    lead_source: 'website',
    priority: 'medium',
    notes: '',
    square_footage: '',
  });

  const createLeadMutation = useMutation({
    mutationFn: () => base44.entities.Lead.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      navigate('/crm/leads');
    },
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      alert('Please fill in required fields: First Name, Last Name, Phone');
      return;
    }
    createLeadMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold mb-1">Create New Lead</h1>
              <p className="text-muted-foreground text-sm">Add a new lead to your pipeline</p>
            </div>
            <button
              onClick={() => navigate('/crm/leads')}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader
              className="bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleSection('contact')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Contact Information</CardTitle>
                <ChevronRight className={`w-5 h-5 transition-transform ${expandedSections.contact ? 'rotate-90' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.contact && (
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Address Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader
              className="bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleSection('address')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Address</CardTitle>
                <ChevronRight className={`w-5 h-5 transition-transform ${expandedSections.address ? 'rotate-90' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.address && (
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <Input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                      maxLength="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zip Code
                    </label>
                    <Input
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Service Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader
              className="bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleSection('service')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Service Information</CardTitle>
                <ChevronRight className={`w-5 h-5 transition-transform ${expandedSections.service ? 'rotate-90' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.service && (
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Needed
                    </label>
                    <select
                      name="service_needed"
                      value={formData.service_needed}
                      onChange={handleInputChange}
                      className="w-full h-9 rounded-md border border-input px-3"
                    >
                      <option value="residential_roofing">Residential Roofing</option>
                      <option value="commercial_roofing">Commercial Roofing</option>
                      <option value="roof_repair">Roof Repair</option>
                      <option value="siding">Siding</option>
                      <option value="windows">Windows</option>
                      <option value="doors">Doors</option>
                      <option value="gutters">Gutters</option>
                      <option value="storm_damage">Storm Damage</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Type
                    </label>
                    <select
                      name="property_type"
                      value={formData.property_type}
                      onChange={handleInputChange}
                      className="w-full h-9 rounded-md border border-input px-3"
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Source
                    </label>
                    <select
                      name="lead_source"
                      value={formData.lead_source}
                      onChange={handleInputChange}
                      className="w-full h-9 rounded-md border border-input px-3"
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="google">Google</option>
                      <option value="facebook">Facebook</option>
                      <option value="door_knock">Door Knock</option>
                      <option value="phone">Phone</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full h-9 rounded-md border border-input px-3"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Square Footage
                    </label>
                    <Input
                      name="square_footage"
                      type="number"
                      value={formData.square_footage}
                      onChange={handleInputChange}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Insurance Claim */}
          <Card className="border-0 shadow-sm">
            <CardHeader
              className="bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleSection('insurance')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Insurance Claim</CardTitle>
                <ChevronRight className={`w-5 h-5 transition-transform ${expandedSections.insurance ? 'rotate-90' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.insurance && (
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="checkbox"
                    id="insurance_claim"
                    name="insurance_claim"
                    checked={formData.insurance_claim}
                    onChange={handleInputChange}
                    className="w-4 h-4"
                  />
                  <label htmlFor="insurance_claim" className="text-sm font-medium text-gray-700">
                    This is an insurance claim
                  </label>
                </div>

                {formData.insurance_claim && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Claim Number
                      </label>
                      <Input
                        name="claim_number"
                        value={formData.claim_number}
                        onChange={handleInputChange}
                        placeholder="CLM-12345"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Company
                      </label>
                      <Input
                        name="insurance_company"
                        value={formData.insurance_company}
                        onChange={handleInputChange}
                        placeholder="State Farm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adjuster Name
                      </label>
                      <Input
                        name="adjuster_name"
                        value={formData.adjuster_name}
                        onChange={handleInputChange}
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Adjuster Phone
                      </label>
                      <Input
                        name="adjuster_phone"
                        type="tel"
                        value={formData.adjuster_phone}
                        onChange={handleInputChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Additional Information */}
          <Card className="border-0 shadow-sm">
            <CardHeader
              className="bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition"
              onClick={() => toggleSection('additional')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Additional Information</CardTitle>
                <ChevronRight className={`w-5 h-5 transition-transform ${expandedSections.additional ? 'rotate-90' : ''}`} />
              </div>
            </CardHeader>
            {expandedSections.additional && (
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Add any additional notes about this lead..."
                    rows="4"
                    className="w-full rounded-md border border-input px-3 py-2 font-body text-sm"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/crm/leads')}
              disabled={createLeadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-navy-600 hover:bg-navy-700 gap-2"
              disabled={createLeadMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {createLeadMutation.isPending ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}