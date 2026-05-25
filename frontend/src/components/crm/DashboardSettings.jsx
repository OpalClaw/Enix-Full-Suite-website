import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Trash2, Mail, Loader2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';



const EMPLOYEE_ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'sales_rep', label: 'Sales Rep' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'production_manager', label: 'Production Manager' },
  { value: 'office_staff', label: 'Office Staff' },
  { value: 'crew', label: 'Crew' },
  { value: 'subcontractor', label: 'Subcontractor' },
];

export default function DashboardSettings() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'sales_rep',
    title: '',
    company: '',
    territory: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated);
  }, []);

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAuthenticated,
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('inviteEmployeeWithDetails', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Login instructions sent to employee');
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'sales_rep',
        title: '',
        company: '',
        territory: '',
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
    onError: () => {
      toast.error('Failed to remove employee');
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(employees.map(emp => base44.entities.User.delete(emp.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('All team members removed');
    },
    onError: () => {
      toast.error('Failed to remove team members');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      await base44.entities.User.update(id, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Team member updated');
      setOpen(false);
      setEditingId(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: 'sales_rep',
        title: '',
        company: '',
        territory: '',
      });
    },
    onError: () => {
      toast.error('Failed to update team member');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (userId) => {
      const emp = employees.find(e => e.id === userId);
      return base44.entities.User.update(userId, { active: !emp?.active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Team member status updated');
    },
    onError: () => {
      toast.error('Failed to update team member status');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.role) {
      toast.error('First name, last name, email, and role are required');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      inviteMutation.mutate(formData);
    }
  };

  const openEditDialog = (emp) => {
    setFormData({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      email: emp.email,
      phone: emp.phone || '',
      role: emp.role,
      title: emp.title || '',
      company: emp.company || '',
      territory: emp.assigned_territory || '',
    });
    setEditingId(emp.id);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingId(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'sales_rep',
      title: '',
      company: '',
      territory: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Team Management Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">Team Members</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Manage your CRM staff and employee access</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Dialog open={open} onOpenChange={closeDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2 w-full sm:w-auto" onClick={() => { setEditingId(null); setFormData({ name: '', email: '', phone: '', role: 'sales_rep', title: '', company: '', territory: '' }); }}>
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Employee</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">First Name *</label>
                  <Input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Last Name *</label>
                  <Input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Doe"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Email *</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
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
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Sales Manager"
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
                    name="territory"
                    value={formData.territory}
                    onChange={handleInputChange}
                    placeholder="Assigned territory"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={editingId ? updateMutation.isPending : inviteMutation.isPending}
                >
                  {editingId ? (
                    updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Member'
                    )
                  ) : (
                    inviteMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Login Instructions
                      </>
                    )
                  )}
                </Button>
              </form>
            </DialogContent>
            </Dialog>
            </div>
            </div>

        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No employees yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="hidden sm:table-header-group">
                   <tr className="border-b">
                     <th className="text-left py-3 px-3 sm:px-4 font-semibold">Name</th>
                     <th className="text-left py-3 px-3 sm:px-4 font-semibold hidden md:table-cell">Email</th>
                     <th className="text-left py-3 px-3 sm:px-4 font-semibold">Role</th>
                     <th className="text-left py-3 px-3 sm:px-4 font-semibold hidden lg:table-cell">Title</th>
                     <th className="text-left py-3 px-3 sm:px-4 font-semibold hidden lg:table-cell">Phone</th>
                     <th className="text-left py-3 px-3 sm:px-4 font-semibold hidden 2xl:table-cell">Territory</th>
                     <th className="text-right py-3 px-3 sm:px-4 font-semibold">Action</th>
                   </tr>
                  </thead>
                  <tbody className="block sm:table-row-group space-y-3 sm:space-y-0">
                    {employees.map(emp => (
                      <tr key={emp.id} className="border-b sm:border-b hover:bg-muted/50 block sm:table-row p-0 sm:p-0 bg-transparent sm:bg-transparent rounded-none sm:rounded-none">
                        <td className="py-3 px-4 block sm:table-cell text-sm font-medium">{emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.full_name || 'N/A'}</td>
                        <td className="py-3 px-4 hidden md:table-cell text-xs sm:text-sm">{emp.email}</td>
                        <td className="py-3 px-4 block sm:table-cell text-xs sm:text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                            {emp.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-xs sm:text-sm">{emp.title || '-'}</td>
                        <td className="py-3 px-4 hidden lg:table-cell text-xs sm:text-sm">{emp.phone || '-'}</td>
                        <td className="py-3 px-4 hidden 2xl:table-cell text-xs sm:text-sm">{emp.assigned_territory || '-'}</td>
                        <td className="py-3 px-4 block sm:table-cell text-right">
                         <div className="flex sm:justify-end gap-2">
                            <button
                              onClick={() => openEditDialog(emp)}
                              disabled={updateMutation.isPending || deleteMutation.isPending}
                              className="inline-flex items-center justify-center w-8 h-8 rounded text-primary hover:text-primary/80 hover:bg-primary/10 disabled:opacity-50 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(emp.id)}
                              disabled={updateMutation.isPending || deleteMutation.isPending}
                              className="inline-flex items-center justify-center w-8 h-8 rounded text-destructive hover:text-destructive/80 hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      </div>
    </div>
  );
}