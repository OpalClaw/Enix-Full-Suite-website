import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { PDFDocument, rgb } from 'npm:pdf-lib@1.12.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentUrl, fieldPositions, smartFields, jobData } = await req.json();

    if (!documentUrl || !fieldPositions || !smartFields) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const pdfResponse = await fetch(documentUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.statusText}`);
    }
    const pdfBytes = await pdfResponse.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();

    const SMART_FIELDS = [
      { key: 'customer_name', label: 'Customer Name' },
      { key: 'customer_email', label: 'Customer Email' },
      { key: 'customer_phone', label: 'Customer Phone' },
      { key: 'property_address', label: 'Property Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'zip', label: 'ZIP Code' },
      { key: 'job_number', label: 'Job Number' },
      { key: 'service_type', label: 'Service Type' },
      { key: 'contract_amount', label: 'Contract Amount' },
      { key: 'estimate_amount', label: 'Estimate Amount' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'completion_date', label: 'Completion Date' },
    ];

    Object.entries(fieldPositions).forEach(([fieldKey, position]) => {
      if (smartFields[fieldKey] && pages.length > 0) {
        const value = jobData[fieldKey];
        const displayValue = value !== null && value !== undefined ? String(value) : `[${SMART_FIELDS.find(f => f.key === fieldKey)?.label || fieldKey}]`;

        const firstPage = pages[0];
        firstPage.drawText(displayValue, {
          x: position.x,
          y: firstPage.getHeight() - position.y - 12,
          size: 11,
          color: rgb(0, 51, 102),
        });
      }
    });

    const modifiedPdfBytes = await pdfDoc.save();
    const uploadRes = await base44.integrations.Core.UploadFile({ file: modifiedPdfBytes });

    return Response.json({ file_url: uploadRes.file_url });
  } catch (error: any) {
    console.error('generateSmartPDF error:', error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});