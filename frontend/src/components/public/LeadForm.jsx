import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Send, Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Only image files are allowed.';
  if (file.size > MAX_FILE_SIZE) return 'File must be under 10MB.';
  return null;
}

export default function LeadForm({ defaultService = '', compact = false }) {
  const mountedAt = useRef(Date.now());
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', address: '', city: '', state: 'TN', zip: '',
    service_needed: defaultService, project_type: '', insurance_claim: false, preferred_contact: 'phone', notes: '',
    property_type: 'residential', source: 'website', tcpaConsent: false,
  });
  const [photos, setPhotos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});

  const errors = {
    first_name: !form.first_name?.trim() ? 'First name is required' : null,
    last_name: !form.last_name?.trim() ? 'Last name is required' : null,
    phone: !form.phone
      ? 'Phone number is required'
      : !/^[\d\s\-()]{7,20}$/.test(form.phone)
      ? 'Enter a valid US phone number'
      : null,
    email: form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? 'Enter a valid email address'
      : null,
  };
  const isValid = !Object.values(errors).some(Boolean) && form.tcpaConsent;

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    const urls = [];
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        continue;
      }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        urls.push(file_url);
      } catch (uploadErr) {
        console.warn('Photo upload skipped — file storage not available yet.', uploadErr);
      }
    }
    setPhotos(prev => [...prev, ...urls]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Bot detection: forms submitted within 3s of mount are almost certainly bots
    const elapsedMs = Date.now() - mountedAt.current;
    if (elapsedMs < 3000) {
      // Silently "succeed" — bot thinks it worked, we don't store
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    try {
      if (!isValid) {
        setFieldErrors(errors);
        toast.error('Please fix the highlighted errors.');
        return;
      }

      const endpoint = import.meta.env.VITE_LEAD_API_URL;
      if (!endpoint) {
        console.error('VITE_LEAD_API_URL is not configured');
        toast.error('Form temporarily unavailable. Please call us at (865) 685-3649.');
        setSubmitting(false);
        return;
      }

      const payload = {
        name: `${form.first_name} ${form.last_name}`.trim(),
        email: form.email,
        phone: form.phone,
        service: form.service_needed,
        property_type: form.property_type,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        message: form.notes,
        source: form.source,
        tcpaConsent: form.tcpaConsent,
        photo_urls: photos,
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Submission failed (${res.status})`);
      }

      setSubmitted(true);
      toast.success("Your request has been submitted! We'll contact you shortly.");
    } catch (error) {
      console.error('Lead submission failed:', error);
      toast.error('Submission failed. Please try again or call (865) 685-ENIX.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-10 text-center border-0 shadow-lg">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="font-heading font-bold text-2xl mb-2">Thank You!</h3>
        <p className="text-muted-foreground">We've received your request and will contact you within 24 hours.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 border-0 shadow-lg">
      <h3 className="font-heading font-bold text-xl mb-6">Request Your Free Estimate</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <div>
            <Label>First Name *</Label>
            <Input maxLength={100} required value={form.first_name} onBlur={() => setTouched(prev => ({ ...prev, first_name: true }))} onChange={e => handleChange('first_name', e.target.value)} placeholder="John" disabled={submitting} />
            {touched.first_name && errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>
          <div>
            <Label>Last Name *</Label>
            <Input maxLength={100} required value={form.last_name} onBlur={() => setTouched(prev => ({ ...prev, last_name: true }))} onChange={e => handleChange('last_name', e.target.value)} placeholder="Smith" disabled={submitting} />
            {touched.last_name && errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>
          <div>
            <Label>Phone *</Label>
            <Input maxLength={20} required type="tel" value={form.phone} onBlur={() => setTouched(prev => ({ ...prev, phone: true }))} onChange={e => handleChange('phone', e.target.value)} placeholder="(865) 555-0123" disabled={submitting} />
            {touched.phone && errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input maxLength={254} type="email" value={form.email} onBlur={() => setTouched(prev => ({ ...prev, email: true }))} onChange={e => handleChange('email', e.target.value)} placeholder="john@email.com" disabled={submitting} />
            {touched.email && errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <Label>Property Address</Label>
          <Input maxLength={255} value={form.address} onChange={e => handleChange('address', e.target.value)} placeholder="123 Main St" disabled={submitting} />
        </div>

        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'}`}>
          <div>
            <Label>City</Label>
            <Input maxLength={100} value={form.city} onChange={e => handleChange('city', e.target.value)} placeholder="Knoxville" disabled={submitting} />
          </div>
          <div>
            <Label>State</Label>
            <Input maxLength={10} value={form.state} onChange={e => handleChange('state', e.target.value)} disabled={submitting} />
          </div>
          <div>
            <Label>ZIP</Label>
            <Input maxLength={10} value={form.zip} onChange={e => handleChange('zip', e.target.value)} placeholder="37901" disabled={submitting} />
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <div>
            <Label>Service Needed</Label>
            <Select value={form.service_needed} onValueChange={v => handleChange('service_needed', v)} disabled={submitting}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="residential_roofing">Residential Roofing</SelectItem>
                <SelectItem value="commercial_roofing">Commercial Roofing</SelectItem>
                <SelectItem value="roof_repair">Roof Repair</SelectItem>
                <SelectItem value="siding">Siding</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="doors">Doors</SelectItem>
                <SelectItem value="storm_damage">Storm Damage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Project Type</Label>
            <Select value={form.project_type} onValueChange={v => handleChange('project_type', v)} disabled={submitting}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new_installation">New Installation</SelectItem>
                <SelectItem value="replacement">Replacement</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="insurance_claim">Insurance Claim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
          <div>
            <Label>Preferred Contact Method</Label>
            <Select value={form.preferred_contact} onValueChange={v => handleChange('preferred_contact', v)} disabled={submitting}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-3 pb-1">
            <Switch checked={form.insurance_claim} onCheckedChange={v => handleChange('insurance_claim', v)} disabled={submitting} />
            <Label>This is an insurance claim</Label>
          </div>
        </div>

        <div>
          <Label>Upload Photos</Label>
          <div className="mt-1">
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload photos of your property</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={submitting} />
            </label>
            {photos.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {photos.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-16 h-16 rounded-md object-cover" />
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <Label>Additional Notes</Label>
          <Textarea maxLength={2000} value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Tell us more about your project..." rows={3} disabled={submitting} />
        </div>

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="tcpa-consent"
            required
            checked={form.tcpaConsent}
            onChange={(e) => handleChange('tcpaConsent', e.target.checked)}
            className="mt-1"
            disabled={submitting}
          />
          <label htmlFor="tcpa-consent" className="text-sm text-muted-foreground">
            I agree to be contacted by Enix Exteriors regarding my inquiry. View our <a href="/privacy-policy" className="underline">Privacy Policy</a>.
          </label>
        </div>

        <Button type="submit" disabled={submitting || !isValid} className="w-full bg-navy-500 hover:bg-navy-600 text-white font-heading font-bold h-12">
          {submitting ? 'Submitting...' : 'Submit Request'}
          <Send className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </Card>
  );
}