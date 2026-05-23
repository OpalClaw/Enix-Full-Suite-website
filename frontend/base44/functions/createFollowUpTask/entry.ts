import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id } = await req.json();

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    const lead = await base44.asServiceRole.entities.Lead.get(estimate.lead_id);

    // Create follow-up task (3 days from now)
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 3);

    const task = await base44.asServiceRole.entities.Task.create({
      title: `Follow up: Estimate ${estimate.estimate_number}`,
      description: `Follow up with ${estimate.customer_name} regarding estimate ${estimate.estimate_number} for ${estimate.service_type}.`,
      due_date: followUpDate.toISOString().split('T')[0],
      status: 'pending',
      priority: 'high',
      assigned_to: lead?.assigned_to || 'unassigned',
      related_entity_id: estimate_id,
      related_entity_type: 'Estimate'
    });

    // Log activity
    await base44.functions.invoke('logActivity', {
      entity_type: 'Task',
      entity_id: task.id,
      action: 'created',
      description: `Follow-up task auto-created after estimate sent`,
      related_entity_id: estimate_id,
      related_entity_type: 'Estimate'
    });

    return Response.json({ success: true, task });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});