import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Mail, Lock, ArrowLeft, Sparkles, KeyRound, ShieldCheck } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AuthApi, OrganizationApi, getApiErrorMessage } from '@/lib/api';
import { getDefaultDashboardPath } from '@/lib/roleRedirect';

interface DemoAccount {
  id: string;
  role: string;
  email: string;
  group: 'Administration' | 'Academics & Department' | 'Operations & Maintenance' | 'Students & Support';
  description: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'super_admin',
    role: 'Super Admin',
    email: 'test.superadmin@test.local',
    group: 'Administration',
    description: 'Platform Super Administrator (manage colleges & orgs)',
  },
  {
    id: 'org_admin',
    role: 'Organisation Admin (Admin)',
    email: 'test.admin@test.local',
    group: 'Administration',
    description: 'College Administrator (facilities, users, analytics)',
  },
  {
    id: 'director',
    role: 'Director',
    email: 'test.director@test.local',
    group: 'Administration',
    description: 'College Director (executive final sign-offs)',
  },
  {
    id: 'registrar',
    role: 'Registrar',
    email: 'test.registrar@test.local',
    group: 'Administration',
    description: 'Central Registrar (budget checks & admin approvals)',
  },
  {
    id: 'hod',
    role: 'Head of Department (HOD)',
    email: 'test.hod@test.local',
    group: 'Academics & Department',
    description: 'Department Head (approves hall bookings, food, repairs)',
  },
  {
    id: 'coordinator',
    role: 'Coordinator / Hall Manager',
    email: 'test.coord@test.local',
    group: 'Academics & Department',
    description: 'Resource Coordinator (reviews & approves hall slots)',
  },
  {
    id: 'faculty',
    role: 'Faculty (Requester)',
    email: 'faculty.new@test.local',
    group: 'Academics & Department',
    description: 'Faculty / Staff (book halls/slots, food & repairs)',
  },
  {
    id: 'assistant',
    role: 'Canteen Assistant',
    email: 'test.assistant@test.local',
    group: 'Academics & Department',
    description: 'Canteen Assistant (department food orders & support)',
  },
  {
    id: 'workshop_hod',
    role: 'Workshop HOD',
    email: 'test.workshophod@test.local',
    group: 'Operations & Maintenance',
    description: 'Central Workshop Head (assigns maintenance tickets)',
  },
  {
    id: 'worker',
    role: 'Technician Worker',
    email: 'test.worker@test.local',
    group: 'Operations & Maintenance',
    description: 'Technician / Worker (resolves maintenance tasks)',
  },
];

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [orgNameLoading, setOrgNameLoading] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string>('');
  const navigate = useNavigate();
  const { orgId } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const isSuperAdminLogin = orgId === 'super-admin';

  useEffect(() => {
    if (searchParams.get('session') === 'expired') {
      toast({
        title: 'Session expired',
        description: 'Please sign in again to continue.',
        variant: 'destructive',
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    if (!orgId || isSuperAdminLogin) return;

    const loadOrg = async () => {
      try {
        setOrgNameLoading(true);
        const res = await OrganizationApi.getPublic(orgId);
        setOrgName(res.data?.name || null);
      } catch {
        const listRes = await OrganizationApi.list().catch(() => null);
        const match = listRes?.data?.find(
          (o: { _id: string }) => String(o._id) === String(orgId)
        );
        setOrgName(match?.name || null);
      } finally {
        setOrgNameLoading(false);
      }
    };

    loadOrg();
  }, [orgId, isSuperAdminLogin]);

  const getOrgDisplayName = () => {
    if (isSuperAdminLogin) return 'Platform Super Admin';
    if (orgNameLoading) return 'Loading…';
    return orgName || 'Organization Portal';
  };

  const handleSelectDemoAccount = (accountId: string) => {
    const account = DEMO_ACCOUNTS.find((a) => a.id === accountId);
    if (!account) return;

    setSelectedDemoRole(accountId);
    setEmail(account.email);
    setPassword('123456');

    toast({
      title: `Demo Credentials Loaded: ${account.role}`,
      description: `Email: ${account.email} | Password: ${'123456'}`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
        orgId: isSuperAdminLogin ? undefined : orgId,
        email,
        password,
      } as { orgId?: string; email: string; password: string };

      const response = await AuthApi.login(payload);
      const { token, user } = response.data;

      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem(
        'auth_user',
        JSON.stringify({
          ...user,
          organizationId: user.organizationId
            ? String(user.organizationId)
            : user.organizationId,
        })
      );

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }

      const redirectParam = searchParams.get('redirect');
      const roleDashboard = user.role === 'super_admin'
        ? '/super-admin/dashboard'
        : getDefaultDashboardPath(user.role, orgId!);

      // Use the redirect param only when it is safe: i.e. it is not a plain /dashboard
      // path that would land an org_admin or coordinator on the wrong (faculty) view.
      const genericDashboardPattern = new RegExp(`^/org/[^/]+/dashboard(\\?|#|$)`);
      const redirectIsSafe =
        redirectParam &&
        redirectParam.startsWith('/') &&
        !redirectParam.includes('/login') &&
        !(genericDashboardPattern.test(redirectParam) &&
          (user.role === 'org_admin' || user.role === 'coordinator' || user.role === 'super_admin'));

      const redirectPath = redirectIsSafe ? redirectParam : roleDashboard;

      toast({
        title: 'Login Successful',
        description: `Welcome back! Redirecting to ${user.role.replace('_', ' ')} dashboard...`,
      });

      navigate(redirectPath);
    } catch (error: any) {
      const message =
        getApiErrorMessage(error, 'Unable to sign in. Please check your credentials.');
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate(`/org/${orgId}/forgot-password`);
  };

  const groups = Array.from(new Set(DEMO_ACCOUNTS.map((a) => a.group)));

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organization Selection
          </Button>
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4 shadow-md">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {getOrgDisplayName()}
          </h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <Card className="shadow-lg-custom border border-primary/10">
          <CardHeader>
            <CardTitle className="text-center text-primary">
              {isSuperAdminLogin ? 'Super Admin Login' : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-center">
              {isSuperAdminLogin
                ? 'Use your platform credentials to manage organizations'
                : 'Enter your credentials to access your dashboard'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Demo Credentials Quick-Select Dropdown */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Demo Credentials (Password: 123456)</span>
                </div>
                {selectedDemoRole && (
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                    Auto-Filled
                  </span>
                )}
              </div>

              <Select
                value={selectedDemoRole}
                onValueChange={handleSelectDemoAccount}
              >
                <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-primary/20 text-xs h-9">
                  <SelectValue placeholder="Select demo role to test login..." />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {groups.map((grp) => (
                    <SelectGroup key={grp}>
                      <SelectLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
                        {grp}
                      </SelectLabel>
                      {DEMO_ACCOUNTS.filter((a) => a.group === grp).map((account) => (
                        <SelectItem
                          key={account.id}
                          value={account.id}
                          className="text-xs cursor-pointer py-1.5"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{account.role}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {account.email}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setSelectedDemoRole('');
                    }}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-muted-foreground" /> Default password: <strong className="text-foreground">123456</strong>
                </span>
                <Button
                  variant="link"
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs p-0 h-auto"
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {!isSuperAdminLogin && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                  Role and permissions resolve automatically from your organization.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;