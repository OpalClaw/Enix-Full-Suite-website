import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all jobs
    const jobs = await base44.asServiceRole.entities.Job.list('', 1000);
    let updatedCount = 0;
    const currentYear = new Date().getFullYear();

    // Generate YYYY-XXX job numbers for jobs that don't have them
    for (const job of jobs) {
      if (!job.job_number) {
        // Generate a number in YYYY-XXX format (year + 3-digit sequence)
        const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const jobNumber = `${currentYear}${sequence}`;
        
        await base44.asServiceRole.entities.Job.update(job.id, {
          job_number: jobNumber
        });
        
        updatedCount++;
      }
    }

    return Response.json({
      success: true,
      message: `Generated job numbers for ${updatedCount} jobs`,
      updatedCount
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});