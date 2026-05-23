import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id } = await req.json();

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Get all admin users
    const admins = await base44.asServiceRole.entities.User.filter({
      role: 'admin'
    });

    const adminEmails = admins.map(admin => admin.email).join(', ');

    if (adminEmails) {
      // Send email to all admins
      await base44.integrations.Core.SendEmail({
        to: adminEmails,
        subject: `APPROVED: Estimate ${estimate.estimate_number} - ${estimate.customer_name}`,
        body: `Estimate Approved!\n\nCustomer: ${estimate.customer_name}\nEstimate #: ${estimate.estimate_number}\nAmount: $${estimate.total.toFixed(2)}\nService: ${estimate.service_type}\n\nAction Required: Convert to contract and schedule production.`
      });

      // Log activity
      await base44.functions.invoke('logActivity', {
        entity_type: 'Estimate',
        entity_id: estimate_id,
        action: 'approved',
        description: `Estimate approved by customer. Office notified: ${admins.length} admin(s)`,
        metadata: { notified_count: admins.length }
      });
    }

    return Response.json({ success: true, notified_admins: admins.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});