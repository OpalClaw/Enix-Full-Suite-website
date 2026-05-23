import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EMPLOYEE_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'office_staff', label: 'Office Staff' },
  { value: 'crew', label: 'Crew' },
  { value: 'subcontractor', label: 'Subcontractor' },
];

export default function EmployeeManagement() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'sales_rep',
    title: '',
    phone: '',
    company: '',
    crew_id: '',
    assigned_territory: '',
  });
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list(),
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      // Use the SDK's inviteUser method
      await base44.users.inviteUser(data.email, data.role);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee invited successfully');
      setFormData({
        email: '',
        role: 'sales_rep',
        title: '',
        phone: '',
        company: '',
        crew_id: '',
        assigned_territory: '',
      });
      setOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to invite employee');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => base44.entities.User.delete(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee removed');
    },
    onError: (error) => {
      toast.error('Failed to remove employee');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Email is required');
      return;
    }
    inviteMutation.mutate(formData);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage your CRM staff and employee access</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="employee@example.com"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role *</label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Job title"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Company</label>
                <Input
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Company name"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Territory</label>
                <Input
                  name="assigned_territory"
                  value={formData.assigned_territory}
                  onChange={handleInputChange}
                  placeholder="Assigned territory"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invite
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                    <th className="text-left py-3 px-4 font-semibold">Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Role</th>
                    <th className="text-left py-3 px-4 font-semibold">Title</th>
                    <th className="text-left py-3 px-4 font-semibold">Phone</th>
                    <th className="text-left py-3 px-4 font-semibold">Territory</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => (
                    <tr key={emp.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{emp.full_name || 'N/A'}</td>
                      <td className="py-3 px-4">{emp.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">{emp.title || '-'}</td>
                      <td className="py-3 px-4">{emp.phone || '-'}</td>
                      <td className="py-3 px-4">{emp.assigned_territory || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${emp.active ? 'text-green-600' : 'text-red-600'}`}>
                          {emp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => deleteMutation.mutate(emp.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}