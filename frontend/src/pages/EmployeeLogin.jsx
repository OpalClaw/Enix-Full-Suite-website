import React from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function EmployeeLogin() {
  usePageTitle('Staff Login');
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        if (user?.role === 'admin') {
          navigate('/crm');
        } else if (user?.role === 'user') {
          navigate('/portal');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = () => {
    base44.auth.redirectToLogin('/crm');
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
      <div className="w-full max-w-md mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
        <strong>Staff portal in setup.</strong> If login isn't working yet, contact your manager.
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <img 
            src="https://media.base44.com/images/public/user_6a0541ba998771a1f2cb4ab0/ae967f6a7_Enix.png" 
            alt="Enix Exteriors" 
            className="h-16 mx-auto mb-4"
          />
          <CardTitle className="text-2xl">Employee Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">Manage leads, jobs, and customer communications</p>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} className="w-full h-11 bg-navy-500 hover:bg-navy-600 text-white font-semibold flex items-center justify-center gap-2">
            Sign In <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Admin access required
          </p>
        </CardContent>
      </Card>
    </div>
  );
}