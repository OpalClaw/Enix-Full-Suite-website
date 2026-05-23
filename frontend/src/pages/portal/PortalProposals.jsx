import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Check, X, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';
import ProposalViewer from '@/components/crm/ProposalViewer';
import { toast } from 'sonner';

export default function PortalProposals() {
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalType, setApprovalType] = useState('');

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['jobs', user?.email],
    queryFn: () => base44.entities.Job.filter({ client_user_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: proposals = [] } = useQuery({
    queryKey: ['proposals', jobs.map(j => j.id).join(',')],
    queryFn: async () => {
      if (jobs.length === 0) return [];
      const allProposals = await base44.entities.Proposal.list();
      return allProposals.filter(p => jobs.some(j => j.lead_id === p.lead_id));
    },
    enabled: jobs.length > 0,
  });

  const approveMutation = useMutation({
    mutationFn: (data) =>
      base44.functions.invoke('approveProposal', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setApprovalDialogOpen(false);
      setRevisionNotes('');
      setApprovalType('');
      toast.success('Proposal updated successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleApproval = async () => {
    if (!selectedProposal) return;

    approveMutation.mutate({
      proposalId: selectedProposal.id,
      approvalType,
      revisionNotes: approvalType === 'revision_requested' ? revisionNotes : '',
    });
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    sent: 'bg-blue-100 text-blue-700',
    viewed: 'bg-purple-100 text-purple-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    revision_requested: 'bg-yellow-100 text-yellow-700',
    expired: 'bg-gray-200 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Proposals</h1>
        <p className="text-muted-foreground">Review and approve project proposals</p>
      </div>

      {proposals.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No proposals available yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {proposals.map((proposal) => (
            <Card key={proposal.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Proposal #{proposal.proposal_number}
                      </h3>
                      <Badge className={statusColors[proposal.status]}>
                        {proposal.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {proposal.service_type} • {proposal.property_address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${proposal.total?.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {format(new Date(proposal.sent_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                <div className="bg-muted p-3 rounded-lg mb-4">
                  <p className="text-sm font-semibold mb-1">Project Summary</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {proposal.project_summary}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                    <p className="text-sm font-semibold">{proposal.timeline_days} days</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Warranty</p>
                    <p className="text-sm font-semibold">{proposal.warranty_years} years</p>
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

                  {proposal.status === 'sent' || proposal.status === 'viewed' ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setApprovalType('approved');
                          setApprovalDialogOpen(true);
                        }}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setApprovalType('rejected');
                          setApprovalDialogOpen(true);
                        }}
                        className="gap-2"
                      >
                        <X className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setApprovalType('revision_requested');
                          setApprovalDialogOpen(true);
                        }}
                      >
                        Request Changes
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="ml-auto">
                      {proposal.status === 'approved' ? '✓ Approved' : 'Awaiting Action'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalType === 'approved'
                ? 'Approve Proposal'
                : approvalType === 'rejected'
                ? 'Reject Proposal'
                : 'Request Revision'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-3 rounded">
              <p className="text-sm">
                <span className="font-semibold">Proposal:</span>{' '}
                {selectedProposal?.proposal_number}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Total:</span> $
                {selectedProposal?.total?.toLocaleString()}
              </p>
            </div>

            {approvalType === 'revision_requested' && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  What would you like to change?
                </label>
                <Textarea
                  placeholder="Provide details about the requested revisions..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  rows={4}
                />
              </div>
            )}

            {approvalType === 'rejected' && (
              <div className="bg-red-50 border border-red-200 p-3 rounded">
                <p className="text-sm text-red-800">
                  This proposal will be marked as rejected. The contractor will be notified.
                </p>
              </div>
            )}

            {approvalType === 'approved' && (
              <div className="bg-green-50 border border-green-200 p-3 rounded">
                <p className="text-sm text-green-800">
                  This proposal will be approved. A contract will be generated for review.
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setApprovalDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproval}
                disabled={
                  approveMutation.isPending ||
                  (approvalType === 'revision_requested' && !revisionNotes)
                }
                className={
                  approvalType === 'approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : approvalType === 'rejected'
                    ? 'bg-red-600 hover:bg-red-700'
                    : ''
                }
              >
                {approveMutation.isPending ? 'Processing...' : 'Confirm'}
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