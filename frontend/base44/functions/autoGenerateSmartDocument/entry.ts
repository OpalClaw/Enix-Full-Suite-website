import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, documentType } = await req.json();

    if (!jobId || !documentType) {
      return Response.json({ error: 'jobId and documentType required' }, { status: 400 });
    }

    // Get job smart data
    const smartData = await base44.functions.invoke('getJobSmartData', { jobId });

    // Get or create template for document type
    const templates = await base44.entities.DocumentTemplate.filter({ template_type: documentType, is_active: true });
    const template = templates[0];

    if (!template) {
      return Response.json({ error: `No template found for type: ${documentType}` }, { status: 404 });
    }

    // Generate document content from template
    const content = JSON.parse(JSON.stringify(template.content)); // Deep clone

    // Auto-generate content based on document type
    if (documentType === 'contract') {
      content.blocks = content.blocks || [];
      content.blocks.push({
        id: 'auto-1',
        type: 'heading',
        text: 'Roofing Services Agreement',
        level: 1,
      });
      content.blocks.push({
        id: 'auto-2',
        type: 'text',
        text: `This Agreement is entered into as of {{job.createdDate}} between {{customer.fullName}} ("Customer") and the Company, regarding roofing services at {{property.address}}, {{property.city}}, {{property.state}} {{property.zip}}.`,
      });
      content.blocks.push({
        id: 'auto-3',
        type: 'heading',
        text: 'Scope of Work',
        level: 2,
      });
      content.blocks.push({
        id: 'auto-4',
        type: 'text',
        text: `Total Roof Area: {{measurements.totalRoofSquares}} squares
Roof Pitch: {{measurements.predominantPitch}}
Waste Factor: {{measurements.wastePercentage}}%`,
      });
      content.blocks.push({
        id: 'auto-5',
        type: 'heading',
        text: 'Project Terms',
        level: 2,
      });
      content.blocks.push({
        id: 'auto-6',
        type: 'text',
        text: `Contract Amount: {{estimate.finalTotal}}
Material Type: {{materials.shingleType}}
Start Date: {{job.startDate}}
Expected Completion: {{job.completionDate}}`,
      });
    } else if (documentType === 'proposal') {
      content.blocks = content.blocks || [];
      content.blocks.push({
        id: 'auto-1',
        type: 'heading',
        text: `Project Proposal - {{property.address}}`,
        level: 1,
      });
      content.blocks.push({
        id: 'auto-2',
        type: 'text',
        text: `Prepared for: {{customer.fullName}}
Date: {{job.createdDate}}
Project: {{job.jobName}}`,
      });
      content.blocks.push({
        id: 'auto-3',
        type: 'heading',
        text: 'Project Scope',
        level: 2,
      });
      content.blocks.push({
        id: 'auto-4',
        type: 'text',
        text: `Property Address: {{property.address}}, {{property.city}}, {{property.state}} {{property.zip}}
Total Roof Area: {{measurements.totalRoofSquares}} squares
Proposed Material: {{materials.shingleType}} - {{materials.shingleColor}}`,
      });
      content.blocks.push({
        id: 'auto-5',
        type: 'heading',
        text: 'Investment',
        level: 2,
      });
      content.blocks.push({
        id: 'auto-6',
        type: 'text',
        text: `Materials: {{estimate.materialTotal}}
Labor: {{estimate.laborTotal}}
Tax: {{estimate.taxTotal}}
Total Project Cost: {{estimate.finalTotal}}`,
      });
    } else if (documentType === 'estimate') {
      content.blocks = content.blocks || [];
      content.blocks.push({
        id: 'auto-1',
        type: 'heading',
        text: `Estimate #{{estimate.estimateNumber}}`,
        level: 1,
      });
      content.blocks.push({
        id: 'auto-2',
        type: 'text',
        text: `Customer: {{customer.fullName}}
Contact: {{customer.email}} | {{customer.phone}}
Property: {{property.address}}, {{property.city}}, {{property.state}} {{property.zip}}`,
      });
      content.blocks.push({
        id: 'auto-3',
        type: 'text',
        text: `Roof Size: {{measurements.totalRoofSquares}} squares
Pitch: {{measurements.predominantPitch}}
Date Created: {{estimate.createdDate}}`,
      });
    } else if (documentType === 'warranty') {
      content.blocks = content.blocks || [];
      content.blocks.push({
        id: 'auto-1',
        type: 'heading',
        text: 'Warranty Certificate',
        level: 1,
      });
      content.blocks.push({
        id: 'auto-2',
        type: 'text',
        text: `Property Owner: {{customer.fullName}}
Property Address: {{property.address}}, {{property.city}}, {{property.state}} {{property.zip}}
Project Date: {{job.completionDate}}`,
      });
      content.blocks.push({
        id: 'auto-3',
        type: 'text',
        text: `Warranty Type: {{warranty.type}}
Manufacturer: {{warranty.manufacturer}}
Start Date: {{warranty.startDate}}
End Date: {{warranty.endDate}}
Workmanship Coverage: {{warranty.workmanshipYears}} years`,
      });
    } else if (documentType === 'change_order') {
      content.blocks = content.blocks || [];
      content.blocks.push({
        id: 'auto-1',
        type: 'heading',
        text: 'Change Order',
        level: 1,
      });
      content.blocks.push({
        id: 'auto-2',
        type: 'text',
        text: `Job: {{job.jobNumber}} - {{property.address}}
Customer: {{customer.fullName}}
Date: {{job.createdDate}}`,
      });
    }

    // Create the smart document
    const doc = await base44.entities.SmartDocument.create({
      document_name: `${documentType.toUpperCase()} - {{property.address}}`,
      document_type: documentType,
      status: 'draft',
      job_id: jobId,
      template_id: template.id,
      content,
      merge_fields: template.merge_fields || [],
    });

    return Response.json({
      success: true,
      documentId: doc.id,
      message: `${documentType} document auto-generated successfully`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});