import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { estimateId, customerEmail, customerName, message } = await req.json();

    if (!estimateId || !customerEmail) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch estimate details
    const estimates = await base44.entities.Estimate.filter({ id: estimateId });
    const estimate = estimates[0];

    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Prepare email content
    const emailSubject = `Estimate ${estimate.estimate_number} from Enix Exteriors`;
    const emailBody = `
Hello ${customerName},

Please find below your estimate for the requested work:

Estimate #: ${estimate.estimate_number}
Service: ${estimate.service_type?.replace(/_/g, ' ')}
Property: ${estimate.property_address}
Total: $${(estimate.total || 0).toLocaleString()}

${message ? `\nMessage from our team:\n${message}\n` : ''}

Estimate Breakdown:
- Materials & Labor: $${(estimate.material_cost + estimate.labor_cost).toLocaleString()}
${estimate.upgrade_options?.length > 0 ? `- Optional Upgrades Available\n` : ''}
${estimate.waste_percentage > 0 ? `- Waste Factor: ${estimate.waste_percentage}%\n` : ''}
${estimate.tax > 0 ? `- Tax: ${estimate.tax}%\n` : ''}
- Total: $${(estimate.total || 0).toLocaleString()}

${estimate.notes ? `\nNotes:\n${estimate.notes}\n` : ''}

This estimate is valid for 30 days from the date issued.

If you have any questions or would like to move forward, please don't hesitate to contact us.

Best regards,
Enix Exteriors
    `;

    // Send email via base44 integration
    await base44.integrations.Core.SendEmail({
      to: customerEmail,
      subject: emailSubject,
      body: emailBody,
      from_name: 'Enix Exteriors',
    });

    // Update estimate status to 'sent'
    await base44.entities.Estimate.update(estimateId, {
      status: 'sent',
      sent_date: new Date().toISOString().split('T')[0],
    });

    return Response.json({ 
      success: true, 
      message: 'Estimate sent successfully',
      estimateId 
    });
  } catch (error) {
    console.error('Error sending estimate:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});