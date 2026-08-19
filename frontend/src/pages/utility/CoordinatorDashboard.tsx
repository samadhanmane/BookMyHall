import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import UtilityManagement from '@/components/admin/UtilityManagement';
import BookingRequestCard from '@/components/utility/BookingRequestCard';
import BookingModifyDialog from '@/components/utility/BookingModifyDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Calendar, 
  Building2, 
  TrendingUp, 
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Edit,
  Star
} from 'lucide-react';
import { UtilityApi, BookingApi, CategoryApi, getApiErrorMessage } from '@/lib/api';
import { Utility, BookingRequest, UtilityCategory } from '@/types/utility';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { hasPermission, PERMISSIONS } from '@/rbac/permissions';
import { LoadingState } from '@/components/PageState';

const DailyBookingsChart = lazy(() =>
  import('@/components/utility/CoordinatorOverviewCharts').then((m) => ({
    default: m.DailyBookingsChart,
  }))
);
const UtilityBookingsChart = lazy(() =>
  import('@/components/utility/CoordinatorOverviewCharts').then((m) => ({
    default: m.UtilityBookingsChart,
  }))
);

const CoordinatorDashboard = () => {
  const { orgId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const authUser = JSON.parse(sessionStorage.getItem('auth_user') || '{}');
  // Get coordinator ID - check both sub (from JWT) and id (from user object)
  const coordinatorId = authUser.sub || authUser.id || authUser._id;
  
  const user = {
    email: authUser.email || 'coordinator@org.com',
    role: authUser.role || 'coordinator',
    organization: orgId,
    orgName: authUser.orgName || 'Organization'
  };
  const canApproveBookings = hasPermission(user.role, PERMISSIONS.BOOKING_APPROVE);
  const canModifyBookings = hasPermission(user.role, PERMISSIONS.BOOKING_MODIFY);
  const canManageUtilities = hasPermission(user.role, PERMISSIONS.UTILITY_MANAGE);

  // Initialize activeTab from URL hash, default to 'overview'
  const getInitialTab = () => {
    const hash = location.hash.replace('#', '');
    if (['bookings', 'utilities', 'feedback'].includes(hash)) {
      return hash;
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [categories, setCategories] = useState<UtilityCategory[]>([]);
  const [utilities, setUtilities] = useState<Utility[]>([]);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUtilityId, setSelectedUtilityId] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Utility>>({});
  const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false);
  const [selectedBookingForModify, setSelectedBookingForModify] = useState<BookingRequest | null>(null);

  // Update tab when hash changes
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (['bookings', 'utilities', 'feedback'].includes(hash)) {
      setActiveTab(hash);
    } else {
      setActiveTab('overview');
    }
  }, [location.hash]);

  // Update URL hash when tab changes (for browser back button support)
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'overview') {
      navigate(`/org/${orgId}/coordinator/dashboard`, { replace: true });
    } else {
      navigate(`/org/${orgId}/coordinator/dashboard#${value}`, { replace: true });
    }
  };

  useEffect(() => {
    if (orgId) {
      loadData();
    }
  }, [orgId, coordinatorId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [categoriesRes, utilitiesRes, bookingsRes] = await Promise.all([
        CategoryApi.list(orgId!),
        UtilityApi.list(orgId!),
        BookingApi.list(orgId!),
      ]);

      const transformedCategories = (categoriesRes.data || []).map((cat: any) => ({
        ...cat,
        id: cat._id || cat.id,
      }));

      const transformedUtilities = (utilitiesRes.data || []).map((util: any) => ({
        ...util,
        id: util._id || util.id,
      }));

      const transformedBookings = (bookingsRes.data || []).map((booking: any) => ({
        ...booking,
        id: booking._id || booking.id,
      }));

      setCategories(transformedCategories);
      setUtilities(transformedUtilities);
      setBookings(transformedBookings);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to load data'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter utilities assigned to this coordinator
  const assignedUtilities = useMemo(() => {
    if (!coordinatorId) {
      console.warn('Coordinator ID not found in auth user:', authUser);
      return [];
    }
    const coordinatorIdStr = String(coordinatorId);
    return utilities.filter(util => 
      util.coordinatorIds && 
      Array.isArray(util.coordinatorIds) &&
      util.coordinatorIds.some(id => String(id) === coordinatorIdStr)
    );
  }, [utilities, coordinatorId, authUser]);

  // Get bookings for assigned utilities
  const assignedBookings = useMemo(() => {
    const assignedUtilityIds = assignedUtilities.map(u => u.id);
    return bookings.filter(b => assignedUtilityIds.includes(b.utilityId));
  }, [bookings, assignedUtilities]);

  // Filter completed bookings with reviews for coordinator's assigned utilities
  const feedbackBookings = useMemo(() => {
    return assignedBookings.filter(b => b.feedback && b.feedback.rating > 0);
  }, [assignedBookings]);

  // Analytics: Daily bookings for the last 30 days
  const dailyBookingsData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    });

    const bookingsByDate = last30Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayBookings = assignedBookings.filter(b => b.date === dateStr);
      
      return {
        date: format(date, 'MMM dd'),
        fullDate: dateStr,
        bookings: dayBookings.length,
        confirmed: dayBookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length,
        pending: dayBookings.filter(b => ['pending', 'coordinator_approved', 'hod_approved', 'registrar_approved', 'director_approved'].includes(b.status)).length,
        rejected: dayBookings.filter(b => b.status === 'rejected').length,
      };
    });

    return bookingsByDate;
  }, [assignedBookings]);

  // Analytics: Bookings by utility
  const bookingsByUtility = useMemo(() => {
    const utilityMap = new Map<string, { name: string; total: number; confirmed: number; pending: number }>();
    
    assignedUtilities.forEach(util => {
      utilityMap.set(util.id, {
        name: util.name,
        total: 0,
        confirmed: 0,
        pending: 0
      });
    });

    assignedBookings.forEach(booking => {
      const stats = utilityMap.get(booking.utilityId);
      if (stats) {
        stats.total++;
        if (booking.status === 'confirmed' || booking.status === 'completed') {
          stats.confirmed++;
        } else if (['pending', 'coordinator_approved', 'hod_approved', 'registrar_approved', 'director_approved'].includes(booking.status)) {
          stats.pending++;
        }
      }
    });

    return Array.from(utilityMap.values()).sort((a, b) => b.total - a.total);
  }, [assignedBookings, assignedUtilities]);

  // Analytics: Peak days (days with most bookings)
  const peakDays = useMemo(() => {
    const dayCounts: Record<string, number> = {};
    
    assignedBookings.forEach(booking => {
      try {
        const date = parseISO(booking.date);
        const dayName = format(date, 'EEEE'); // Full day name (Monday, Tuesday, etc.)
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
      } catch (e) {
        // Skip invalid dates
      }
    });

    return Object.entries(dayCounts)
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count);
  }, [assignedBookings]);

  // Stats
  const stats = useMemo(() => {
    const totalBookings = assignedBookings.length;
    const pendingBookings = assignedBookings.filter(b => 
      ['pending', 'coordinator_approved', 'hod_approved', 'registrar_approved', 'director_approved'].includes(b.status)
    ).length;
    const confirmedBookings = assignedBookings.filter(b => 
      b.status === 'confirmed' || b.status === 'completed'
    ).length;
    const rejectedBookings = assignedBookings.filter(b => b.status === 'rejected').length;

    return {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      rejectedBookings,
      assignedUtilitiesCount: assignedUtilities.length
    };
  }, [assignedBookings, assignedUtilities]);

  const handleApprove = async (booking: BookingRequest) => {
    if (!canApproveBookings) return;
    try {
      await BookingApi.updateStatus(orgId!, booking.id, 'approve');
      toast({ title: 'Success', description: `Approved booking for ${booking.utilityName}` });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to approve booking'),
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (booking: BookingRequest) => {
    if (!canApproveBookings) return;
    try {
      await BookingApi.updateStatus(orgId!, booking.id, 'reject');
      toast({ title: 'Success', description: `Rejected booking for ${booking.utilityName}` });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to reject booking'),
        variant: 'destructive',
      });
    }
  };

  const handleModify = (booking: BookingRequest) => {
    if (!canModifyBookings) return;
    setSelectedBookingForModify(booking);
    setIsModifyDialogOpen(true);
  };

  const handleModifySubmit = async (data: {
    date?: string;
    timeSlotId?: string;
    timeSlotLabel?: string;
    purpose?: string;
    attendeesCount?: number;
    customFieldValues?: Record<string, any>;
  }) => {
    if (!selectedBookingForModify) return;
    if (!canModifyBookings) return;

    try {
      await BookingApi.modify(orgId!, selectedBookingForModify.id, data);
      toast({ title: 'Success', description: 'Booking modified successfully' });
      setIsModifyDialogOpen(false);
      setSelectedBookingForModify(null);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to modify booking'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleEditClick = (utility: Utility) => {
    if (!canManageUtilities) return;
    setEditFormData({
      name: utility.name,
      description: utility.description,
      isActive: utility.isActive,
      images: utility.images,
      timeSlots: utility.timeSlots,
      disabledDateRanges: utility.disabledDateRanges,
      disabledDaysOfWeek: utility.disabledDaysOfWeek,
    });
    setIsEditDialogOpen(true);
  };

  const handleUtilityUpdate = async () => {
    if (!selectedUtility) return;
    if (!canManageUtilities) return;
    
    try {
      const utilityId = (selectedUtility as any)._id || selectedUtility.id;
      if (!utilityId) {
        toast({
          title: 'Error',
          description: 'Utility ID is missing',
          variant: 'destructive',
        });
        return;
      }
      
      const updateData = {
        ...selectedUtility,
        ...editFormData,
      };
      
      const { _id, id, ...updatePayload } = updateData as any;
      await UtilityApi.update(orgId!, utilityId, updatePayload);
      toast({ title: 'Success', description: 'Utility updated successfully' });
      setIsEditDialogOpen(false);
      setEditFormData({});
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to update utility'),
        variant: 'destructive',
      });
    }
  };

  const pendingBookings = assignedBookings.filter(b =>
    ['pending', 'coordinator_approved', 'hod_approved', 'registrar_approved'].includes(b.status)
  );

  const selectedUtility = assignedUtilities.find(u => u.id === selectedUtilityId) || null;

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <LoadingState message="Loading coordinator dashboard…" rows={5} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#123458] to-[#1e4b77] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <Building2 className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <span className="text-xs uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full font-bold text-white/90">Resource Management</span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 mb-1">Coordinator Console</h1>
            <p className="text-blue-100 text-xs sm:text-sm">Manage assigned facilities, categories, and track booking approvals for {user.orgName}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)] bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{stats.assignedUtilitiesCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Managed utilities</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center shrink-0 border border-slate-100/50">
                <Building2 className="w-5 h-5 text-[#123458]" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)] bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{stats.totalBookings}</p>
                <p className="text-[10px] text-slate-500 mt-1">Overall requests</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center shrink-0 border border-slate-100/50">
                <Calendar className="w-5 h-5 text-[#123458]" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)] bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-black text-amber-600 leading-tight mt-1">{stats.pendingBookings}</p>
                <p className="text-[10px] text-amber-500 mt-1">Awaiting approval</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50/50 flex items-center justify-center shrink-0 border border-amber-100/50">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)] bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Confirmed</p>
                <p className="text-2xl font-black text-emerald-600 leading-tight mt-1">{stats.confirmedBookings}</p>
                <p className="text-[10px] text-emerald-500 mt-1">Approved slots</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50/50 flex items-center justify-center shrink-0 border border-emerald-100/50">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)] bg-white">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rejected</p>
                <p className="text-2xl font-black text-red-600 leading-tight mt-1">{stats.rejectedBookings}</p>
                <p className="text-[10px] text-red-500 mt-1">Declined requests</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-red-50/50 flex items-center justify-center shrink-0 border border-red-100/50">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview & Analytics</TabsTrigger>
            <TabsTrigger value="utilities">Manage Utilities</TabsTrigger>
            <TabsTrigger value="bookings">Manage Bookings</TabsTrigger>
            <TabsTrigger value="feedback">User Feedback ({feedbackBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Daily Bookings Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Bookings (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingState message="Loading chart…" rows={1} />}>
                  <DailyBookingsChart data={dailyBookingsData} />
                </Suspense>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bookings by Utility</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<LoadingState message="Loading chart…" rows={1} />}>
                  <UtilityBookingsChart data={bookingsByUtility} />
                </Suspense>
              </CardContent>
            </Card>

            {/* Peak Days */}
            <Card>
              <CardHeader>
                <CardTitle>Peak Booking Days</CardTitle>
              </CardHeader>
              <CardContent>
                {peakDays.length > 0 ? (
                  <div className="space-y-2">
                    {peakDays.map(({ day, count }, index) => (
                      <div key={day} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <span className="font-medium">{day}</span>
                        </div>
                        <Badge>{count} bookings</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No booking data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="utilities" className="space-y-4">
            {assignedUtilities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No utilities assigned to you yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignedUtilities.map((utility) => (
                    <Card 
                      key={utility.id}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        selectedUtilityId === utility.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedUtilityId(utility.id === selectedUtilityId ? null : utility.id)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{utility.name}</span>
                          <Badge>{utility.categoryName}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">{utility.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {assignedBookings.filter(b => b.utilityId === utility.id).length} bookings
                          </span>
                          <Badge variant={utility.isActive ? 'default' : 'secondary'}>
                            {utility.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedUtility && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Utility Details: {selectedUtility.name}</CardTitle>
                        <Button onClick={() => handleEditClick(selectedUtility)} disabled={!canManageUtilities}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Utility
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-1">Category</p>
                            <Badge>{selectedUtility.categoryName}</Badge>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Status</p>
                            <Badge variant={selectedUtility.isActive ? 'default' : 'secondary'}>
                              {selectedUtility.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Description</p>
                          <p className="text-sm text-muted-foreground">{selectedUtility.description || 'No description'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Time Slots</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {selectedUtility.timeSlots?.map((slot) => (
                              <Badge key={slot.id} variant="outline">
                                {slot.label}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-2">Bookings for this utility</p>
                          <p className="text-sm text-muted-foreground">
                            {assignedBookings.filter(b => b.utilityId === selectedUtility.id).length} total bookings
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            {pendingBookings.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending bookings to review.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingBookings.map((booking) => (
                  <BookingRequestCard
                    key={booking.id}
                    booking={booking}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onModify={canModifyBookings ? handleModify : undefined}
                    showActions={canApproveBookings || canModifyBookings}
                    userRole="coordinator"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-[#123458] font-black text-xl">Assigned Facility Feedback</CardTitle>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Real-time reviews and ratings submitted by faculty for your utilities</p>
                </div>
              </CardHeader>
              <CardContent>
                {feedbackBookings.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-300" />
                    <p className="text-sm font-semibold">No feedback received yet.</p>
                    <p className="text-xs mt-1">When faculty review your completed bookings, they will show up here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedbackBookings.map((booking) => {
                      const init = booking.requesterName ? booking.requesterName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
                      return (
                        <div key={booking.id} className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#123458]/10 flex items-center justify-center text-xs font-bold text-[#123458] shrink-0">
                                  {init}
                                </div>
                                <div>
                                  <h4 className="font-bold text-xs text-slate-800">{booking.requesterName}</h4>
                                  <p className="text-[10px] text-slate-400 font-semibold">{booking.requesterDepartment} • {booking.requesterRole}</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-bold text-[#123458] bg-[#123458]/5 px-2 py-0.5 rounded border border-[#123458]/10 truncate max-w-[120px]">
                                {booking.utilityName}
                              </span>
                            </div>
                            <div className="flex items-center gap-0.5 mb-2">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-3.5 h-3.5 ${s <= (booking.feedback?.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                              ))}
                              <span className="text-xs font-black text-slate-700 ml-1">{booking.feedback?.rating}/5</span>
                            </div>
                            <p className="text-xs text-slate-600 font-semibold italic bg-white border border-slate-100 p-3 rounded-lg leading-relaxed shadow-sm">
                              "{booking.feedback?.comment}"
                            </p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-200/50 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                            <span>Used on: {format(new Date(booking.date + 'T00:00:00'), 'dd MMM yyyy')}</span>
                            {booking.feedback?.submittedAt && (
                              <span>Submitted: {format(new Date(booking.feedback.submittedAt), 'dd MMM yyyy')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modify Booking Dialog */}
        <BookingModifyDialog
          open={isModifyDialogOpen}
          onClose={() => {
            setIsModifyDialogOpen(false);
            setSelectedBookingForModify(null);
          }}
          booking={selectedBookingForModify}
          orgId={orgId!}
          onSubmit={handleModifySubmit}
        />

        {/* Edit Utility Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Utility: {selectedUtility?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-active"
                  checked={editFormData.isActive ?? true}
                  onCheckedChange={(checked) => setEditFormData({ ...editFormData, isActive: checked })}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
              <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    🖼️ Facility Images
                    <span className="text-xs font-normal text-slate-400">({(editFormData.images || []).length}/5 max)</span>
                  </Label>
                  {(editFormData.images || []).length < 5 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setEditFormData({ ...editFormData, images: [...(editFormData.images || []), ''] })}
                    >
                      + Add Image URL
                    </Button>
                  )}
                </div>
                {(editFormData.images || []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">No images yet. Add up to 5 image URLs to showcase this facility.</p>
                ) : (
                  <div className="space-y-2">
                    {(editFormData.images || []).map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {/* Preview thumbnail */}
                        <div className="w-12 h-9 rounded border border-slate-200 overflow-hidden shrink-0 bg-slate-100">
                          {url ? (
                            <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">No img</div>
                          )}
                        </div>
                        <Input
                          value={url}
                          onChange={(e) => {
                            const imgs = [...(editFormData.images || [])];
                            imgs[idx] = e.target.value;
                            setEditFormData({ ...editFormData, images: imgs });
                          }}
                          placeholder={`Image ${idx + 1} URL (https://...)`}
                          className="flex-1 text-xs h-9"
                        />
                        {/* Move up */}
                        <Button type="button" size="sm" variant="ghost" className="p-1 h-8 w-8" disabled={idx === 0}
                          onClick={() => {
                            const imgs = [...(editFormData.images || [])];
                            [imgs[idx - 1], imgs[idx]] = [imgs[idx], imgs[idx - 1]];
                            setEditFormData({ ...editFormData, images: imgs });
                          }}>↑</Button>
                        {/* Move down */}
                        <Button type="button" size="sm" variant="ghost" className="p-1 h-8 w-8" disabled={idx === (editFormData.images || []).length - 1}
                          onClick={() => {
                            const imgs = [...(editFormData.images || [])];
                            [imgs[idx], imgs[idx + 1]] = [imgs[idx + 1], imgs[idx]];
                            setEditFormData({ ...editFormData, images: imgs });
                          }}>↓</Button>
                        {/* Remove */}
                        <Button type="button" size="sm" variant="ghost" className="p-1 h-8 w-8 text-red-500 hover:text-red-700"
                          onClick={() => {
                            const imgs = (editFormData.images || []).filter((_, i) => i !== idx);
                            setEditFormData({ ...editFormData, images: imgs });
                          }}>✕</Button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Paste full image URLs (https://...). First image shown as main. Images appear in carousel on facility detail page.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUtilityUpdate}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default CoordinatorDashboard;

