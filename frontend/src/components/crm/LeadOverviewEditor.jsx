import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, X } from 'lucide-react';

export default function LeadOverviewEditor({ lead, onSave, isSaving }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    status: lead.status || 'new',
    priority: lead.priority || 'medium',
    assigned_to: lead.assigned_to || '',
    inspection_date: lead.inspection_date || '',
    notes: lead.notes || '',
    square_footage: lead.square_footage || '',
  });

  const handleSave = () => {
    onSave({ status: formData.status, priority: formData.priority });
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
      >
        <Pencil className="w-4 h-4 mr-2" /> Edit Status/Priority
      </Button>
    );
  }

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-lg">Edit Lead Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-2 block">Status</label>
            <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="inspection_scheduled">Inspection Scheduled</SelectItem>
                <SelectItem value="inspection_completed">Inspection Completed</SelectItem>
                <SelectItem value="estimate_created">Estimate Created</SelectItem>
                <SelectItem value="estimate_sent">Estimate Sent</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="contract_signed">Contract Signed</SelectItem>
                <SelectItem value="material_ordered">Material Ordered</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="final_inspection">Final Inspection</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-2 block">Priority</label>
            <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
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
      </CardContent>
    </Card>
  );
}