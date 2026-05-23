// Smart Document Field Engine
// Handles merge field detection, replacement, and live data binding

export const SMART_FIELD_CATEGORIES = {
  customer: {
    label: 'Customer',
    icon: 'User',
    fields: [
      { key: 'customer.fullName', label: 'Full Name', description: 'Customer full name' },
      { key: 'customer.firstName', label: 'First Name', description: 'Customer first name' },
      { key: 'customer.lastName', label: 'Last Name', description: 'Customer last name' },
      { key: 'customer.phone', label: 'Phone', description: 'Primary phone number' },
      { key: 'customer.mobile', label: 'Mobile', description: 'Mobile phone number' },
      { key: 'customer.email', label: 'Email', description: 'Email address' },
      { key: 'customer.billingAddress', label: 'Billing Address', description: 'Billing address' },
      { key: 'customer.city', label: 'City', description: 'City' },
      { key: 'customer.state', label: 'State', description: 'State' },
      { key: 'customer.zip', label: 'ZIP Code', description: 'ZIP code' },
    ],
  },
  job: {
    label: 'Job',
    icon: 'Briefcase',
    fields: [
      { key: 'job.jobNumber', label: 'Job Number', description: 'Job number/ID' },
      { key: 'job.jobName', label: 'Job Name', description: 'Job name' },
      { key: 'job.jobStatus', label: 'Job Status', description: 'Current job status' },
      { key: 'job.createdDate', label: 'Created Date', description: 'Job creation date' },
      { key: 'job.startDate', label: 'Start Date', description: 'Project start date' },
      { key: 'job.completionDate', label: 'Completion Date', description: 'Expected completion date' },
      { key: 'job.salesRep', label: 'Sales Rep', description: 'Assigned sales representative' },
      { key: 'job.projectManager', label: 'Project Manager', description: 'Assigned project manager' },
      { key: 'job.assignedCrew', label: 'Assigned Crew', description: 'Crew assigned to job' },
    ],
  },
  property: {
    label: 'Property',
    icon: 'Home',
    fields: [
      { key: 'property.address', label: 'Address', description: 'Property address' },
      { key: 'property.city', label: 'City', description: 'Property city' },
      { key: 'property.state', label: 'State', description: 'Property state' },
      { key: 'property.zip', label: 'ZIP Code', description: 'Property ZIP code' },
      { key: 'property.yearBuilt', label: 'Year Built', description: 'Year property was built' },
      { key: 'property.stories', label: 'Stories', description: 'Number of stories' },
      { key: 'property.squareFootage', label: 'Square Footage', description: 'Total square footage' },
    ],
  },
  measurements: {
    label: 'Measurements',
    icon: 'Ruler',
    fields: [
      { key: 'measurements.totalRoofSquares', label: 'Total Roof Squares', description: 'Total roof area in squares' },
      { key: 'measurements.adjustedRoofSquares', label: 'Adjusted Roof Squares', description: 'Roof squares including waste' },
      { key: 'measurements.wastePercentage', label: 'Waste %', description: 'Waste percentage' },
      { key: 'measurements.predominantPitch', label: 'Roof Pitch', description: 'Predominant roof pitch' },
      { key: 'measurements.ridgeLengthLF', label: 'Ridge Length (LF)', description: 'Ridge length in linear feet' },
      { key: 'measurements.pipeBootCount', label: 'Penetrations', description: 'Number of penetrations' },
    ],
  },
  estimate: {
    label: 'Estimate',
    icon: 'FileText',
    fields: [
      { key: 'estimate.estimateNumber', label: 'Estimate #', description: 'Estimate number' },
      { key: 'estimate.status', label: 'Status', description: 'Estimate status' },
      { key: 'estimate.materialTotal', label: 'Material Total', description: 'Total material cost', format: 'currency' },
      { key: 'estimate.laborTotal', label: 'Labor Total', description: 'Total labor cost', format: 'currency' },
      { key: 'estimate.taxTotal', label: 'Tax Total', description: 'Total tax', format: 'currency' },
      { key: 'estimate.discount', label: 'Discount', description: 'Discount amount', format: 'currency' },
      { key: 'estimate.finalTotal', label: 'Final Total', description: 'Final estimate total', format: 'currency' },
      { key: 'estimate.createdDate', label: 'Created Date', description: 'Estimate creation date' },
      { key: 'estimate.expirationDate', label: 'Expiration Date', description: 'Estimate expiration date' },
    ],
  },
  insurance: {
    label: 'Insurance',
    icon: 'Shield',
    fields: [
      { key: 'insurance.carrier', label: 'Carrier', description: 'Insurance carrier name' },
      { key: 'insurance.claimNumber', label: 'Claim #', description: 'Insurance claim number' },
      { key: 'insurance.dateOfLoss', label: 'Date of Loss', description: 'Date of loss' },
      { key: 'insurance.adjuster', label: 'Adjuster', description: 'Adjuster name' },
      { key: 'insurance.adjusterPhone', label: 'Adjuster Phone', description: 'Adjuster phone' },
      { key: 'insurance.acv', label: 'ACV', description: 'Actual cash value', format: 'currency' },
      { key: 'insurance.rcv', label: 'RCV', description: 'Replacement cost value', format: 'currency' },
      { key: 'insurance.deductible', label: 'Deductible', description: 'Insurance deductible', format: 'currency' },
    ],
  },
  production: {
    label: 'Production',
    icon: 'Wrench',
    fields: [
      { key: 'production.scheduleDate', label: 'Scheduled Date', description: 'Production start date' },
      { key: 'production.startDate', label: 'Start Date', description: 'Actual start date' },
      { key: 'production.completionDate', label: 'Completion Date', description: 'Expected completion date' },
      { key: 'production.status', label: 'Status', description: 'Production status' },
      { key: 'production.crew', label: 'Crew', description: 'Assigned crew' },
      { key: 'production.notes', label: 'Notes', description: 'Production notes' },
    ],
  },
  materials: {
    label: 'Materials',
    icon: 'Box',
    fields: [
      { key: 'materials.shingleType', label: 'Shingle Type', description: 'Shingle product type' },
      { key: 'materials.shingleColor', label: 'Shingle Color', description: 'Shingle color' },
      { key: 'materials.supplier', label: 'Supplier', description: 'Material supplier' },
      { key: 'materials.deliveryDate', label: 'Delivery Date', description: 'Delivery date' },
      { key: 'materials.cost', label: 'Total Cost', description: 'Total material cost', format: 'currency' },
    ],
  },
  invoice: {
    label: 'Invoice',
    icon: 'DollarSign',
    fields: [
      { key: 'invoice.invoiceNumber', label: 'Invoice #', description: 'Invoice number' },
      { key: 'invoice.status', label: 'Status', description: 'Invoice status' },
      { key: 'invoice.total', label: 'Total', description: 'Invoice total', format: 'currency' },
      { key: 'invoice.balance', label: 'Balance Due', description: 'Amount due', format: 'currency' },
      { key: 'invoice.amountPaid', label: 'Amount Paid', description: 'Amount paid to date', format: 'currency' },
      { key: 'invoice.dueDate', label: 'Due Date', description: 'Payment due date' },
    ],
  },
  warranty: {
    label: 'Warranty',
    icon: 'CheckCircle',
    fields: [
      { key: 'warranty.type', label: 'Type', description: 'Warranty type' },
      { key: 'warranty.startDate', label: 'Start Date', description: 'Warranty start date' },
      { key: 'warranty.endDate', label: 'End Date', description: 'Warranty end date' },
      { key: 'warranty.manufacturer', label: 'Manufacturer', description: 'Manufacturer name' },
      { key: 'warranty.workmanshipYears', label: 'Workmanship Years', description: 'Workmanship warranty years' },
    ],
  },
};

// Extract all merge fields from text
export function extractMergeFields(text) {
  const regex = /\{\{([a-zA-Z0-9_.]+)\}\}/g;
  const fields = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    fields.add(match[1]);
  }
  return Array.from(fields);
}

// Get available fields for a category
export function getFieldsForCategory(category) {
  return SMART_FIELD_CATEGORIES[category]?.fields || [];
}

// Replace merge fields with actual values
export function replaceMergeFields(text, data) {
  if (!text) return text;
  return text.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (match, fieldKey) => {
    const value = getNestedValue(data, fieldKey);
    return value !== undefined ? formatFieldValue(value, fieldKey) : match;
  });
}

// Get nested value from object using dot notation
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

// Format field value based on type
function formatFieldValue(value, fieldKey) {
  if (value === null || value === undefined) return '';

  // Currency fields
  if (fieldKey.includes('Total') || fieldKey.includes('Cost') || fieldKey.includes('Amount') || fieldKey.includes('Price') || fieldKey.includes('Balance') || fieldKey.includes('acv') || fieldKey.includes('rcv') || fieldKey.includes('deductible')) {
    return typeof value === 'number' ? `$${value.toFixed(2)}` : value;
  }

  // Date fields
  if (fieldKey.includes('Date')) {
    try {
      return new Date(value).toLocaleDateString('en-US');
    } catch {
      return value;
    }
  }

  return String(value);
}

// Check if a field exists in data
export function fieldExists(data, fieldKey) {
  return getNestedValue(data, fieldKey) !== undefined;
}

// Filter available fields based on what exists in data
export function getAvailableFields(data) {
  const available = {};
  Object.entries(SMART_FIELD_CATEGORIES).forEach(([category, config]) => {
    available[category] = config.fields.filter(field => fieldExists(data, field.key));
  });
  return available;
}

// Build dynamic merge field map for document
export function buildFieldMap(documentContent, data) {
  const fields = extractMergeFields(JSON.stringify(documentContent));
  const fieldMap = {};
  fields.forEach(field => {
    fieldMap[field] = getNestedValue(data, field);
  });
  return fieldMap;
}