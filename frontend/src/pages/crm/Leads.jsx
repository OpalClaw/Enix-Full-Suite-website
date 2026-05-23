import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Plus, Search, ChevronDown, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import LeadCard from '@/components/crm/LeadCard';
import { toast } from '@/components/ui/use-toast';
import { usePageTitle } from '@/hooks/usePageTitle';

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
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export default function Leads() {
  usePageTitle('Leads');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [checkedLeads, setCheckedLeads] = useState(new Set());
  const [sort, setSort] = useState('created_date');
  const [watchListOnly, setWatchListOnly] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({ status: true, priority: true });
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  const updateLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(selectedLead.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelectedLead(null);
    },
    onError: (error) => {
      toast({ title: 'Failed to save', description: error?.message || 'Unknown error', variant: 'destructive' });
    },
  });

  const toggleCheckLead = (leadId) => {
    const newChecked = new Set(checkedLeads);
    if (newChecked.has(leadId)) {
      newChecked.delete(leadId);
    } else {
      newChecked.add(leadId);
    }
    setCheckedLeads(newChecked);
  };

  const toggleCheckAll = () => {
    if (checkedLeads.size === filtered.length) {
      setCheckedLeads(new Set());
    } else {
      setCheckedLeads(new Set(filtered.map(l => l.id)));
    }
  };

  const filtered = leads.filter(l => {
    const searchMatch = `${l.first_name} ${l.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.city?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === 'all' || l.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || l.priority === priorityFilter;
    return searchMatch && statusMatch && priorityMatch;
  }).sort((a, b) => {
    if (sort === 'created_date') return new Date(b.created_date) - new Date(a.created_date);
    if (sort === 'name') return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
    if (sort === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return 0;
  });

  const statuses = ['new', 'contacted', 'inspection_scheduled', 'estimate_sent', 'approved', 'lost'];
  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] = leads.filter(l => l.status === status).length;
    return acc;
  }, {});

  return (
    <div className="flex h-full">
      {/* Sidebar Filters */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block w-full md:w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto`}>
        <div className="p-4">
          <div className="flex items-center justify-between md:hidden mb-4">
            <h3 className="font-semibold">Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Watch List Filter */}
          <div className="mb-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="watch-list"
                checked={watchListOnly}
                onChange={(e) => setWatchListOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="watch-list" className="text-sm text-gray-700 cursor-pointer">
                Watch List Only
              </label>
            </div>
          </div>

          {/* Search */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-gray-700 mb-2 block">Search Leads</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Name, phone, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="mb-4 pb-4 border-b">
            <button
              onClick={() => setExpandedFilters({...expandedFilters, status: !expandedFilters.status})}
              className="flex items-center gap-2 w-full mb-2"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedFilters.status ? '' : '-rotate-90'}`} />
              <span className="text-xs font-semibold text-gray-700">Lead Status</span>
            </button>
            {expandedFilters.status && (
              <div className="space-y-2 ml-6">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="status-all"
                    name="status"
                    value="all"
                    checked={statusFilter === 'all'}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-3 h-3"
                  />
                  <label htmlFor="status-all" className="text-sm text-gray-700 cursor-pointer flex-1">All</label>
                  <span className="text-xs text-gray-500">{leads.length}</span>
                </div>
                {statuses.map(status => (
                  <div key={status} className="flex items-center gap-2">
                    <input
                      type="radio"
                      id={`status-${status}`}
                      name="status"
                      value={status}
                      checked={statusFilter === status}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-3 h-3"
                    />
                    <label htmlFor={`status-${status}`} className="text-sm text-gray-700 cursor-pointer flex-1 truncate">
                      {status.replace(/_/g, ' ')}
                    </label>
                    <span className="text-xs text-gray-500">{statusCounts[status]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Filter */}
          <div className="pb-4 border-b">
            <button
              onClick={() => setExpandedFilters({...expandedFilters, priority: !expandedFilters.priority})}
              className="flex items-center gap-2 w-full mb-2"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${expandedFilters.priority ? '' : '-rotate-90'}`} />
              <span className="text-xs font-semibold text-gray-700">Priority</span>
            </button>
            {expandedFilters.priority && (
              <div className="space-y-2 ml-6">
                {['low', 'medium', 'high', 'urgent'].map(priority => (
                  <div key={priority} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`priority-${priority}`}
                      checked={priorityFilter === priority || priorityFilter === 'all'}
                      onChange={() => setPriorityFilter(priorityFilter === priority ? 'all' : priority)}
                      className="w-3 h-3"
                    />
                    <label htmlFor={`priority-${priority}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </label>
                    <span className="text-xs text-gray-500">{leads.filter(l => l.priority === priority).length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header & Actions */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-heading font-bold text-3xl">Leads</h1>
                <p className="text-muted-foreground text-sm">Total: {filtered.length} lead{filtered.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
                  <Filter className="w-4 h-4" />
                </Button>
                <Link to="/crm/leads/new">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" /> New Lead
                  </Button>
                </Link>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {checkedLeads.size > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium">{checkedLeads.size} lead{checkedLeads.size !== 1 ? 's' : ''} selected</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCheckedLeads(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 rounded text-sm font-medium ${viewMode === 'grid' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 rounded text-sm font-medium ${viewMode === 'table' ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  Table
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="h-8 rounded border border-gray-300 px-2 text-sm"
                >
                  <option value="created_date">Newest First</option>
                  <option value="name">Name (A-Z)</option>
                  <option value="priority">Priority</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map(lead => (
              <div key={lead.id} onClick={() => {
                toggleCheckLead(lead.id);
                navigate(`/crm/leads/${lead.id}`);
              }}>
                <LeadCard
                  lead={lead}
                  onSelect={() => setSelectedLead(lead)}
                  isSelected={checkedLeads.has(lead.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="p-6 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                      <input
                        type="checkbox"
                        checked={checkedLeads.size === filtered.length && filtered.length > 0}
                        onChange={toggleCheckAll}
                        className="w-4 h-4"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Service</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(lead => (
                    <tr
                      key={lead.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${checkedLeads.has(lead.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => navigate(`/crm/leads/${lead.id}`)}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={checkedLeads.has(lead.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleCheckLead(lead.id);
                          }}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{lead.first_name} {lead.last_name}</p>
                        <p className="text-xs text-gray-500">{lead.city}, {lead.state}</p>
                      </td>
                      <td className="py-3 px-4 text-sm">{lead.phone}</td>
                      <td className="py-3 px-4 text-xs">{lead.service_needed?.replace(/_/g, ' ')}</td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[lead.status]}>
                          {lead.status?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={priorityColors[lead.priority]}>
                          {lead.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{lead.assigned_to || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            <p>No leads found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}

function LeadDetailModal({ lead, onClose }) {
  const [displayLead, setDisplayLead] = React.useState(lead);
  const [hasChanges, setHasChanges] = React.useState(false);
  const queryClient = useQueryClient();

  const updateLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(lead.id, data),
    onSuccess: (updatedLead) => {
      setDisplayLead(updatedLead);
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: (error) => {
      toast({ title: 'Failed to save', description: error?.message || 'Unknown error', variant: 'destructive' });
    },
  });

  const handleStatusChange = (newStatus) => {
    setDisplayLead({ ...displayLead, status: newStatus });
    setHasChanges(true);
  };

  const handlePriorityChange = (newPriority) => {
    setDisplayLead({ ...displayLead, priority: newPriority });
    setHasChanges(true);
  };

  const handleSave = () => {
    const changes = {};
    if (displayLead.status !== lead.status) changes.status = displayLead.status;
    if (displayLead.priority !== lead.priority) changes.priority = displayLead.priority;
    if (Object.keys(changes).length > 0) {
      updateLeadMutation.mutate(changes);
    } else {
      setHasChanges(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{lead.first_name} {lead.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Contact Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>📋</span> Contact Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Phone</p>
                <p className="font-medium">{lead.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Email</p>
                <p className="font-medium text-sm truncate">{lead.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>📍</span> Address
            </h3>
            <p className="text-sm text-gray-600">
              {lead.address && `${lead.address}, `}
              {lead.city && `${lead.city}, `}
              {lead.state}
              {lead.zip && ` ${lead.zip}`}
            </p>
          </div>

          {/* Service Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span>🔨</span> Service & Property
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Service Type</p>
                <p className="text-sm">{lead.service_needed?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-1">Property Type</p>
                <p className="text-sm">{lead.property_type || 'N/A'}</p>
              </div>
            </div>
            {lead.square_footage && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground font-semibold mb-1">Square Footage</p>
                <p className="text-sm">{lead.square_footage.toLocaleString()} sq ft</p>
              </div>
            )}
          </div>

          {/* Insurance Section */}
          {lead.insurance_claim && (
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>🛡️</span> Insurance Claim
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {lead.insurance_company && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Company</p>
                    <p className="text-sm">{lead.insurance_company}</p>
                  </div>
                )}
                {lead.claim_number && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Claim #</p>
                    <p className="text-sm">{lead.claim_number}</p>
                  </div>
                )}
                {lead.adjuster_name && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Adjuster</p>
                    <p className="text-sm">{lead.adjuster_name}</p>
                  </div>
                )}
                {lead.adjuster_phone && (
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Adjuster Phone</p>
                    <p className="text-sm">{lead.adjuster_phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Section */}
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-900 mb-3">Status & Priority</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2">Priority</p>
                <select
                  value={displayLead.priority || 'medium'}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  disabled={updateLeadMutation.isPending}
                  className="h-9 rounded-md border border-input px-3 w-full text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold mb-2">Lead Status</p>
                <select
                  value={displayLead.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updateLeadMutation.isPending}
                  className="h-9 rounded-md border border-input px-3 w-full text-sm"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="inspection_scheduled">Inspection Scheduled</option>
                  <option value="inspection_completed">Inspection Completed</option>
                  <option value="estimate_created">Estimate Created</option>
                  <option value="estimate_sent">Estimate Sent</option>
                  <option value="approved">Approved</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {lead.notes && (
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{lead.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {hasChanges && (
              <Button 
                onClick={handleSave}
                disabled={updateLeadMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Save Changes
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}