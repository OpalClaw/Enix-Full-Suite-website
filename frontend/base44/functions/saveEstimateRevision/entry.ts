import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id, changes } = await req.json();

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Create revision record
    const revision = await base44.asServiceRole.entities.EstimateRevision.create({
      estimate_id,
      revision_number: (estimate.revision_count || 0) + 1,
      previous_data: {
        total: estimate.total,
        material_cost: estimate.material_cost,
        labor_cost: estimate.labor_cost,
        service_type: estimate.service_type
      },
      changes,
      revision_timestamp: new Date().toISOString(),
      created_by: (await base44.auth.me()).email
    });

    // Update estimate revision count
    await base44.asServiceRole.entities.Estimate.update(estimate_id, {
      revision_count: (estimate.revision_count || 0) + 1,
      status: 'draft'
    });

    // Log activity
    await base44.functions.invoke('logActivity', {
      entity_type: 'Estimate',
      entity_id: estimate_id,
      action: 'revised',
      description: `Estimate revised. Revision #${revision.revision_number}. Changes: ${JSON.stringify(changes)}`,
      metadata: { revision_id: revision.id, revision_number: revision.revision_number }
    });

    return Response.json({ success: true, revision });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});