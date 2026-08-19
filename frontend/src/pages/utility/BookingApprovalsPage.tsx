import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import BookingRequestCard from '@/components/utility/BookingRequestCard';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingApi, getApiErrorMessage } from '@/lib/api';
import { BookingRequest } from '@/types/utility';
import { useToast } from '@/hooks/use-toast';
import { buildDashboardUser } from '@/lib/dashboardUser';
import { LoadingState, EmptyState } from '@/components/PageState';
import { CheckCircle2 } from 'lucide-react';
import {
  canApproveBooking,
  canConfirmBooking,
} from '@/lib/workflow/bookingWorkflow';
import { hasPermission, PERMISSIONS } from '@/rbac/permissions';

const APPROVER_ROLES = new Set(['hod', 'registrar', 'director', 'org_admin']);

const BookingApprovalsPage = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = buildDashboardUser(orgId);
  const role = user?.role || '';

  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  const canApprove = hasPermission(role, PERMISSIONS.BOOKING_APPROVE);

  useEffect(() => {
    if (!user?.email) {
      navigate('/');
      return;
    }
    if (user.role === 'coordinator') {
      navigate(`/org/${orgId}/coordinator/dashboard#bookings`);
      return;
    }
    if (!APPROVER_ROLES.has(user.role) && user.role !== 'super_admin') {
      navigate(`/org/${orgId}/forbidden`);
    }
  }, [user, orgId, navigate]);

  const loadBookings = async () => {
    if (!orgId) return;
    try {
      setIsLoading(true);
      const res = await BookingApi.list(orgId);
      const list = (res.data || []).map((b: Record<string, unknown>) => ({
        ...b,
        id: (b._id || b.id) as string,
      })) as BookingRequest[];
      setBookings(list);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: getApiErrorMessage(err, 'Failed to load bookings'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orgId && canApprove) loadBookings();
  }, [orgId, canApprove]);

  const pendingApprovals = useMemo(
    () => bookings.filter((b) => canApproveBooking(role, b.status, b.approvalFlow, user?.id)),
    [bookings, role, user]
  );

  const recentlyActioned = useMemo(
    () =>
      bookings.filter(
        (b) => {
          const isTerminal = ['confirmed', 'rejected', 'completed', 'cancelled'].includes(b.status);
          const hasUserActioned = b.approvals?.some(
            (a: any) => a.role === role && a.approverId === user?.id
          );
          const hasRoleApprovedStatus = (role === 'coordinator' && b.status === 'coordinator_approved') ||
                                         (role === 'hod' && b.status === 'hod_approved') ||
                                         (role === 'registrar' && b.status === 'registrar_approved') ||
                                         (role === 'director' && b.status === 'director_approved');
          const isRecentTime = new Date(b.updatedAt || b.createdAt || 0).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
          return isRecentTime && (hasUserActioned || hasRoleApprovedStatus || isTerminal);
        }
      ),
    [bookings, role, user]
  );

  const handleApprove = async (booking: BookingRequest, remarks?: string) => {
    try {
      await BookingApi.updateStatus(orgId!, booking.id, 'approve', remarks);
      toast({ title: 'Approved', description: `${booking.utilityName} approved.` });
      loadBookings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: getApiErrorMessage(err, 'Approval failed'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (booking: BookingRequest, remarks?: string) => {
    try {
      await BookingApi.updateStatus(orgId!, booking.id, 'reject', remarks);
      toast({ title: 'Rejected', description: `${booking.utilityName} rejected.` });
      loadBookings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: getApiErrorMessage(err, 'Rejection failed'),
        variant: 'destructive',
      });
    }
  };

  const handleConfirm = async (booking: BookingRequest) => {
    try {
      await BookingApi.updateStatus(orgId!, booking.id, 'confirm');
      toast({ title: 'Confirmed', description: `${booking.utilityName} confirmed.` });
      loadBookings();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({
        title: 'Error',
        description: getApiErrorMessage(err, 'Confirm failed'),
        variant: 'destructive',
      });
    }
  };

  if (!user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingState message="Loading approvals…" rows={2} />
      </div>
    );
  }

  const renderList = (items: BookingRequest[]) => {
    if (items.length === 0) {
      return (
        <EmptyState
          icon={<CheckCircle2 className="h-12 w-12" />}
          title="Nothing pending"
          description="New booking requests that need your approval will appear here."
        />
      );
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {items.map((booking) => (
          <BookingRequestCard
            key={booking.id}
            booking={booking}
            userRole={role}
            onApprove={handleApprove}
            onReject={handleReject}
            onConfirm={
              canConfirmBooking(role, booking.status) ? handleConfirm : undefined
            }
          />
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Booking Approvals</h1>
          <p className="text-muted-foreground mt-1">
            Review and act on utility bookings awaiting your role ({role.replace('_', ' ')}).
          </p>
        </div>

        {isLoading ? (
          <LoadingState message="Loading approval queue…" rows={2} />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="pending">
                Awaiting action ({pendingApprovals.length})
              </TabsTrigger>
              <TabsTrigger value="recent">
                Recent ({recentlyActioned.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              {renderList(pendingApprovals)}
            </TabsContent>
            <TabsContent value="recent" className="mt-4">
              {recentlyActioned.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No completed actions in the last 7 days.
                  </CardContent>
                </Card>
              ) : (
                renderList(recentlyActioned)
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BookingApprovalsPage;
