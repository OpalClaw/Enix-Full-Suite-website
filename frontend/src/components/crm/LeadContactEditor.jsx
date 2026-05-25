import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';

export default function LeadContactEditor({ lead, onSave, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: lead.first_name || '',
    last_name: lead.last_name || '',
    phone: lead.phone || '',
    email: lead.email || '',
    follow_up_date: lead.follow_up_date || '',
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold mb-1 block">First Name</label>
          <Input
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
          />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block">Last Name</label>
          <Input
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block">Phone</label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
      </div>
      <div>
        <label className="text-xs font-semibold mb-1 block">Follow-up Date</label>
        <Input
          type="date"
          value={formData.follow_up_date}
          onChange={(e) => setFormData({...formData, follow_up_date: e.target.value})}
        />
      </div>
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