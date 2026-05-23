import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreateJobFromContract } from '@/components/crm/WorkflowActions';

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_signature: 'bg-yellow-100 text-yellow-700',
  signed: 'bg-green-100 text-green-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
};

export default function Contracts() {
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date', 100),
  });

  const signed = contracts.filter(c => c.signed).length;
  const pending = contracts.filter(c => c.status === 'pending_signature').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-bold text-3xl">Contracts</h1>
        <p className="text-muted-foreground">Manage customer agreements</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Contracts</p>
            <p className="text-2xl font-bold">{contracts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Signed</p>
            <p className="text-2xl font-bold text-green-600">{signed}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pending Signature</p>
            <p className="text-2xl font-bold text-orange-600">{pending}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {contracts.map(contract => (
          <Card key={contract.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedContract(contract)}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Contract</p>
                  <p className="font-semibold">{contract.contract_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold text-sm">{contract.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-semibold">${contract.contract_price?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Signature</p>
                  <Badge className={contract.signed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {contract.signed ? 'Signed' : 'Pending'}
                  </Badge>
                </div>
                <div className="flex items-end justify-between">
                  <Badge className={statusColors[contract.status] || 'bg-gray-100'}>
                    {contract.status?.replace(/_/g, ' ')}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={(e) => {e.stopPropagation();}}>
                    <FileText className="w-4 h-4 mr-1" /> View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contract Detail Modal */}
      {selectedContract && (
        <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Contract #{selectedContract.contract_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold">{selectedContract.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedContract.status]}>{selectedContract.status?.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Contract Price</p>
                <p className="text-2xl font-bold">${selectedContract.contract_price?.toLocaleString()}</p>
              </div>
              {selectedContract.signed && (
                <div className="pt-3 border-t">
                  <CreateJobFromContract contract={selectedContract} />
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}