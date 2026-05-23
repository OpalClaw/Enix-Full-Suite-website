import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Warranties() {
  const queryClient = useQueryClient();
  const { data: warranties = [] } = useQuery({
    queryKey: ['warranties'],
    queryFn: () => base44.entities.Warranty.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Warranty.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warranties'] });
      toast.success('Warranty deleted');
    },
  });

  const active = warranties.filter(w => w.active).length;
  const expired = warranties.filter(w => !w.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Warranties</h1>
          <p className="text-muted-foreground">Track coverage and claims</p>
        </div>
        <Button className="bg-navy-600 hover:bg-navy-700">
          <Plus className="w-4 h-4 mr-2" /> New Warranty
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Warranties</p>
            <p className="text-2xl font-bold">{warranties.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-600">{active}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Expired</p>
            <p className="text-2xl font-bold text-orange-600">{expired}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {warranties.map(warranty => (
          <Card key={warranty.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{warranty.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold text-sm">{warranty.warranty_type?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-semibold">{warranty.duration_years} years</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="font-semibold text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> {format(new Date(warranty.end_date), 'MMM yyyy')}
                  </p>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <Badge className={warranty.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                    {warranty.active ? 'Active' : 'Expired'}
                  </Badge>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline"><Edit2 className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(warranty.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}