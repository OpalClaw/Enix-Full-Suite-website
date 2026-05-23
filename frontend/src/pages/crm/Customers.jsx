import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Phone, Mail, MapPin, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Customers() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => base44.entities.Customer.list('-created_date', 100),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted');
    },
  });

  const filtered = customers.filter(c =>
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.property_city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-3xl">Customers</h1>
          <p className="text-muted-foreground">Manage client information</p>
        </div>
        <Button className="bg-navy-600 hover:bg-navy-700">
          <Plus className="w-4 h-4 mr-2" /> New Customer
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by name, phone, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(customer => (
          <Card key={customer.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{customer.first_name} {customer.last_name}</h3>
                  <Badge variant="outline" className="text-xs">{customer.customer_type?.replace(/_/g, ' ')}</Badge>
                </div>
                {!customer.inactive && <Badge className="bg-green-100 text-green-700 text-xs">Active</Badge>}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.property_city}, {customer.property_state}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground gap-2">
                <div className="flex-1">
                  <span>{customer.total_jobs || 0} jobs</span>
                  <span> • ${(customer.total_revenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline"><Edit2 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => deleteMutation.mutate(customer.id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}