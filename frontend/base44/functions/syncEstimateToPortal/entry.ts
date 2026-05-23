import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id } = await req.json();

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Mark estimate as synced to portal
    await base44.asServiceRole.entities.Estimate.update(estimate_id, {
      synced_to_portal: true,
      portal_sync_date: new Date().toISOString()
    });

    // Log activity
    await base44.functions.invoke('logActivity', {
      entity_type: 'Estimate',
      entity_id: estimate_id,
      action: 'synced',
      description: `Estimate synced to client portal. Customer: ${estimate.customer_name}`,
      metadata: { synced_to_portal: true }
    });

    return Response.json({ success: true, synced: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});