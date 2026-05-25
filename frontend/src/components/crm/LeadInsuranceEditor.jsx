import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

export default function LeadInsuranceEditor({ lead, onSave, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    insurance_claim: lead.insurance_claim || false,
    insurance_company: lead.insurance_company || '',
    claim_number: lead.claim_number || '',
    adjuster_name: lead.adjuster_name || '',
    adjuster_phone: lead.adjuster_phone || '',
  });

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="absolute top-4 right-4"
      >
        <Pencil className="w-4 h-4 mr-2" /> Edit
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.insurance_claim}
            onChange={(e) => setFormData({...formData, insurance_claim: e.target.checked})}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold">Has Insurance Claim</span>
        </label>
      </div>

      {formData.insurance_claim && (
        <>
          <div>
            <label className="text-xs font-semibold mb-1 block">Insurance Company</label>
            <Input
              value={formData.insurance_company}
              onChange={(e) => setFormData({...formData, insurance_company: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Claim Number</label>
            <Input
              value={formData.claim_number}
              onChange={(e) => setFormData({...formData, claim_number: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Adjuster Name</label>
            <Input
              value={formData.adjuster_name}
              onChange={(e) => setFormData({...formData, adjuster_name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1 block">Adjuster Phone</label>
            <Input
              value={formData.adjuster_phone}
              onChange={(e) => setFormData({...formData, adjuster_phone: e.target.value})}
            />
          </div>
        </>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-orange-600 hover:bg-orange-700"
        >
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}