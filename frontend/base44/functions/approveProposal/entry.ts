import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { proposalId, approvalType, revisionNotes } = await req.json();

    if (!proposalId || !approvalType) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch proposal
    const proposals = await base44.entities.Proposal.filter({ id: proposalId });
    const proposal = proposals[0];

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Update proposal status
    const statusUpdate = {
      viewed_date: new Date().toISOString().split('T')[0],
    };

    if (approvalType === 'approved') {
      statusUpdate.status = 'approved';
      statusUpdate.customer_approved = true;
      statusUpdate.approved_date = new Date().toISOString().split('T')[0];
    } else if (approvalType === 'rejected') {
      statusUpdate.status = 'rejected';
    } else if (approvalType === 'revision_requested') {
      statusUpdate.status = 'revision_requested';
      statusUpdate.revision_notes = revisionNotes;
    }

    await base44.entities.Proposal.update(proposalId, statusUpdate);

    // If approved, update related estimate and create activity log
    if (approvalType === 'approved' && proposal.estimate_id) {
      // Update estimate status
      await base44.entities.Estimate.update(proposal.estimate_id, {
        status: 'approved',
        customer_approved: true,
        approved_date: new Date().toISOString().split('T')[0],
      });

      // Log activity
      await base44.entities.ActivityLog.create({
        user_email: user.email,
        user_name: user.full_name,
        action: 'approved_proposal',
        entity_type: 'Proposal',
        entity_id: proposalId,
        entity_name: proposal.proposal_number,
        details: `Proposal approved by customer: ${proposal.customer_name}`,
        timestamp: new Date().toISOString(),
      });
    }

    return Response.json({
      success: true,
      message: `Proposal ${approvalType} successfully`,
      proposal: statusUpdate,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});