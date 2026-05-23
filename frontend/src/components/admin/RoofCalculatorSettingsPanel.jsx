import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Save } from 'lucide-react';

export default function RoofCalculatorSettingsPanel() {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['roofCalculatorSettings'],
    queryFn: () => base44.entities.RoofCalculatorSettings.filter({ setting_name: 'default' }).then(data => data[0] || {}),
  });

  const [formData, setFormData] = useState(settings || {});

  const updateSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        return base44.entities.RoofCalculatorSettings.update(settings.id, data);
      } else {
        return base44.entities.RoofCalculatorSettings.create({
          ...data,
          setting_name: 'default',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roofCalculatorSettings'] });
      setIsSaving(false);
    },
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettingsMutation.mutateAsync(formData);
  };

  const settingGroups = [
    {
      title: 'Waste & Material',
      fields: [
        { key: 'waste_percentage', label: 'Default Waste %', suffix: '%' },
        { key: 'sheathing_overlap_percentage', label: 'Sheathing Overlap %', suffix: '%' },
        { key: 'underlayment_overlap_percentage', label: 'Underlayment Overlap %', suffix: '%' },
        { key: 'ice_water_shield_coverage_ratio', label: 'Ice & Water Shield Ratio', suffix: 'x' },
        { key: 'starter_shingles_per_linear_ft', label: 'Starter Shingles per LF', suffix: 'bundles' },
        { key: 'ridge_cap_per_linear_ft', label: 'Ridge Cap per LF', suffix: 'bundles' },
      ],
    },
    {
      title: 'Labor & Rates',
      fields: [
        { key: 'labor_rate_per_hour', label: 'Labor Rate per Hour', suffix: '$/hr' },
        { key: 'labor_hours_per_square', label: 'Labor Hours per Square', suffix: 'hrs' },
        { key: 'complexity_penetration_multiplier', label: 'Penetration Complexity', suffix: 'x' },
        { key: 'complexity_valley_multiplier', label: 'Valley Complexity', suffix: 'x' },
      ],
    },
    {
      title: 'Accessories',
      fields: [
        { key: 'downspout_spacing_feet', label: 'Downspout Spacing', suffix: 'ft' },
        { key: 'flashing_per_penetration_sq_ft', label: 'Flashing per Penetration', suffix: 'sq ft' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl">Roof Calculator Settings</h1>
          <p className="text-muted-foreground">Customize calculation parameters for roof estimates</p>
        </div>
        <Badge variant="outline">Admin Only</Badge>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-semibold mb-1">Impact of Changes</p>
          <p>These settings will be applied to all new roof calculations. Existing estimates won't be affected.</p>
        </div>
      </div>

      <div className="space-y-6">
        {settingGroups.map((group, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-base">{group.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {group.fields.map(field => (
                <div key={field.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="text-sm font-medium">{field.label}</label>
                    <p className="text-xs text-muted-foreground">Default: {formData[field.key] || 'Not set'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder="Enter value"
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">{field.suffix}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold">Settings Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-muted-foreground">Default Waste</p>
                <p className="font-bold">{formData.waste_percentage}%</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-muted-foreground">Labor Rate</p>
                <p className="font-bold">${formData.labor_rate_per_hour}/hr</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-muted-foreground">Hours per Square</p>
                <p className="font-bold">{formData.labor_hours_per_square} hrs</p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="text-xs text-muted-foreground">Default Pitch</p>
                <p className="font-bold">{formData.default_pitch || '6/12'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['roofCalculatorSettings'] })}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}