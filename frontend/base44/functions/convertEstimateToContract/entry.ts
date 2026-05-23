import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id } = await req.json();

    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Check if contract already exists
    const existingContract = await base44.asServiceRole.entities.Contract.filter({
      estimate_id
    });

    if (existingContract.length > 0) {
      return Response.json({ success: true, contract: existingContract[0] });
    }

    // Create contract from estimate
    const contract = await base44.asServiceRole.entities.Contract.create({
      contract_number: `CONTRACT-${Date.now()}`,
      estimate_id,
      customer_name: estimate.customer_name,
      customer_email: estimate.customer_email,
      property_address: estimate.property_address,
      service_type: estimate.service_type,
      contract_price: estimate.total,
      scope_of_work: `Installation of ${estimate.service_type} at ${estimate.property_address}`,
      warranty_terms: 'Standard 5-year material and labor warranty',
      payment_terms: '50% deposit, 50% upon completion',
      change_order_terms: 'Change orders must be approved in writing before work begins',
      start_date: new Date().toISOString().split('T')[0],
      completion_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      status: 'draft'
    });

    // Log activity
    await base44.functions.invoke('logActivity', {
      entity_type: 'Contract',
      entity_id: contract.id,
      action: 'created',
      description: 'Contract auto-created from approved estimate',
      related_entity_id: estimate_id,
      related_entity_type: 'Estimate'
    });

    return Response.json({ success: true, contract });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});