import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export default function EmployeeLogin() {
  usePageTitle('Staff Login');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const role = data?.user?.role;
        if (role && role !== 'client') navigate('/crm');
        else if (role === 'client') navigate('/portal');
      })
      .catch(() => {});
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || 'Invalid email or password');
        return;
      }
      const role = data?.user?.role;
      if (role && role !== 'client') {
        navigate('/crm');
      } else {
        setError('This account does not have staff access. Use the client portal instead.');
      }
    } catch (err) {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 to-navy-500 flex items-center justify-center p-4">
      <Button
        variant="outline"
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 bg-white/10 border-white/30 text-white hover:bg-white/20"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-3">
            <span className="text-2xl font-extrabold tracking-tight text-navy-700">ENIX</span>
            <span className="ml-2 text-sm font-semibold text-navy-500">EXTERIORS</span>
          </div>
          <CardTitle className="text-2xl">Employee Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Manage leads, jobs, and customer communications
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="emp-email">Email</Label>
              <Input
                id="emp-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-password">Password</Label>
              <Input
                id="emp-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full h-11 bg-navy-500 hover:bg-navy-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              {!submitting && <ArrowRight className="w-4 h-4" />}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Admin, manager, or office role required
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
