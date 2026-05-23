import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id } = await req.json();

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Check if proposal already exists
    const existingProposal = await base44.asServiceRole.entities.Proposal.filter({
      estimate_id
    });

    if (existingProposal.length > 0) {
      return Response.json({ success: true, proposal: existingProposal[0] });
    }

    // Auto-generate proposal from estimate
    const proposal = await base44.asServiceRole.entities.Proposal.create({
      estimate_id,
      proposal_number: `PROP-${Date.now()}`,
      customer_name: estimate.customer_name,
      customer_email: estimate.customer_email,
      property_address: estimate.property_address,
      service_type: estimate.service_type,
      materials: [],
      colors: [],
      pricing_tiers: [
        {
          tier: 'standard',
          description: 'Standard Materials & Labor',
          price: estimate.total
        }
      ],
      upgrades: [],
      warranty: {
        type: 'standard',
        duration_years: 5,
        coverage: 'Materials and labor'
      },
      timeline: {
        start_date: new Date().toISOString().split('T')[0],
        completion_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
      },
      payment_schedule: [
        {
          milestone: 'deposit',
          percentage: 50,
          description: 'Upon contract signing'
        },
        {
          milestone: 'final',
          percentage: 50,
          description: 'Upon completion'
        }
      ],
      total_price: estimate.total,
      status: 'draft'
    });

    // Log activity
    await base44.functions.invoke('logActivity', {
      entity_type: 'Proposal',
      entity_id: proposal.id,
      action: 'created',
      description: 'Proposal auto-generated from estimate',
      related_entity_id: estimate_id,
      related_entity_type: 'Estimate'
    });

    return Response.json({ success: true, proposal });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});