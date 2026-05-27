import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const EMPTY = {
  name: '',
  legal_name: '',
  license_number: '',
  ein: '',
  phone: '',
  email: '',
  website: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  zip: '',
  tagline: '',
  default_terms: '',
};

export default function CompanyProfilePanel() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [dirty, setDirty] = useState(false);

  const { data: company, isLoading } = useQuery({
    queryKey: ['settings', 'company'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSettings');
      const items = res?.data?.items ?? res?.data ?? {};
      return items.company?.value ?? null;
    },
  });

  useEffect(() => {
    if (company) {
      setForm((prev) => ({ ...EMPTY, ...company }));
      setDirty(false);
    }
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('updateSetting', { key: 'company', value: form }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Company profile saved');
      setDirty(false);
    },
    onError: (e) => toast.error(e?.message || 'Failed to save'),
  });

  const update = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading company profile…
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle>Company profile</CardTitle>
        <p className="text-sm text-muted-foreground">
          Used on estimates, invoices, contracts, and email signatures.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
        >
          {[
            ['name', 'Business name'],
            ['legal_name', 'Legal name'],
            ['license_number', 'License #'],
            ['ein', 'EIN'],
            ['phone', 'Phone'],
            ['email', 'Email'],
            ['website', 'Website'],
            ['address_line1', 'Address line 1'],
            ['address_line2', 'Address line 2'],
            ['city', 'City'],
            ['state', 'State'],
            ['zip', 'ZIP'],
            ['tagline', 'Tagline'],
          ].map(([k, label]) => (
            <div key={k} className="space-y-1">
              <Label htmlFor={`company-${k}`}>{label}</Label>
              <Input
                id={`company-${k}`}
                value={form[k] || ''}
                onChange={(e) => update(k, e.target.value)}
              />
            </div>
          ))}
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="company-default-terms">Default contract / invoice terms</Label>
            <Textarea
              id="company-default-terms"
              value={form.default_terms || ''}
              onChange={(e) => update('default_terms', e.target.value)}
              rows={6}
            />
          </div>
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button type="submit" disabled={!dirty || saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…
                </>
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
