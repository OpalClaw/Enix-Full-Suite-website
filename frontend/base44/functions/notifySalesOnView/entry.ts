import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id, viewed_by } = await req.json();

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Get sales rep assigned to lead
    const lead = await base44.asServiceRole.entities.Lead.get(estimate.lead_id);
    const sales_rep = lead?.assigned_to;

    if (sales_rep) {
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: sales_rep,
        subject: `Estimate ${estimate.estimate_number} Viewed by ${estimate.customer_name}`,
        body: `Good news! Customer ${estimate.customer_name} has viewed their estimate (${estimate.estimate_number}) valued at $${estimate.total.toFixed(2)}. Viewed at: ${new Date().toLocaleString()}`
      });

      // Log activity
      await base44.functions.invoke('logActivity', {
        entity_type: 'Estimate',
        entity_id: estimate_id,
        action: 'viewed',
        description: `Estimate viewed by ${viewed_by}. Sales rep notified: ${sales_rep}`,
        metadata: { viewed_by, notified: sales_rep }
      });
    }

    return Response.json({ success: true, notified: sales_rep });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});