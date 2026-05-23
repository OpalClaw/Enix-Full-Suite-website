import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { contract_id } = await req.json();

    const contract = await base44.asServiceRole.entities.Contract.get(contract_id);
    if (!contract) {
      return Response.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Check if invoice already exists
    const existingInvoice = await base44.asServiceRole.entities.Invoice.filter({
      contract_id
    });

    if (existingInvoice.length > 0) {
      return Response.json({ success: true, invoice: existingInvoice[0] });
    }

    // Generate invoice with deposit payment request
    const invoice = await base44.asServiceRole.entities.Invoice.create({
      invoice_number: `INV-${Date.now()}`,
      job_id: contract.estimate_id, // Link to job
      customer_name: contract.customer_name,
      customer_email: contract.customer_email,
      property_address: contract.property_address,
      service_type: contract.service_type,
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
      invoice_type: 'deposit',
      subtotal: contract.contract_price,
      tax: 0,
      discount: 0,
      total: contract.contract_price * 0.5, // 50% deposit
      paid_amount: 0,
      status: 'sent',
      line_items: [
        {
          description: `Deposit for ${contract.service_type}`,
          quantity: 1,
          unit_price: contract.contract_price * 0.5,
          total: contract.contract_price * 0.5
        }
      ]
    });

    // Log activity
    await base44.functions.invoke('logActivity', {
      entity_type: 'Invoice',
      entity_id: invoice.id,
      action: 'created',
      description: `Deposit invoice auto-generated from contract`,
      related_entity_id: contract_id,
      related_entity_type: 'Contract'
    });

    return Response.json({ success: true, invoice });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});