import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Eye, Send, Download, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import ProposalBuilder from '@/components/crm/ProposalBuilder';
import ProposalViewer from '@/components/crm/ProposalViewer';
import { toast } from 'sonner';

export default function Proposals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals'],
    queryFn: () => base44.entities.Proposal.list(),
  });

  const { data: estimates = [] } = useQuery({
    queryKey: ['estimates'],
    queryFn: () => base44.entities.Estimate.list(),
  });

  const sendProposalMutation = useMutation({
    mutationFn: (proposalId) =>
      base44.integrations.Core.SendEmail({
        to: selectedProposal?.customer_email,
        subject: `Your Project Proposal - ${selectedProposal?.proposal_number}`,
        body: `
Dear ${selectedProposal?.customer_name},

Thank you for your interest in our services. Please find attached your detailed project proposal.

Proposal Number: ${selectedProposal?.proposal_number}
Total Amount: $${selectedProposal?.total?.toLocaleString()}
Property: ${selectedProposal?.property_address}

Please review the proposal carefully and let us know if you have any questions.

Next Steps:
1. Review the proposal
2. Approve or request revisions
3. Upon approval, a contract will be generated

Thank you!

Best regards,
Enix Exteriors
${selectedProposal?.company_phone}
${selectedProposal?.company_email}
        `,
      }),
    onSuccess: async () => {
      await base44.entities.Proposal.update(selectedProposal.id, {
        status: 'sent',
        sent_date: new Date().toISOString().split('T')[0],
      });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setSendDialogOpen(false);
      toast.success('Proposal sent to customer');
    },
    onError: (error) => {
      toast.error('Failed to send proposal');
    },
  });

  const deleteProposalMutation = useMutation({
    mutationFn: (proposalId) => base44.entities.Proposal.delete(proposalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      toast.success('Proposal deleted');
    },
  });

  const filteredProposals = proposals.filter(
    (p) =>
      p.proposal_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.property_address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    revision_requested: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-gray-200 text-gray-700',
  };

  const totalValue = filteredProposals.reduce((sum, p) => sum + (p.total || 0), 0);
  const approvedCount = filteredProposals.filter((p) => p.status === 'approved').length;
  const pendingCount = filteredProposals.filter(
    (p) => p.status === 'sent' || p.status === 'viewed'
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Proposals</h1>
          <p className="text-muted-foreground">Manage project proposals</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <FileText className="w-4 h-4" />
              New Proposal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Select Estimate</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {estimates.filter((e) => e.status !== 'approved').map((estimate) => (
                <Card
                  key={estimate.id}
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => {
                    // Close dialog and trigger builder
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{estimate.estimate_number}</p>
                        <p className="text-sm text-muted-foreground">{estimate.customer_name}</p>
                      </div>
                      <p className="font-semibold">${estimate.total?.toLocaleString()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Value</p>
            <p className="text-2xl font-bold">${(totalValue / 1000).toFixed(1)}K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Approved</p>
            <p className="text-2xl font-bold">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pending Review</p>
            <p className="text-2xl font-bold">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total Count</p>
            <p className="text-2xl font-bold">{filteredProposals.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search proposals by number, customer, or address..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {/* Proposals List */}
      {filteredProposals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No proposals found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {proposal.proposal_number}
                      </h3>
                      <Badge className={statusColors[proposal.status]}>
                        {proposal.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {proposal.customer_name} • {proposal.property_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${proposal.total?.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {proposal.sent_date
                        ? `Sent ${format(new Date(proposal.sent_date), 'MMM d')}`
                        : 'Draft'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProposal(proposal);
                      setViewerOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>

                  {proposal.status === 'draft' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setSendDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              'Are you sure you want to delete this proposal?'
                            )
                          ) {
                            deleteProposalMutation.mutate(proposal.id);
                          }
                        }}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Send Confirmation Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded">
              <p className="text-sm">
                <span className="font-semibold">To:</span>{' '}
                {selectedProposal?.customer_email}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Proposal:</span>{' '}
                {selectedProposal?.proposal_number}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              The customer will receive an email with the proposal and a link to
              review and approve it.
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setSendDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => sendProposalMutation.mutate(selectedProposal.id)}
                disabled={sendProposalMutation.isPending}
              >
                {sendProposalMutation.isPending ? 'Sending...' : 'Send Proposal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Viewer */}
      {viewerOpen && selectedProposal && (
        <ProposalViewer
          proposal={selectedProposal}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}