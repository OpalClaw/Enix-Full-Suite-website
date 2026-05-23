import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Plus, Users, Phone, Mail, Wrench, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Crew() {
  const [selectedCrew, setSelectedCrew] = useState(null);
  const queryClient = useQueryClient();

  const { data: crews = [] } = useQuery({
    queryKey: ['crews'],
    queryFn: () => base44.entities.Crew.list('-created_date', 50),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => base44.entities.Job.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Crew.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crews'] });
      toast.success('Crew deleted');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Crew Management</h1>
          <p className="text-muted-foreground">Manage teams and assignments</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-navy-600 hover:bg-navy-700">
              <Plus className="w-4 h-4 mr-2" /> Add Crew
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Crew</DialogTitle>
            </DialogHeader>
            <NewCrewForm onSuccess={() => queryClient.invalidateQueries({ queryKey: ['crews'] })} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Crew Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {crews.filter(c => c.active).map(crew => {
          const assignedCount = crew.assigned_jobs?.length || 0;
          return (
            <Card
              key={crew.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedCrew(crew)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{crew.crew_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Wrench className="w-4 h-4" /> {crew.trade?.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Active</Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>{crew.crew_lead}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{crew.phone}</span>
                  </div>
                  {crew.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{crew.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t gap-2">
                   <span className="text-sm text-muted-foreground">{assignedCount} active job{assignedCount !== 1 ? 's' : ''}</span>
                   <div className="flex gap-1">
                     <Button size="sm" variant="outline"><Edit2 className="w-3 h-3" /></Button>
                     <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(crew.id)}><Trash2 className="w-3 h-3" /></Button>
                   </div>
                 </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Crew Detail Modal */}
      {selectedCrew && (
        <Dialog open={!!selectedCrew} onOpenChange={() => setSelectedCrew(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCrew.crew_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Crew Lead</p>
                  <p className="font-medium">{selectedCrew.crew_lead}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trade</p>
                  <p className="font-medium">{selectedCrew.trade?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedCrew.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{selectedCrew.email || 'N/A'}</p>
                </div>
              </div>

              {selectedCrew.assigned_jobs && selectedCrew.assigned_jobs.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Assigned Jobs</p>
                  <div className="space-y-1">
                    {selectedCrew.assigned_jobs.slice(0, 5).map(jobId => {
                      const job = jobs.find(j => j.id === jobId);
                      return job ? (
                        <div key={jobId} className="p-2 bg-muted/50 rounded text-sm">
                          {job.customer_name} - {job.property_address}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NewCrewForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    crew_name: '',
    crew_lead: '',
    phone: '',
    email: '',
    trade: 'roofing',
  });

  const createCrewMutation = useMutation({
    mutationFn: () => base44.entities.Crew.create(formData),
    onSuccess: () => {
      onSuccess?.();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); createCrewMutation.mutate(); }} className="space-y-3">
      <Input placeholder="Crew Name" value={formData.crew_name} onChange={(e) => setFormData({...formData, crew_name: e.target.value})} required />
      <Input placeholder="Crew Lead Name" value={formData.crew_lead} onChange={(e) => setFormData({...formData, crew_lead: e.target.value})} required />
      <Input placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
      <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
      <Button type="submit" className="w-full bg-navy-600 hover:bg-navy-700" disabled={createCrewMutation.isPending}>
        Create Crew
      </Button>
    </form>
  );
}