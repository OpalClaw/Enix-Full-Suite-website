import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Single source of truth for which integrations + fields we expose.
// Sensitive fields (api_key, secret, etc.) are returned masked by the
// backend; the UI lets admins overwrite without ever seeing the raw value.
const INTEGRATIONS = [
  {
    key: 'twilio',
    name: 'Twilio (SMS & Voice)',
    description:
      'Drives the Messages tab and customer SMS. Account SID + auth token + sending number.',
    fields: [
      { name: 'account_sid', label: 'Account SID', placeholder: 'AC…' },
      { name: 'auth_token', label: 'Auth token', secret: true },
      { name: 'from_number', label: 'From number', placeholder: '+15551234567' },
      { name: 'messaging_service_sid', label: 'Messaging service SID (optional)' },
    ],
  },
  {
    key: 'docusign',
    name: 'DocuSign',
    description:
      'Powers contract & SmartDoc signature flows via JWT-grant auth + Connect webhooks.',
    fields: [
      { name: 'integration_key', label: 'Integration key (client ID)' },
      { name: 'user_id', label: 'API user ID (GUID)' },
      { name: 'account_id', label: 'Account ID' },
      { name: 'base_path', label: 'Base path', placeholder: 'https://account.docusign.com' },
      { name: 'private_key', label: 'RSA private key', secret: true, multiline: true },
      { name: 'webhook_secret', label: 'Connect HMAC secret', secret: true },
    ],
  },
  {
    key: 'smtp',
    name: 'Email (SMTP)',
    description: 'Outbound transactional email — invites, notifications, customer comms.',
    fields: [
      { name: 'host', label: 'Host', placeholder: 'smtp.sendgrid.net' },
      { name: 'port', label: 'Port', placeholder: '587' },
      { name: 'username', label: 'Username' },
      { name: 'password', label: 'Password', secret: true },
      { name: 'from_address', label: 'From address', placeholder: 'no-reply@enixexteriors.com' },
      { name: 'from_name', label: 'From name', placeholder: 'Enix Exteriors' },
    ],
  },
  {
    key: 'eagleview',
    name: 'EagleView',
    description: 'Roof measurement reports. OAuth2 client-credentials.',
    fields: [
      { name: 'client_id', label: 'Client ID' },
      { name: 'client_secret', label: 'Client secret', secret: true },
      { name: 'base_url', label: 'Base URL', placeholder: 'https://api.eagleview.com' },
    ],
  },
  {
    key: 'quickbooks',
    name: 'QuickBooks Online',
    description: 'Two-way invoice sync. OAuth2 with refresh-token rotation.',
    fields: [
      { name: 'client_id', label: 'Client ID' },
      { name: 'client_secret', label: 'Client secret', secret: true },
      { name: 'realm_id', label: 'Realm ID (Company ID)' },
      { name: 'refresh_token', label: 'Refresh token', secret: true },
      {
        name: 'environment',
        label: 'Environment',
        placeholder: 'sandbox or production',
      },
    ],
  },
  {
    key: 'abc_supply',
    name: 'ABC Supply / ABC Roofing',
    description: 'Material catalog + order placement. Partner API key + account number.',
    fields: [
      { name: 'api_key', label: 'API key', secret: true },
      { name: 'account_number', label: 'Account number' },
      { name: 'base_url', label: 'Base URL', placeholder: 'https://api.abcsupply.com/v1' },
    ],
  },
];

function IntegrationCard({ integration, settings, onSave, onTest, saving, testing }) {
  const initial = settings?.[integration.key]?.value ?? {};
  const enabled = !!initial?.enabled;
  const status = settings?.[integration.key]?.status ?? (enabled ? 'configured' : 'inactive');

  const [form, setForm] = useState({ ...initial });
  const [dirty, setDirty] = useState(false);

  const update = (k, v) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setDirty(true);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">{integration.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {status === 'configured' && (
              <Badge className="bg-green-100 text-green-700 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Configured
              </Badge>
            )}
            {status === 'inactive' && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="w-3 h-3" /> Inactive
              </Badge>
            )}
            <Switch
              checked={!!form.enabled}
              onCheckedChange={(v) => update('enabled', v)}
              aria-label="Enable integration"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {integration.fields.map((f) => {
          const id = `${integration.key}-${f.name}`;
          const value = form[f.name] ?? '';
          const masked = typeof value === 'string' && value.startsWith('***');
          if (f.multiline) {
            return (
              <div key={f.name} className="md:col-span-2 space-y-1">
                <Label htmlFor={id}>{f.label}</Label>
                <textarea
                  id={id}
                  className="w-full text-sm font-mono border rounded p-2 min-h-32 bg-background"
                  value={masked ? '' : value}
                  placeholder={masked ? '•••• (set — overwrite to change)' : f.placeholder || ''}
                  onChange={(e) => update(f.name, e.target.value)}
                />
              </div>
            );
          }
          return (
            <div key={f.name} className="space-y-1">
              <Label htmlFor={id}>{f.label}</Label>
              <Input
                id={id}
                type={f.secret ? 'password' : 'text'}
                value={masked ? '' : value}
                placeholder={masked ? '•••• (set — overwrite to change)' : f.placeholder || ''}
                onChange={(e) => update(f.name, e.target.value)}
                autoComplete="off"
              />
            </div>
          );
        })}
        <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={!enabled || testing}
            onClick={() => onTest(integration.key)}
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Test connection
          </Button>
          <Button
            type="button"
            disabled={!dirty || saving}
            onClick={() => onSave(integration.key, form)}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPanel() {
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState(null);
  const [testingKey, setTestingKey] = useState(null);

  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await base44.functions.invoke('getSettings');
      return res?.data?.items ?? res?.data ?? {};
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value }) =>
      base44.functions.invoke('updateSetting', { key, value }),
    onMutate: ({ key }) => setSavingKey(key),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Integration saved');
    },
    onError: (e) => toast.error(e?.message || 'Failed to save'),
    onSettled: () => setSavingKey(null),
  });

  const testMutation = useMutation({
    mutationFn: (integration) =>
      base44.functions.invoke('testIntegration', { integration }),
    onMutate: (integration) => setTestingKey(integration),
    onSuccess: (res) => {
      const ok = res?.data?.ok;
      if (ok) toast.success(res?.data?.message || 'Connection successful');
      else toast.error(res?.data?.message || 'Connection failed');
    },
    onError: (e) => toast.error(e?.message || 'Test failed'),
    onSettled: () => setTestingKey(null),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-xl">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Credentials are encrypted at rest. Sensitive fields are masked on read — leave them
          blank to keep the existing value.
        </p>
      </div>
      <div className="grid gap-4">
        {INTEGRATIONS.map((integration) => (
          <IntegrationCard
            key={integration.key}
            integration={integration}
            settings={settings}
            saving={savingKey === integration.key}
            testing={testingKey === integration.key}
            onSave={(key, value) => saveMutation.mutate({ key, value })}
            onTest={(key) => testMutation.mutate(key)}
          />
        ))}
      </div>
    </div>
  );
}
