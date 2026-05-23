import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const { documentId, signerToken, signatureData, initialData } = await req.json();

    if (!documentId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!signerToken) {
      return Response.json({ error: 'Missing signer token' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    const doc = await base44.asServiceRole.entities.SmartDocument.get(documentId);
    
    if (!doc) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const recipients = doc.recipients ?? [];
    const matched = recipients.find((recipient) => recipient.signer_token === signerToken);

    if (!matched) {
      return Response.json({ error: 'Invalid or expired signing link' }, { status: 403 });
    }

    const signerEmail = matched.email;

    const signatureEvent = await base44.asServiceRole.entities.SignatureEvent.create({
      document_id: documentId,
      signer_email: signerEmail,
      signer_name: signerEmail,
      event_type: 'signed',
      signature_data: signatureData,
      timestamp: new Date().toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown',
      device_info: req.headers.get('user-agent') || 'unknown',
    });

    const updatedRecipients = recipients.map((recipient) =>
      recipient.email === signerEmail ? { ...recipient, status: 'signed' } : recipient
    );

    const allSigned = updatedRecipients.every((recipient) => recipient.status === 'signed');

    await base44.asServiceRole.entities.SmartDocument.update(documentId, {
      recipients: updatedRecipients,
      status: allSigned ? 'signed' : 'delivered',
      signed_date: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.DocumentAuditLog.create({
      document_id: documentId,
      action: 'signed',
      performed_by: signerEmail,
    });

    return Response.json({
      success: true,
      message: 'Document signed successfully',
      allSigned,
    });
  } catch (error) {
    console.error('Error signing document:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});