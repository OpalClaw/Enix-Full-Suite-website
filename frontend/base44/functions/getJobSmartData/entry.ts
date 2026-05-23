import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { jobId } = await req.json();

    const [job, estimates, invoices] = await Promise.all([
      base44.entities.Job.get(jobId),
      base44.entities.Estimate.filter({ job_id: jobId }),
      base44.entities.Invoice.filter({ job_id: jobId }),
    ]);

    const estimateId = estimates?.[0]?.id;
    const [
      measurements,
      photos,
      warranty,
      materials,
      crew,
      changeOrders,
      insuranceClaim,
      production,
      paymentHistory,
    ] = await Promise.all([
      estimateId ? base44.entities.MeasurementData.filter({ estimate_id: estimateId }) : Promise.resolve([]),
      estimateId ? base44.entities.EstimatePhotos.filter({ estimate_id: estimateId }) : Promise.resolve([]),
      base44.entities.Warranty.filter({ job_id: jobId }),
      base44.entities.Material.filter({ job_id: jobId }),
      base44.entities.Crew.filter({ job_id: jobId }),
      base44.entities.ChangeOrder.filter({ job_id: jobId }),
      base44.entities.InsuranceClaim.filter({ job_id: jobId }),
      base44.entities.Task.filter({ job_id: jobId, type: 'production' }),
      base44.entities.Payment.filter({ job_id: jobId }),
    ]);

    const customerData = job?.lead_id ? await base44.entities.Lead.get(job.lead_id) : null;

    const estimate = estimates?.[0];
    const invoice = invoices?.[0];
    const measurement = measurements?.[0];
    const insurance = insuranceClaim?.[0];

    const smartData = {
      job: {
        jobId: job?.id,
        jobNumber: job?.job_number,
        jobName: job?.job_name,
        jobType: job?.job_type,
        jobStatus: job?.status,
        jobStage: job?.stage,
        createdDate: job?.created_date,
        startDate: job?.start_date,
        completionDate: job?.completion_date,
        salesRep: job?.sales_rep,
        projectManager: job?.project_manager,
        productionManager: job?.production_manager,
        assignedCrew: crew?.map((c) => c.name).join(', '),
      },
      customer: {
        id: customerData?.id,
        firstName: customerData?.first_name,
        lastName: customerData?.last_name,
        fullName: `${customerData?.first_name || ''} ${customerData?.last_name || ''}`.trim(),
        phone: customerData?.phone,
        mobile: customerData?.mobile,
        email: customerData?.email,
        secondaryEmail: customerData?.secondary_email,
        billingAddress: customerData?.billing_address,
        city: customerData?.city,
        state: customerData?.state,
        zip: customerData?.zip,
        preferredContactMethod: customerData?.preferred_contact_method,
        notes: customerData?.notes,
      },
      property: {
        address: job?.property_address,
        city: job?.property_city,
        state: job?.property_state,
        zip: job?.property_zip,
        latitude: job?.property_latitude,
        longitude: job?.property_longitude,
        yearBuilt: job?.year_built,
        stories: job?.stories,
        squareFootage: job?.square_footage,
      },
      measurements: {
        totalRoofAreaSF: measurement?.roof_size ? measurement.roof_size * 100 : 0,
        totalRoofSquares: measurement?.roof_size,
        adjustedRoofSquares: measurement?.roof_size ? Math.ceil(measurement.roof_size * (1 + (measurement.waste_percentage || 0) / 100)) : 0,
        wastePercentage: measurement?.waste_percentage || 0,
        predominantPitch: measurement?.roof_pitch,
        ridgeLengthLF: measurement?.linear_feet,
        hipLengthLF: 0,
        valleyLengthLF: 0,
        eaveLengthLF: 0,
        rakeLengthLF: 0,
        flashingLengthLF: 0,
        gutterLengthLF: 0,
        downspoutCount: 0,
        pipeBootCount: measurement?.penetrations || 0,
        skylightCount: 0,
        ventCount: 0,
      },
      estimate: {
        estimateNumber: estimate?.estimate_number,
        status: estimate?.status,
        materialTotal: estimate?.material_cost || 0,
        laborTotal: estimate?.labor_cost || 0,
        taxTotal: estimate?.tax || 0,
        overhead: 0,
        profit: 0,
        discount: estimate?.discount || 0,
        finalTotal: estimate?.total || 0,
        createdDate: estimate?.created_date,
        expirationDate: estimate?.sent_date ? new Date(new Date(estimate.sent_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
        lineItems: estimate?.line_items || [],
      },
      insurance: {
        carrier: insurance?.insurance_carrier,
        claimNumber: insurance?.claim_number,
        dateOfLoss: insurance?.date_of_loss,
        adjuster: insurance?.adjuster_name,
        adjusterPhone: insurance?.adjuster_phone,
        adjusterEmail: insurance?.adjuster_email,
        acv: insurance?.acv_amount || 0,
        rcv: insurance?.rcv_amount || 0,
        depreciation: insurance?.depreciation_amount || 0,
        deductible: insurance?.deductible || 0,
        supplementAmount: 0,
      },
      production: {
        scheduleDate: production?.[0]?.due_date,
        materialDeliveryDate: null,
        startDate: production?.[0]?.start_date,
        completionDate: production?.[0]?.due_date,
        status: production?.[0]?.status,
        crew: crew?.map((c) => c.name).join(', '),
        notes: production?.[0]?.notes,
      },
      materials: {
        orderNumber: materials?.[0]?.order_number,
        supplier: materials?.[0]?.supplier,
        deliveryDate: materials?.[0]?.delivery_date,
        materialList: materials?.map((m) => `${m.material_name} (${m.quantity} ${m.unit_type})`).join('\n'),
        shingleType: materials?.find((m) => m.material_type === 'shingles')?.material_name,
        shingleColor: materials?.find((m) => m.material_type === 'shingles')?.color,
        quantity: materials?.reduce((sum, m) => sum + (m.quantity || 0), 0),
        cost: materials?.reduce((sum, m) => sum + (m.cost || 0), 0),
      },
      invoice: {
        invoiceNumber: invoice?.invoice_number,
        status: invoice?.status,
        total: invoice?.total || 0,
        balance: (invoice?.total || 0) - (invoice?.amount_paid || 0),
        depositAmount: invoice?.deposit_amount || 0,
        amountPaid: invoice?.amount_paid || 0,
        dueDate: invoice?.due_date,
        paymentHistory: paymentHistory?.length || 0,
      },
      warranty: {
        type: warranty?.[0]?.warranty_type,
        startDate: warranty?.[0]?.start_date,
        endDate: warranty?.[0]?.end_date,
        manufacturer: warranty?.[0]?.manufacturer,
        workmanshipYears: warranty?.[0]?.workmanship_years,
      },
      photos: {
        beforePhotos: photos?.filter((p) => p.photo_type === 'before')?.length || 0,
        progressPhotos: photos?.filter((p) => p.photo_type === 'progress')?.length || 0,
        afterPhotos: photos?.filter((p) => p.photo_type === 'after')?.length || 0,
        dronePhotos: photos?.filter((p) => p.photo_type === 'drone')?.length || 0,
      },
      changeOrders: changeOrders || [],
      documents: {
        contracts: [],
        estimates: estimates || [],
        invoices: invoices || [],
        warranties: warranty || [],
      },
    };

    return Response.json(smartData);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});