import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Mail,
  Loader2,
  Pencil,
  KeyRound,
  Power,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

const EMPLOYEE_ROLES = [
  { value: 'admin', label: 'Admin' },
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

const ROLE_LABEL = Object.fromEntries(EMPLOYEE_ROLES.map((r) => [r.value, r.label]));

const EMPTY_FORM = {
  email: '',
  full_name: '',
  role: 'sales_rep',
  title: '',
  phone: '',
  company: '',
  assigned_territory: '',
  password: '',
  send_invite: false,
};

const EMPTY_EDIT = {
  full_name: '',
  role: 'sales_rep',
  title: '',
  phone: '',
  company: '',
  assigned_territory: '',
  active: true,
};

function generatePassword(length = 14) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < length; i++) out += charset[arr[i] % charset.length];
  return out + '!2A';
}

export default function EmployeeManagement() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [showPw, setShowPw] = useState(false);
  const [credentialsToCopy, setCredentialsToCopy] = useState(null);

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);

  const [pwTarget, setPwTarget] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [pwShow, setPwShow] = useState(false);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list('-created_at', 200),
  });

  const inviteMutation = useMutation({
    mutationFn: (payload) => base44.functions.invoke('inviteEmployee', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      const data = res?.data ?? res;
      if (data?.email_skipped) {
        toast.success('Employee created');
      } else if (data?.email_delivered) {
        toast.success('Employee invited — invitation email sent');
      } else {
        toast.message('Employee created — SMTP unavailable, share these credentials manually');
      }
      if (data?.temp_password) {
        setCredentialsToCopy({
          email: createForm.email,
          password: data.temp_password,
          name: createForm.full_name,
        });
      } else {
        setCredentialsToCopy(null);
      }
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    },
    onError: (e) => toast.error(e?.message || 'Failed to create employee'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => base44.entities.User.update(id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated');
      setEditTarget(null);
    },
    onError: (e) => toast.error(e?.message || 'Failed to update employee'),
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.User.update(id, { active }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success(vars.active ? 'Employee reactivated' : 'Employee deactivated');
    },
    onError: (e) => toast.error(e?.message || 'Action failed'),
  });

  const resetPwMutation = useMutation({
    mutationFn: ({ id, password }) => base44.entities.User.update(id, { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Password reset. Share the new password securely.');
      setCredentialsToCopy({
        email: pwTarget?.email,
        password: pwValue,
        name: pwTarget?.full_name,
      });
      setPwTarget(null);
      setPwValue('');
    },
    onError: (e) => toast.error(e?.message || 'Failed to reset password'),
  });

  function handleCreateSubmit(e) {
    e.preventDefault();
    if (!createForm.email || !createForm.full_name) {
      return toast.error('Email and full name are required');
    }
    if (!createForm.send_invite && !createForm.password) {
      return toast.error('Either provide a password or enable Send email invite');
    }
    if (createForm.password && createForm.password.length < 8) {
      return toast.error('Password must be at least 8 characters');
    }
    const payload = { ...createForm };
    if (!payload.password) delete payload.password;
    inviteMutation.mutate(payload);
  }

  function openEdit(emp) {
    setEditTarget(emp);
    setEditForm({
      full_name: emp.full_name ?? '',
      role: emp.role ?? 'sales_rep',
      title: emp.title ?? '',
      phone: emp.phone ?? '',
      company: emp.company ?? '',
      assigned_territory: emp.assigned_territory ?? '',
      active: emp.active ?? true,
    });
  }

  function submitEdit(e) {
    e.preventDefault();
    if (!editForm.full_name) return toast.error('Full name is required');
    updateMutation.mutate({
      id: editTarget.id,
      patch: { ...editForm },
    });
  }

  function copyCredentials() {
    if (!credentialsToCopy) return;
    const text = `Login: https://enixexteriors.com/login/employee
Email: ${credentialsToCopy.email}
Password: ${credentialsToCopy.password}`;
    navigator.clipboard?.writeText(text);
    toast.success('Credentials copied to clipboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Team & Access</h2>
          <p className="text-muted-foreground mt-1">
            Create employees directly, reset passwords, and control who has access.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Add Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div className="rounded-md border p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Send email invite</p>
                  <p className="text-xs text-muted-foreground">
                    When off, set their password below and share it manually — no email is sent.
                  </p>
                </div>
                <Switch
                  checked={createForm.send_invite}
                  onCheckedChange={(v) => setCreateForm({ ...createForm, send_invite: v })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="emp-email">Email *</Label>
                  <Input
                    id="emp-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="employee@enixexteriors.com"
                    required
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="emp-name">Full name *</Label>
                  <Input
                    id="emp-name"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Role *</Label>
                  <Select
                    value={createForm.role}
                    onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-title">Title</Label>
                  <Input
                    id="emp-title"
                    value={createForm.title}
                    onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-phone">Phone</Label>
                  <Input
                    id="emp-phone"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="emp-territory">Territory</Label>
                  <Input
                    id="emp-territory"
                    value={createForm.assigned_territory}
                    onChange={(e) => setCreateForm({ ...createForm, assigned_territory: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="emp-pw">
                  Password {createForm.send_invite ? '(optional — overrides auto-generated)' : '*'}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="emp-pw"
                    type={showPw ? 'text' : 'password'}
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    placeholder={createForm.send_invite ? 'Leave blank to auto-generate' : 'Min 8 characters'}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setShowPw((v) => !v)}
                    title={showPw ? 'Hide' : 'Show'}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateForm({ ...createForm, password: generatePassword() })}
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {createForm.send_invite ? (
                    <><Mail className="w-4 h-4 mr-2" /> Create + send invite</>
                  ) : (
                    <><KeyRound className="w-4 h-4 mr-2" /> Create with password</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {credentialsToCopy && (
        <Card className="border-2 border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4" /> New credentials — share these securely
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm font-mono space-y-1">
              <div><strong>Name:</strong> {credentialsToCopy.name}</div>
              <div><strong>Email:</strong> {credentialsToCopy.email}</div>
              <div><strong>Password:</strong> {credentialsToCopy.password}</div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={copyCredentials}>
                <Copy className="w-3 h-3 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCredentialsToCopy(null)}>
                Dismiss
              </Button>
            </div>
            <p className="text-xs text-amber-700">
              These credentials are shown once. Closing this card removes them from the screen.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : employees.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No employees yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold">Name</th>
                    <th className="text-left py-3 px-2 font-semibold">Email</th>
                    <th className="text-left py-3 px-2 font-semibold">Role</th>
                    <th className="text-left py-3 px-2 font-semibold">Title</th>
                    <th className="text-left py-3 px-2 font-semibold">Phone</th>
                    <th className="text-left py-3 px-2 font-semibold">Territory</th>
                    <th className="text-left py-3 px-2 font-semibold">Status</th>
                    <th className="text-right py-3 px-2 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">{emp.full_name || '—'}</td>
                      <td className="py-3 px-2">{emp.email}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {ROLE_LABEL[emp.role] || emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">{emp.title || '-'}</td>
                      <td className="py-3 px-2">{emp.phone || '-'}</td>
                      <td className="py-3 px-2">{emp.assigned_territory || '-'}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-medium ${emp.active ? 'text-green-600' : 'text-red-600'}`}>
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="inline-flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEdit(emp)} title="Edit">
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setPwTarget(emp); setPwValue(generatePassword()); }}
                            title="Reset password"
                          >
                            <KeyRound className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deactivateMutation.mutate({ id: emp.id, active: !emp.active })}
                            title={emp.active ? 'Deactivate' : 'Reactivate'}
                            className={emp.active ? 'text-red-600' : 'text-green-600'}
                          >
                            <Power className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit {editTarget?.full_name || editTarget?.email}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitEdit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 col-span-2">
                <Label htmlFor="edit-name">Full name</Label>
                <Input
                  id="edit-name"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-territory">Territory</Label>
                <Input
                  id="edit-territory"
                  value={editForm.assigned_territory}
                  onChange={(e) => setEditForm({ ...editForm, assigned_territory: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">When off, the user cannot log in.</p>
              </div>
              <Switch
                checked={editForm.active}
                onCheckedChange={(v) => setEditForm({ ...editForm, active: v })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!pwTarget} onOpenChange={(open) => !open && setPwTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset password — {pwTarget?.full_name || pwTarget?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Set a new password directly. The user can change it after they log in.
              No email is sent — share the new password securely.
            </p>
            <div className="space-y-1">
              <Label htmlFor="pw-new">New password</Label>
              <div className="flex gap-2">
                <Input
                  id="pw-new"
                  type={pwShow ? 'text' : 'password'}
                  value={pwValue}
                  onChange={(e) => setPwValue(e.target.value)}
                  autoComplete="new-password"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setPwShow((v) => !v)}>
                  {pwShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button type="button" variant="outline" onClick={() => setPwValue(generatePassword())}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (pwValue.length < 8) return toast.error('Password must be at least 8 characters');
                resetPwMutation.mutate({ id: pwTarget.id, password: pwValue });
              }}
              disabled={resetPwMutation.isPending}
            >
              {resetPwMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reset password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
