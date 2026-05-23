import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId, recipients, message } = await req.json();

    if (!documentId || !recipients || !Array.isArray(recipients)) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doc = await base44.entities.SmartDocument.get(documentId);

    const normalizedRecipients = recipients.map((recipient) => ({
      ...recipient,
      signer_token: crypto.randomUUID(),
    }));

    const signingLinks = normalizedRecipients.map((recipient) => ({
      email: recipient.email,
      signingUrl: `${Deno.env.get('APP_URL')}/sign/${documentId}/${recipient.signer_token}`,
    }));

    await base44.entities.SmartDocument.update(documentId, {
      status: 'sent',
      recipients: normalizedRecipients.map((recipient) => ({ ...recipient, status: 'sent' })),
      sent_date: new Date().toISOString(),
    });

    for (const recipient of normalizedRecipients) {
      const signingUrl = signingLinks.find((link) => link.email === recipient.email)?.signingUrl;

      if (!signingUrl) {
        continue;
      }

      await base44.integrations.Core.SendEmail({
        to: recipient.email,
        subject: `Document Signature Required: ${doc.document_name}`,
        body: `
          <p>Hello ${recipient.name || 'there'},</p>
          <p>${message || 'Please review and sign the document below.'}</p>
          <p><a href="${signingUrl}" style="background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Review and Sign Document</a></p>
          <p>This link will expire in 30 days.</p>
        `,
        from_name: 'Enix SmartDocs',
      });
    }

    await base44.entities.DocumentAuditLog.create({
      document_id: documentId,
      action: 'sent',
      performed_by: user.email,
      changes: { recipients: normalizedRecipients.length },
    });

    return Response.json({
      success: true,
      message: 'Document sent for signature',
      signingLinks,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});