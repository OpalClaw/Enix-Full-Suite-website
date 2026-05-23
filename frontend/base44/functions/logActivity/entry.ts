import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { entity_type, entity_id, action, description, related_entity_id, related_entity_type, metadata } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activity = await base44.asServiceRole.entities.ActivityLog.create({
      entity_type,
      entity_id,
      action,
      performed_by: user.email,
      timestamp: new Date().toISOString(),
      description,
      related_entity_id,
      related_entity_type,
      metadata
    });

    return Response.json({ success: true, activity });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});