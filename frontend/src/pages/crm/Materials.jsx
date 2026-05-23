import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wrench, Truck, Package, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700',
  in_transit: 'bg-yellow-100 text-yellow-700',
  delivered: 'bg-green-100 text-green-700',
  received: 'bg-emerald-100 text-emerald-700',
};

export default function Materials() {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.Material.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Material.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      toast.success('Material deleted');
    },
  });

  const filtered = statusFilter === 'all' ? materials : materials.filter(m => m.status === statusFilter);

  const totalCost = filtered.reduce((sum, m) => sum + (m.cost || 0), 0);
  const delivered = filtered.filter(m => m.status === 'delivered' || m.status === 'received').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl">Materials</h1>
        <p className="text-muted-foreground">Track orders and deliveries</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">${totalCost.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Delivered</p>
            <p className="text-2xl font-bold">{delivered}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold">{filtered.filter(m => m.status === 'pending' || m.status === 'ordered').length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'ordered', 'in_transit', 'delivered'].map(s => (
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

      {/* Materials List */}
      <div className="space-y-2">
        {filtered.map(material => (
          <Card key={material.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="font-semibold text-sm">{material.product_name}</p>
                  <p className="text-xs text-muted-foreground">{material.supplier}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Details</p>
                  <p className="font-semibold text-sm">{material.quantity} {material.unit}</p>
                  {material.color && <p className="text-xs text-muted-foreground">{material.color}</p>}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="font-semibold">${material.cost?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Delivery</p>
                  <p className="font-semibold text-sm">{format(new Date(material.delivery_date), 'MMM d')}</p>
                </div>
                <div className="flex items-end justify-between gap-2">
                   <Badge className={statusColors[material.status] || 'bg-gray-100'}>
                     {material.status?.replace(/_/g, ' ')}
                   </Badge>
                   <div className="flex gap-1">
                     <Button size="sm" variant="outline"><Edit2 className="w-3 h-3" /></Button>
                     <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(material.id)}><Trash2 className="w-3 h-3" /></Button>
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No materials found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}