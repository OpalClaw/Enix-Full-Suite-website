import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Plus, MapPin, Download, Check, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = {
  not_ordered: 'bg-gray-100 text-gray-700',
  ordered: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  complete: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
  imported: 'bg-purple-100 text-purple-700',
};

const STATUS_ICONS = {
  not_ordered: AlertCircle,
  ordered: Clock,
  processing: Loader2,
  complete: Check,
  failed: AlertCircle,
  cancelled: AlertCircle,
  imported: Check,
};

export default function Measurements() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    reportType: 'roof',
  });
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['eagleViewReports'],
    queryFn: () => base44.entities.EagleViewReport.list('-created_date', 100),
  });

  const createReportMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.EagleViewReport.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eagleViewReports'] });
      toast.success('Measurement order created');
      setFormData({ address: '', city: '', state: '', zip: '', reportType: 'roof' });
      setOpen(false);
    },
    onError: () => {
      toast.error('Failed to create measurement order');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.address || !formData.city || !formData.state) {
      toast.error('Address, city, and state are required');
      return;
    }
    createReportMutation.mutate({
      ...formData,
      reportStatus: 'not_ordered',
      orderedBy: 'current_user',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const stats = {
    total: reports.length,
    processing: reports.filter(r => r.reportStatus === 'processing').length,
    complete: reports.filter(r => r.reportStatus === 'complete').length,
    imported: reports.filter(r => r.importedToEstimate).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-3xl mb-1">Property Measurements</h1>
            <p className="text-muted-foreground">EagleView aerial measurement reports</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Order EagleView Measurements</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Address *</label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main St"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">City *</label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Nashville"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">State *</label>
                    <Input
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="TN"
                      maxLength="2"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ZIP</label>
                    <Input
                      name="zip"
                      value={formData.zip}
                      onChange={handleInputChange}
                      placeholder="37201"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Report Type</label>
                  <Select value={formData.reportType} onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="roof">Roof</SelectItem>
                      <SelectItem value="siding">Siding</SelectItem>
                      <SelectItem value="windows">Windows</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="multi_service">Multi-Service</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Order'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-navy-600 mb-1">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.processing}</div>
            <p className="text-sm text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.complete}</div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.imported}</div>
            <p className="text-sm text-muted-foreground">Imported</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle>Measurement Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No measurement orders yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="hidden sm:table-header-group bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Property</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm hidden md:table-cell">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm hidden lg:table-cell">Roof Area</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm hidden lg:table-cell">Ordered</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm">Action</th>
                  </tr>
                </thead>
                <tbody className="block sm:table-row-group divide-y sm:divide-y">
                  {reports.map(report => {
                    const StatusIcon = STATUS_ICONS[report.reportStatus] || AlertCircle;
                    return (
                      <tr key={report.id} className="block sm:table-row hover:bg-gray-50">
                        <td className="py-3 px-4 block sm:table-cell">
                          <div>
                            <p className="font-medium text-sm">{report.address}</p>
                            <p className="text-xs text-muted-foreground">{report.city}, {report.state} {report.zip}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell text-sm capitalize">{report.reportType?.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4 block sm:table-cell">
                          <Badge className={STATUS_COLORS[report.reportStatus]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {report.reportStatus?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-sm">
                          {report.totalRoofSquares ? `${report.totalRoofSquares} sq` : '-'}
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell text-sm text-muted-foreground">
                          {report.orderedAt ? new Date(report.orderedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="py-3 px-4 block sm:table-cell text-right">
                          {report.pdfReportUrl && (
                            <Button variant="ghost" size="sm" className="gap-1">
                              <Download className="w-4 h-4" />
                              <span className="hidden sm:inline">PDF</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}