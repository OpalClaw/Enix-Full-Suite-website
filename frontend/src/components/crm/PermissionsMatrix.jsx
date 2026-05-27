import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShieldCheck, Loader2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

// Roles that can have configurable permissions. `admin` is always full access.
const ROLES = [
  { value: 'manager', label: 'Manager' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'estimator', label: 'Estimator' },
  { value: 'project_lead', label: 'Project Lead' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'office', label: 'Office' },
  { value: 'office_staff', label: 'Office Staff' },
  { value: 'crew_lead', label: 'Crew Lead' },
  { value: 'crew', label: 'Crew' },
  { value: 'subcontractor', label: 'Subcontractor' },
  { value: 'client', label: 'Client (portal)' },
];

const MODULES = [
  { key: 'customers', label: 'Customers' },
  { key: 'leads', label: 'Leads' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'estimates', label: 'Estimates' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'contracts', label: 'Contracts' },
  { key: 'inspections', label: 'Inspections' },
  { key: 'warranties', label: 'Warranties' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'messages', label: 'Messages' },
  { key: 'materials', label: 'Materials' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
];

const LEVELS = [
  { value: 'none', label: 'No access' },
  { value: 'view', label: 'View only' },
  { value: 'edit', label: 'View + edit' },
  { value: 'manage', label: 'Full (incl. delete)' },
];

const DEFAULTS = {
  manager: 'manage',
  sales_rep: 'edit',
  estimator: 'edit',
  project_lead: 'edit',
  project_manager: 'manage',
  production_manager: 'edit',
  office: 'edit',
  office_staff: 'edit',
  crew_lead: 'view',
  crew: 'view',
  subcontractor: 'view',
  client: 'none',
};

function defaultMatrixForRole(role) {
  const lvl = DEFAULTS[role] ?? 'none';
  return Object.fromEntries(MODULES.map((m) => [m.key, lvl]));
}

function defaultMatrix() {
  return Object.fromEntries(ROLES.map((r) => [r.value, defaultMatrixForRole(r.value)]));
}

function normalizeMatrix(value) {
  const base = defaultMatrix();
  if (!value || typeof value !== 'object') return base;
  for (const role of Object.keys(base)) {
    if (value[role] && typeof value[role] === 'object') {
      for (const key of Object.keys(base[role])) {
        const v = value[role][key];
        if (typeof v === 'string' && LEVELS.some((l) => l.value === v)) {
          base[role][key] = v;
        }
      }
    }
  }
  return base;
}

export default function PermissionsMatrix() {
  const queryClient = useQueryClient();
  const [matrix, setMatrix] = useState(defaultMatrix());
  const [dirty, setDirty] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings', 'roles.permissions'],
    queryFn: async () => {
      const all = await base44.functions.invoke('getSettings');
      const items = all?.data?.items ?? all?.items ?? [];
      const row = items.find((i) => i.key === 'roles.permissions');
      return row?.value ?? {};
    },
  });

  useEffect(() => {
    if (settings !== undefined) {
      setMatrix(normalizeMatrix(settings));
      setDirty(false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      base44.functions.invoke('updateSetting', {
        key: 'roles.permissions',
        value: matrix,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'roles.permissions'] });
      setDirty(false);
      toast.success('Permissions saved');
    },
    onError: (e) => toast.error(e?.message || 'Failed to save permissions'),
  });

  function setCell(role, moduleKey, value) {
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [moduleKey]: value },
    }));
    setDirty(true);
  }

  function setRowAll(role, value) {
    setMatrix((prev) => ({
      ...prev,
      [role]: Object.fromEntries(MODULES.map((m) => [m.key, value])),
    }));
    setDirty(true);
  }

  function resetToDefaults() {
    setMatrix(defaultMatrix());
    setDirty(true);
  }

  const stats = useMemo(() => {
    let restricted = 0;
    for (const role of Object.keys(matrix)) {
      for (const key of Object.keys(matrix[role])) {
        if (matrix[role][key] !== 'manage') restricted++;
      }
    }
    return { restricted };
  }, [matrix]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Permissions matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set what each role can see and do. Admins always have full access and are not listed here.
            {' '}{stats.restricted} restriction{stats.restricted === 1 ? '' : 's'} configured.
          </p>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-2 px-3 sticky left-0 bg-muted/50 z-10 font-semibold">Role</th>
                  {MODULES.map((m) => (
                    <th key={m.key} className="text-left py-2 px-2 font-medium whitespace-nowrap">
                      {m.label}
                    </th>
                  ))}
                  <th className="text-right py-2 px-3 font-medium">Bulk</th>
                </tr>
              </thead>
              <tbody>
                {ROLES.map((role) => (
                  <tr key={role.value} className="border-t">
                    <td className="py-2 px-3 sticky left-0 bg-background z-10 font-semibold whitespace-nowrap">
                      {role.label}
                    </td>
                    {MODULES.map((m) => (
                      <td key={m.key} className="py-2 px-2 min-w-[140px]">
                        <Select
                          value={matrix[role.value]?.[m.key] ?? 'none'}
                          onValueChange={(v) => setCell(role.value, m.key, v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEVELS.map((lvl) => (
                              <SelectItem key={lvl.value} value={lvl.value} className="text-xs">
                                {lvl.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    ))}
                    <td className="py-2 px-3 text-right">
                      <Select onValueChange={(v) => setRowAll(role.value, v)}>
                        <SelectTrigger className="h-8 text-xs w-36">
                          <SelectValue placeholder="Set all…" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((lvl) => (
                            <SelectItem key={lvl.value} value={lvl.value} className="text-xs">
                              {lvl.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 justify-between">
            <Button variant="outline" onClick={resetToDefaults}>
              <Undo2 className="w-4 h-4 mr-2" /> Reset to defaults
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save permissions
            </Button>
          </div>

          <div className="text-xs text-muted-foreground border-t pt-3">
            Stored in <code>app_settings.roles.permissions</code>. The backend honors these in
            future releases as the role guards are wired through each route. The matrix is
            already used by the frontend to gate UI controls today.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
