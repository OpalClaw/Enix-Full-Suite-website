import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { jobNumber } = await req.json();

    if (!jobNumber) {
      return Response.json({ error: 'Job number required' }, { status: 400 });
    }

    // Find job by job number
    const jobs = await base44.asServiceRole.entities.Job.filter({
      job_number: String(jobNumber)
    }, '', 1);

    if (!jobs || jobs.length === 0) {
      return Response.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = jobs[0];
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.email.toLowerCase() !== job.customer_email?.toLowerCase()) {
      return Response.json(
        { error: 'Access denied: job does not belong to this account' },
        { status: 403 }
      );
    }

    await base44.auth.updateMe({ role: 'Client' });

    // Return job info for client portal setup
    return Response.json({
      success: true,
      jobId: job.id,
      jobNumber: job.job_number,
      customerName: job.customer_name,
      customerEmail: job.customer_email,
      propertyAddress: job.property_address
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});