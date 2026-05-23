import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { estimate_id } = await req.json();

    // Fetch estimate
    const estimate = await base44.asServiceRole.entities.Estimate.get(estimate_id);
    if (!estimate) {
      return Response.json({ error: 'Estimate not found' }, { status: 404 });
    }

    // Fetch line items
    const lineItems = await base44.asServiceRole.entities.EstimateLineItems.filter({
      estimate_id
    });

    // Calculate totals
    const material_cost = lineItems.reduce((sum, item) => sum + (item.unit_cost * item.quantity), 0);
    const labor_cost = estimate.labor_cost_per_square * (estimate.roof_size_squares || 0);
    
    // Apply waste factor
    const waste_amount = (material_cost + labor_cost) * (estimate.waste_percentage / 100);
    
    // Calculate subtotal
    const subtotal = material_cost + labor_cost + waste_amount + 
      (estimate.equipment_cost || 0) + (estimate.safety_setup_cost || 0) + 
      (estimate.crane_cost || 0) + (estimate.material_staging_cost || 0) + 
      (estimate.night_weekend_labor_cost || 0) + (estimate.tenant_coordination_cost || 0) + 
      (estimate.dump_fees || 0);
    
    // Apply overhead & profit
    const overhead_profit = subtotal * (estimate.overhead_profit_percent / 100);
    
    // Apply tax
    const tax = (subtotal + overhead_profit) * (estimate.tax_percent / 100);
    
    // Apply discount
    const total_estimate = subtotal + overhead_profit + tax - estimate.discount;

    // Update estimate
    await base44.asServiceRole.entities.Estimate.update(estimate_id, {
      material_cost,
      labor_cost,
      tax,
      total_estimate
    });

    // Log activity
    await base44.functions.invoke('logActivity', {
      entity_type: 'Estimate',
      entity_id: estimate_id,
      action: 'created',
      description: `Estimate auto-calculated: Material $${material_cost.toFixed(2)}, Labor $${labor_cost.toFixed(2)}, Total $${total_estimate.toFixed(2)}`
    });

    return Response.json({ success: true, total_estimate, material_cost, labor_cost, tax });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});