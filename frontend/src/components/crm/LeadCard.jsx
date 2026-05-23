import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-cyan-100 text-cyan-800',
  inspection_scheduled: 'bg-purple-100 text-purple-800',
  inspection_completed: 'bg-indigo-100 text-indigo-800',
  estimate_created: 'bg-yellow-100 text-yellow-800',
  estimate_sent: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-800',
  lost: 'bg-gray-100 text-gray-800',
};

const priorityColors = {
  low: 'bg-blue-50 text-blue-700 border-blue-200',
  medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  urgent: 'bg-red-50 text-red-700 border-red-200',
};

export default function LeadCard({ lead, onSelect, isSelected }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-white border rounded-lg overflow-hidden transition-all ${
        isSelected ? 'ring-2 ring-orange-500 border-orange-500' : 'border-gray-200 hover:border-orange-300'
      }`}
    >
      {/* Main Content */}
      <div
        className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => onSelect(lead)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {lead.first_name} {lead.last_name}
              </h3>
              <Badge className={statusColors[lead.status] || 'bg-gray-100'}>
                {lead.status?.replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {lead.service_needed?.replace(/_/g, ' ')}
            </p>

            {/* Contact Section - Always Visible */}
            <div className="space-y-1 text-sm mb-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-700">Contact</span>
              </div>
              <p className="text-gray-600">📞 {lead.phone}</p>
              {lead.email && <p className="text-gray-600">✉️ {lead.email}</p>}
            </div>

            {/* Address Section */}
            {(lead.address || lead.city || lead.state) && (
              <div className="text-sm mb-3">
                <p className="font-semibold text-gray-700 mb-1">Address</p>
                <p className="text-gray-600">
                  {lead.address && `${lead.address}, `}
                  {lead.city && `${lead.city}, `}
                  {lead.state}
                </p>
              </div>
            )}

            {/* Priority Badge */}
            <div className="flex gap-2 flex-wrap mb-3">
              <Badge
                variant="outline"
                className={`border ${priorityColors[lead.priority] || ''}`}
              >
                {lead.priority?.charAt(0).toUpperCase() + lead.priority?.slice(1)} Priority
              </Badge>
              {lead.insurance_claim && (
                <Badge className="bg-green-100 text-green-800">Insurance Claim</Badge>
              )}
              {lead.assigned_to && (
                <Badge className="bg-purple-100 text-purple-800">
                  Assigned: {lead.assigned_to}
                </Badge>
              )}
            </div>
          </div>

          {/* Expand Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform ${
                expanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-5 space-y-4">
          {/* Service & Property Section */}
          {(lead.service_needed || lead.property_type) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Service & Property</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {lead.service_needed && (
                  <p>Service: {lead.service_needed.replace(/_/g, ' ')}</p>
                )}
                {lead.property_type && (
                  <p>Property Type: {lead.property_type}</p>
                )}
                {lead.square_footage && (
                  <p>Square Footage: {lead.square_footage.toLocaleString()}</p>
                )}
              </div>
            </div>
          )}

          {/* Insurance Section */}
          {lead.insurance_claim && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Insurance</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {lead.insurance_company && <p>Company: {lead.insurance_company}</p>}
                {lead.claim_number && <p>Claim #: {lead.claim_number}</p>}
                {lead.adjuster_name && <p>Adjuster: {lead.adjuster_name}</p>}
                {lead.adjuster_phone && <p>Phone: {lead.adjuster_phone}</p>}
              </div>
            </div>
          )}

          {/* Timeline Section */}
          {(lead.inspection_date || lead.follow_up_date) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Timeline</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {lead.inspection_date && (
                  <p>Inspection: {format(new Date(lead.inspection_date), 'MMM d, yyyy')}</p>
                )}
                {lead.follow_up_date && (
                  <p>Follow-up: {format(new Date(lead.follow_up_date), 'MMM d, yyyy')}</p>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {lead.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
              <p className="text-sm text-gray-600">{lead.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}