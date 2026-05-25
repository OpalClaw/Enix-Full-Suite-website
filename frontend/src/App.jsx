import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ClientLogin from './pages/ClientLogin';
import EmployeeLogin from './pages/EmployeeLogin';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import PublicErrorBoundary from '@/components/public/ErrorBoundary';

// Public pages
import PublicLayout from './components/public/PublicLayout';
import Home from './pages/Home';
import ResidentialRoofing from './pages/ResidentialRoofing';
import CommercialRoofing from './pages/CommercialRoofing';
import RoofRepairs from './pages/RoofRepairs';
import Siding from './pages/Siding';
import Windows from './pages/Windows';
import Doors from './pages/Doors';
import StormDamage from './pages/StormDamage';
import About from './pages/About';
import Projects from './pages/Projects';
import Reviews from './pages/Reviews';
import Financing from './pages/Financing';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import BackendOffline from './components/BackendOffline';

const BACKEND_ENABLED = import.meta.env.VITE_BACKEND_ENABLED === 'true';

// CRM pages
import CRMLayout from './components/crm/CRMLayout';
import CRMDashboard from './pages/crm/CRMDashboard';
import Leads from './pages/crm/Leads';
import LeadDetail from './pages/crm/LeadDetail';
import LeadForm from './pages/crm/LeadForm';
import Jobs from './pages/crm/Jobs';
import CRMCalendar from './pages/crm/CRMCalendar';
import Messages from './pages/crm/Messages';
import Inspections from './pages/crm/Inspections';
import Measurements from './pages/crm/Measurements';
import Estimates from './pages/crm/EstimatesPage';
import EstimateTemplates from './pages/crm/EstimateTemplates';
import Contracts from './pages/crm/Contracts';
import Crew from './pages/crm/Crew';
import Materials from './pages/crm/Materials';
import Tasks from './pages/crm/Tasks';
import Invoices from './pages/crm/Invoices';
import Warranties from './pages/crm/Warranties';
import Reports from './pages/crm/Reports';
import Proposals from './pages/crm/Proposals';
import CommercialEstimates from './pages/crm/CommercialEstimates';
import SettingsPage from './pages/crm/SettingsPage';

// Portal pages
import ClientPortalLayout from './components/portal/ClientPortalLayout';
import ClientDashboard from './pages/portal/ClientDashboard';
import PortalPlaceholder from './pages/portal/PortalPlaceholder';
import PortalEstimates from './pages/portal/PortalEstimates';
import PortalAppointments from './pages/portal/PortalAppointments';
import PortalMessages from './pages/portal/PortalMessages';
import PortalInvoices from './pages/portal/PortalInvoices';
import PortalDocuments from './pages/portal/PortalDocuments';
import PortalWarranties from './pages/portal/PortalWarranties';
import PortalProposals from './pages/portal/PortalProposals';
import JobDetail from './pages/crm/JobDetail';
import PortalJobDetail from './pages/portal/PortalJobDetail';

// SmartDocs pages
import SmartDocsDashboard from './pages/smartdocs/SmartDocsDashboard';
import SmartDocumentEditor from './pages/smartdocs/SmartDocumentEditor';
import TemplatesPage from './pages/smartdocs/TemplatesPage';
import SigningPage from './pages/smartdocs/SigningPage';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-500 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Login Pages */}
      <Route path="/login" element={<Navigate to="/login/employee" replace />} />
      <Route path="/login/client" element={<ClientLogin />} />
      <Route path="/login/employee" element={<EmployeeLogin />} />

      {/* Public Website */}
      <Route element={<PublicErrorBoundary><PublicLayout /></PublicErrorBoundary>}>
        <Route path="/" element={<Home />} />
        <Route path="/residential-roofing" element={<ResidentialRoofing />} />
        <Route path="/commercial-roofing" element={<CommercialRoofing />} />
        <Route path="/roof-repairs" element={<RoofRepairs />} />
        <Route path="/siding" element={<Siding />} />
        <Route path="/windows" element={<Windows />} />
        <Route path="/doors" element={<Doors />} />
        <Route path="/storm-damage" element={<StormDamage />} />
        <Route path="/about" element={<About />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/financing" element={<Financing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/education" element={<Blog />} />
        <Route path="/education/:slug" element={<BlogPost />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      {/* CRM Backend */}
      {BACKEND_ENABLED ? (
        <Route element={<CRMLayout />}>
          <Route path="/crm" element={<CRMDashboard />} />
          <Route path="/crm/leads" element={<Leads />} />
          <Route path="/crm/leads/new" element={<LeadForm />} />
          <Route path="/crm/leads/:leadId" element={<LeadDetail />} />
          <Route path="/crm/jobs" element={<Jobs />} />
          <Route path="/crm/jobs/:jobId" element={<JobDetail />} />
          <Route path="/crm/inspections" element={<Inspections />} />
          <Route path="/crm/measurements" element={<Measurements />} />
          <Route path="/crm/estimates" element={<Estimates />} />
          <Route path="/crm/estimate-templates" element={<EstimateTemplates />} />
          <Route path="/crm/contracts" element={<Contracts />} />
          <Route path="/crm/calendar" element={<CRMCalendar />} />
          <Route path="/crm/crew" element={<Crew />} />
          <Route path="/crm/materials" element={<Materials />} />
          <Route path="/crm/messages" element={<Messages />} />
          <Route path="/crm/tasks" element={<Tasks />} />
          <Route path="/crm/invoices" element={<Invoices />} />
          <Route path="/crm/proposals" element={<Proposals />} />
          <Route path="/crm/warranties" element={<Warranties />} />
          <Route path="/crm/reports" element={<Reports />} />
          <Route path="/crm/commercial-estimates" element={<CommercialEstimates />} />
          <Route path="/crm/settings" element={<SettingsPage />} />
        </Route>
      ) : (
        <Route path="/crm/*" element={<BackendOffline surface="The CRM" />} />
      )}

      {/* Client Portal */}
      {BACKEND_ENABLED ? (
        <Route element={<ClientPortalLayout />}>
          <Route path="/portal" element={<ClientDashboard />} />
          <Route path="/portal/project" element={<PortalJobDetail />} />
          <Route path="/portal/media" element={<PortalDocuments />} />
          <Route path="/portal/live" element={<PortalPlaceholder />} />
          <Route path="/portal/messages" element={<PortalMessages />} />
          <Route path="/portal/documents" element={<PortalDocuments />} />
          <Route path="/portal/estimates" element={<PortalEstimates />} />
          <Route path="/portal/invoices" element={<PortalInvoices />} />
          <Route path="/portal/changes" element={<PortalPlaceholder />} />
          <Route path="/portal/warranty" element={<PortalWarranties />} />
          <Route path="/portal/support" element={<PortalPlaceholder />} />
        </Route>
      ) : (
        <Route path="/portal/*" element={<BackendOffline surface="The client portal" />} />
      )}

      {/* SmartDocs - Under Jobs */}
      {BACKEND_ENABLED ? (
        <Route element={<CRMLayout />}>
          <Route path="/crm/jobs/documents" element={<SmartDocsDashboard />} />
          <Route path="/crm/jobs/documents/editor" element={<SmartDocumentEditor />} />
          <Route path="/crm/jobs/documents/editor/:documentId" element={<SmartDocumentEditor />} />
          <Route path="/crm/jobs/documents/templates" element={<TemplatesPage />} />
        </Route>
      ) : null}

      {/* Public Signing */}
      {BACKEND_ENABLED ? (
        <Route path="/sign/:documentId/:signerToken" element={<SigningPage />} />
      ) : (
        <Route path="/sign/*" element={<BackendOffline surface="Document signing" />} />
      )}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <ErrorBoundary>
          <Router>
            <AuthenticatedApp />
          </Router>
        </ErrorBoundary>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App