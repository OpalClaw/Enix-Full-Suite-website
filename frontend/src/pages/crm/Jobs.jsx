import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MapPin, DollarSign, LayoutGrid, LayoutList } from 'lucide-react';
import JobBoard from '@/components/crm/JobBoard';
import { jobStatusColors } from '@/lib/jobStatusColors';
import { usePageTitle } from '@/hooks/usePageTitle';

const statusColors = jobStatusColors;

export default function Jobs() {
  usePageTitle('Jobs');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('board');

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list('-created_date', 100),
  });

  const filtered = jobs.filter(j => {
    const matchesSearch = `${j.customer_name} ${j.property_address}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'lead', 'estimate_sent', 'approved', 'scheduled', 'in_production', 'final_inspection', 'invoiced', 'paid'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Jobs</h1>
          <p className="text-muted-foreground">Track projects from start to finish</p>
        </div>
        <div className="flex gap-2 border rounded-lg p-1 bg-muted/50">
          <Button
            variant={viewMode === 'board' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setViewMode('board')}
          >
            <LayoutGrid className="w-4 h-4" /> Board
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="w-4 h-4" /> List
          </Button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <JobBoard />
      ) : (
        <>
          {/* Filters */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by customer or address..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {statuses.map(s => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Jobs Table */}
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {filtered.map(job => (
                <Card key={job.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-semibold">{job.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{job.service_type?.replace(/_/g, ' ')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Address
                        </p>
                        <p className="font-semibold text-sm">{job.property_address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Contract
                        </p>
                        <p className="font-semibold">${job.contract_amount?.toLocaleString()}</p>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <Badge className={statusColors[job.status] || 'bg-gray-100'}>
                            {job.status?.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/crm/jobs/${job.id}`)}>View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No jobs found</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}