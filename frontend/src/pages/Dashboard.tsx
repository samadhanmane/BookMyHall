import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardLayout from '@/components/DashboardLayout';
import { EmptyState, ErrorState, LoadingState } from '@/components/PageState';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  UtensilsCrossed,
  Wrench,
  Users,
  TrendingUp,
  Clock,
  Inbox,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CheckCheck,
  ShieldAlert,
  ClipboardList,
  ChevronRight,
  Sparkles,
  Building2,
  MessageSquare,
  Search,
  Check,
  Send,
  X,
  Paperclip,
  FileText,
  Video,
  Download,
  ArrowLeft,
  Pause,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  cachedBookingList,
  cachedMaintenanceList,
  cachedRequisitionList,
} from '@/lib/cachedApi';
import { invalidateRequestCache } from '@/lib/requestCache';
import { BookingApi, RequisitionApi, MaintenanceApi, CanteenMenuApi, isRateLimitError } from '@/lib/api';
import { hasPermission, PERMISSIONS } from '@/rbac/permissions';
import { buildDashboardUser } from '@/lib/dashboardUser';
import {
  getMaintenanceTicketLabel,
  isMaintenanceTicketOpen,
} from '@/lib/maintenanceStatus';
import { useToast } from '@/hooks/use-toast';
import ProfileSection from '@/components/user/ProfileSection';
import { canApproveBooking, canRejectBooking, normalizeRole } from '@/lib/workflow/bookingWorkflow';

type ActivityType = 'success' | 'warning' | 'info';

interface ActivityItem {
  action: string;
  time: string;
  type: ActivityType;
}

interface StatItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend: string;
}

const ACTIVE_BOOKING_STATUSES = new Set([
  'pending',
  'coordinator_approved',
  'hod_approved',
  'registrar_approved',
  'director_approved',
  'confirmed',
]);

const STATUS_LABEL: Record<string, string> = {
  PENDING_DEPT_HOD: 'Pending Dept HOD',
  PENDING_WORKSHOP_HOD: 'Pending Workshop Approval',
  PENDING_BUDGET_DEPT_HOD: 'Pending Budget Approval',
  PENDING_REGISTRAR: 'Pending Registrar Stamp',
  PENDING_DIRECTOR: 'Pending Director Sign-off',
  BACK_TO_WORKSHOP_AFTER_APPROVALS: 'Approved (Awaiting Assignment)',
  ASSIGNED_TO_WORKER: 'Assigned / In Progress',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING_DEPT_HOD: 'bg-amber-50 text-amber-700 border-amber-200',
  PENDING_WORKSHOP_HOD: 'bg-blue-50 text-blue-700 border-blue-200',
  PENDING_BUDGET_DEPT_HOD: 'bg-purple-50 text-purple-700 border-purple-200',
  PENDING_REGISTRAR: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  PENDING_DIRECTOR: 'bg-pink-50 text-pink-700 border-pink-200',
  BACK_TO_WORKSHOP_AFTER_APPROVALS: 'bg-teal-50 text-teal-700 border-teal-200',
  ASSIGNED_TO_WORKER: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  PAUSED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { orgId } = useParams();
  const { toast } = useToast();
  const user = useMemo(() => buildDashboardUser(orgId), [orgId]);
  const organization = user?.organization;
  const role = user?.role ?? '';
  const email = user?.email ?? '';

  const summaryInFlight = useRef(false);
  const summaryLoadedFor = useRef<string | null>(null);

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const [canteenLoading, setCanteenLoading] = useState(false);
  const [canteenCounts, setCanteenCounts] = useState({
    toPrepare: 0,
    prepared: 0,
    delivered: 0,
    totalRevenue: 0,
  });
  const [canteenRecent, setCanteenRecent] = useState<ActivityItem[]>([]);

  const [rawBookings, setRawBookings] = useState<any[]>([]);
  const [rawRequisitions, setRawRequisitions] = useState<any[]>([]);
  const [rawMaintenance, setRawMaintenance] = useState<any[]>([]);
  const [workersList, setWorkersList] = useState<any[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [workerTab, setWorkerTab] = useState<'tasks' | 'analytics'>(
    (searchParams.get('tab') as 'tasks' | 'analytics') || 'tasks'
  );
  const [workshopTab, setWorkshopTab] = useState<'queue' | 'active' | 'history' | 'analytics' | 'profile'>(
    (searchParams.get('workshopTab') as 'queue' | 'active' | 'history' | 'analytics' | 'profile') || 'queue'
  );
  const [hodTab, setHodTab] = useState<'overview' | 'bookings' | 'canteen' | 'maintenance' | 'analytics' | 'profile'>(
    (searchParams.get('tab') as 'overview' | 'bookings' | 'canteen' | 'maintenance' | 'analytics' | 'profile') || 'overview'
  );

  // Ticket details modal state
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketDetailsOpen, setTicketDetailsOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  // Pause / Reopen dialog state inside Dashboard.tsx
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [pausingTicket, setPausingTicket] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopeningTicket, setReopeningTicket] = useState(false);

  // Booking details modal state
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookingDetailsOpen, setBookingDetailsOpen] = useState(false);
  const [bookingRemarks, setBookingRemarks] = useState('');
  const [actioningBooking, setActioningBooking] = useState(false);

  // Requisition details modal state
  const [selectedRequisition, setSelectedRequisition] = useState<any | null>(null);
  const [requisitionDetailsOpen, setRequisitionDetailsOpen] = useState(false);
  const [requisitionRemarks, setRequisitionRemarks] = useState('');
  const [actioningRequisition, setActioningRequisition] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [editRemarks, setEditRemarks] = useState('');
  const [addItemId, setAddItemId] = useState('');

  // Search/Filter states pulled to top-level to prevent conditional rendering hook violations
  const [workerSearchTerm, setWorkerSearchTerm] = useState('');
  const [workerStatusFilter, setWorkerStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [workshopSearchTerm, setWorkshopSearchTerm] = useState('');

  // Chat sidebar states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatFilePreview, setChatFilePreview] = useState<string | null>(null);
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canWorkerComplete = (t: any) => {
    return role === 'worker' && t.status === 'ASSIGNED_TO_WORKER';
  };

  const canPauseTicket = (t: any) => {
    return (role === 'workshop_hod' || role === 'worker') && t.status === 'ASSIGNED_TO_WORKER';
  };

  const canReopenTicket = (t: any) => {
    return t.status === 'PAUSED' && (
      (role === 'faculty' && String(t.requesterId || t.requesterId?._id) === String(user?.id)) ||
      role === 'hod' ||
      role === 'org_admin' ||
      role === 'super_admin'
    );
  };

  const isStaff = role === 'workshop_hod' || role === 'worker';

  useEffect(() => {
    if (!orgId) return;
    CanteenMenuApi.list(orgId)
      .then((res) => {
        setMenuItems(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load canteen menu items inside dashboard:", err);
      });
  }, [orgId]);

  const canEditRequisition = (req: any) => {
    if (!req) return false;
    const r = role;
    if (r === 'super_admin' || r === 'org_admin') return true;
    if (r === 'hod' && req.status === 'PENDING_HOD') return true;
    if (r === 'registrar' && req.status === 'APPROVED_HOD') return true;
    if (r === 'director' && req.status === 'APPROVED_REGISTRAR') return true;
    return false;
  };

  useEffect(() => {
    if (chatOpen) {
      document.body.setAttribute('data-ticket-chat-open', 'true');
    } else {
      document.body.removeAttribute('data-ticket-chat-open');
    }
    return () => {
      document.body.removeAttribute('data-ticket-chat-open');
    };
  }, [chatOpen]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatOpen, selectedTicket?.comments]);

  // Synchronize state with URL search param changes
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (role === 'hod') {
      setHodTab((currentTab as any) || 'overview');
    } else if (role === 'worker') {
      setWorkerTab((currentTab as any) || 'tasks');
    }
    const currentWorkshopTab = searchParams.get('workshopTab') || currentTab;
    if (role === 'workshop_hod' && currentWorkshopTab) {
      setWorkshopTab((currentWorkshopTab as any) || 'queue');
    }
  }, [searchParams, role]);

  // Recharts analytics data for Workshop HOD
  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(STATUS_LABEL).forEach((status) => {
      counts[status] = 0;
    });
    rawMaintenance.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        name: STATUS_LABEL[status] || status,
        value: count,
      }))
      .filter((item) => item.value > 0);
  }, [rawMaintenance]);

  const workerPerformance = useMemo(() => {
    const map = new Map<string, { worker: string; assigned: number; completed: number }>();
    workersList.forEach((w) => { map.set(w.name, { worker: w.name, assigned: 0, completed: 0 }); });
    rawMaintenance.forEach((t) => {
      const worker = t.assignedWorkerName || 'Unassigned';
      const current = map.get(worker) || { worker, assigned: 0, completed: 0 };
      if (t.status === 'ASSIGNED_TO_WORKER' || t.status === 'COMPLETED') current.assigned += 1;
      if (t.status === 'COMPLETED') current.completed += 1;
      map.set(worker, current);
    });
    return Array.from(map.values()).filter((x) => x.worker !== 'Unassigned');
  }, [rawMaintenance, workersList]);

  // HOD specific analytics data
  const hodAnalytics = useMemo(() => {
    if (role !== 'hod' || !user?.department) return { bookings: [], canteen: [], maintenance: [] };

    const deptName = String(user.department).toLowerCase();

    // 1. Bookings by utility name
    const bookingCounts: Record<string, number> = {};
    rawBookings
      .filter((b) => b.requesterDepartment && String(b.requesterDepartment).toLowerCase() === deptName)
      .forEach((b) => {
        const name = b.utilityName || 'Unknown Facility';
        bookingCounts[name] = (bookingCounts[name] || 0) + 1;
      });
    const bookingsData = Object.entries(bookingCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // 2. Maintenance by status
    const maintCounts: Record<string, number> = {};
    rawMaintenance
      .filter((t) => {
        const dept = t.department || t.requesterDepartment;
        return dept && String(dept).toLowerCase() === deptName;
      })
      .forEach((t) => {
        const s = STATUS_LABEL[t.status] || (t.status || 'open').replace(/_/g, ' ').toLowerCase();
        maintCounts[s] = (maintCounts[s] || 0) + 1;
      });
    const maintenanceData = Object.entries(maintCounts).map(([name, count]) => ({
      name,
      count,
    }));

    // 3. Canteen status counts
    const canteenCounts: Record<string, number> = {};
    rawRequisitions
      .filter((r) => {
        const dept = r.department || r.requesterDepartment;
        return dept && String(dept).toLowerCase() === deptName;
      })
      .forEach((r) => {
        const s = (r.status || 'pending').replace(/_/g, ' ').toLowerCase();
        canteenCounts[s] = (canteenCounts[s] || 0) + 1;
      });
    const canteenData = Object.entries(canteenCounts).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      bookings: bookingsData,
      maintenance: maintenanceData,
      canteen: canteenData,
    };
  }, [role, user?.department, rawBookings, rawMaintenance, rawRequisitions]);

  // Department-locked data sets for detailed reports
  const deptBookings = useMemo(() => {
    if (!user?.department) return [];
    const deptName = String(user.department).toLowerCase();
    return rawBookings.filter((b) => b.requesterDepartment && String(b.requesterDepartment).toLowerCase() === deptName);
  }, [rawBookings, user?.department]);

  const deptMaintenance = useMemo(() => {
    if (!user?.department) return [];
    const deptName = String(user.department).toLowerCase();
    return rawMaintenance.filter((t) => {
      const dept = t.department || t.requesterDepartment;
      return dept && String(dept).toLowerCase() === deptName;
    });
  }, [rawMaintenance, user?.department]);

  const deptCanteen = useMemo(() => {
    if (!user?.department) return [];
    const deptName = String(user.department).toLowerCase();
    return rawRequisitions.filter((r) => {
      const dept = r.department || r.requesterDepartment;
      return dept && String(dept).toLowerCase() === deptName;
    });
  }, [rawRequisitions, user?.department]);

  // CSV download function
  const downloadCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row.map(val => {
          const str = String(val === null || val === undefined ? '' : val).replace(/"/g, '""');
          return `"${str}"`;
        }).join(',')
      )
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBookings = () => {
    const headers = ['Facility', 'Category', 'Date', 'Time Slot', 'Requester', 'Email', 'Status', 'Purpose', 'Created At'];
    const rows = deptBookings.map(b => [b.utilityName, b.categoryName || '', b.date, b.timeSlotLabel, b.requesterName, b.requesterEmail, b.status, b.purpose || '', b.createdAt || '']);
    downloadCSV(headers, rows, `${user?.department || 'Dept'}_Bookings_Report.csv`);
  };

  const handleExportMaintenance = () => {
    const headers = ['Title', 'Description', 'Category', 'Requester', 'Email', 'Worker', 'Status', 'Created At', 'Completed At'];
    const rows = deptMaintenance.map(t => [t.problemTitle, t.actualProblem || '', t.issueCategory || '', t.requesterName, t.requesterEmail, t.assignedWorkerName || '', t.status, t.createdAt || '', t.completedAt || '']);
    downloadCSV(headers, rows, `${user?.department || 'Dept'}_Maintenance_Report.csv`);
  };

  const handleExportCanteen = () => {
    const headers = ['Requester', 'Email', 'Department', 'Status', 'Items Count', 'Total (INR)', 'Reason of Order', 'Items List', 'Created At'];
    const rows = deptCanteen.map(r => {
      const itemsList = r.items || [];
      const billingItems = r.billing?.items || [];
      const displayItems = billingItems.length > 0 ? billingItems : itemsList;
      const itemsStr = displayItems.map((i: any) => `${i.name} (x${i.quantity})`).join('; ');
      const reasonStr = itemsList[0]?.reasoning || (r as any).reasoning || (r as any).purpose || (r as any).comment || (r as any).comments?.[0]?.content || 'N/A';
      const totalAmount = r.billing?.totalAmount ?? (r as any).totalAmount ?? 0;

      return [
        r.requesterName || 'N/A',
        r.requesterEmail || 'N/A',
        r.department || r.requesterDepartment || user?.department || 'N/A',
        r.status || 'N/A',
        displayItems.length,
        totalAmount,
        reasonStr,
        itemsStr,
        r.createdAt || r.submittedAt || ''
      ];
    });
    downloadCSV(headers, rows, `${user?.department || 'Dept'}_Canteen_Report.csv`);
  };

  const openChat = async (ticket: any) => {
    if (!orgId) return;
    setSelectedTicket(ticket);
    setChatOpen(true);
    setChatText('');
    setChatFile(null);
    setChatFilePreview(null);
    try {
      const res = await MaintenanceApi.get(orgId, ticket._id || ticket.id);
      setSelectedTicket(res.data);
    } catch (e: any) {
      console.warn('Dashboard Chat detail fetch skipped:', e);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10MB allowed', variant: 'destructive' });
      return;
    }
    setChatFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setChatFilePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sendChatMessage = async () => {
    if (!orgId || !selectedTicket) return;
    if (!chatText.trim() && !chatFile) return;
    setSendingChat(true);
    try {
      let attachmentUrl: string | undefined;
      let attachmentName: string | undefined;
      let attachmentType: string | undefined;
      if (chatFile && chatFilePreview) {
        attachmentUrl = chatFilePreview;
        attachmentName = chatFile.name;
        attachmentType = chatFile.type;
      }
      const res = await MaintenanceApi.addComment(orgId, selectedTicket._id || selectedTicket.id, {
        content: chatText.trim() || undefined,
        attachmentUrl,
        attachmentName,
        attachmentType,
      });
      setSelectedTicket(res.data);
      setChatText('');
      setChatFile(null);
      setChatFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      handleRetrySummary();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to send message', variant: 'destructive' });
    } finally {
      setSendingChat(false);
    }
  };

  const loadTicketDetails = async (ticketId: string) => {
    if (!orgId) return;
    try {
      const res = await MaintenanceApi.get(orgId, ticketId);
      setSelectedTicket(res.data);
    } catch (e: any) {
      console.warn('Failed to load ticket details:', e);
    }
  };

  const handleWorkerCompleteTicket = async (ticketId: string, remarksText: string) => {
    if (!orgId) return;
    try {
      await MaintenanceApi.act(orgId, ticketId, {
        action: 'complete',
        remarks: remarksText || 'Work marked done by assigned worker.'
      });
      toast({ title: 'Success', description: 'Ticket marked completed successfully' });
      setTicketDetailsOpen(false);
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to complete ticket', variant: 'destructive' });
    }
  };

  const handleAssignWorkerDialog = async (ticketId: string, workerId: string, workerName: string, remarksText?: string) => {
    if (!orgId) return;
    try {
      const res = await MaintenanceApi.act(orgId, ticketId, {
        action: 'assign_worker',
        workerId,
        workerName,
        remarks: remarksText || remarks || 'Assigned by Workshop HOD via Dashboard.'
      });
      toast({ title: 'Success', description: 'Worker assigned successfully' });
      setSelectedTicket(res.data);
      setRemarks('');
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign worker', variant: 'destructive' });
    }
  };

  const handleApproveAndAssignDialog = async (ticketId: string, workerId: string, remarksText?: string) => {
    if (!orgId) return;
    try {
      const res = await MaintenanceApi.act(orgId, ticketId, {
        action: 'approve',
        workerId,
        remarks: remarksText || remarks || 'Approved & Assigned by Workshop HOD.'
      });
      toast({ title: 'Success', description: 'Ticket approved and worker assigned' });
      setSelectedTicket(res.data);
      setRemarks('');
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to approve and assign', variant: 'destructive' });
    }
  };

  const handleCompleteTicketDialog = async (ticketId: string, remarksText?: string) => {
    if (!orgId) return;
    try {
      const res = await MaintenanceApi.act(orgId, ticketId, {
        action: 'complete',
        remarks: remarksText || remarks || 'Completed by Workshop HOD'
      });
      toast({ title: 'Success', description: 'Ticket completed successfully' });
      setSelectedTicket(res.data);
      setRemarks('');
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to complete ticket', variant: 'destructive' });
    }
  };

  const handlePauseTicketClick = (ticketId: string) => {
    setPauseReason(remarks.trim());
    setPauseDialogOpen(true);
  };

  const handleReopenTicketClick = (ticketId: string) => {
    setReopenReason(remarks.trim());
    setReopenDialogOpen(true);
  };

  const handleConfirmPause = async () => {
    if (!selectedTicket || !orgId) return;
    const tid = selectedTicket._id || selectedTicket.id;
    const reason = pauseReason.trim();
    if (!reason) {
      toast({ title: 'Validation Error', description: 'Reason is mandatory to pause the ticket', variant: 'destructive' });
      return;
    }

    try {
      setPausingTicket(true);
      const res = await MaintenanceApi.act(orgId, tid, {
        action: 'pause',
        reason
      });
      toast({ title: 'Success', description: 'Ticket paused successfully' });
      setSelectedTicket(res.data);
      setPauseDialogOpen(false);
      setRemarks('');
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to pause ticket', variant: 'destructive' });
    } finally {
      setPausingTicket(false);
    }
  };

  const handleConfirmReopen = async () => {
    if (!selectedTicket || !orgId) return;
    const tid = selectedTicket._id || selectedTicket.id;
    const reason = reopenReason.trim();
    if (!reason) {
      toast({ title: 'Validation Error', description: 'Reason is mandatory to reopen the ticket', variant: 'destructive' });
      return;
    }

    try {
      setReopeningTicket(true);
      const res = await MaintenanceApi.act(orgId, tid, {
        action: 'reopen',
        reason
      });
      toast({ title: 'Success', description: 'Ticket reopened successfully' });
      setSelectedTicket(res.data);
      setReopenDialogOpen(false);
      setRemarks('');
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to reopen ticket', variant: 'destructive' });
    } finally {
      setReopeningTicket(false);
    }
  };

  const handleDeptHodApproveTicket = async (ticketId: string, remarksText?: string) => {
    if (!orgId) return;
    try {
      const res = await MaintenanceApi.act(orgId, ticketId, {
        action: 'approve',
        remarks: remarksText || remarks || 'Approved by Department HOD'
      });
      toast({ title: 'Success', description: 'Ticket approved successfully' });
      setSelectedTicket(res.data);
      setRemarks('');
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to approve ticket', variant: 'destructive' });
    }
  };

  const handleDeptHodRejectTicket = async (ticketId: string, remarksText?: string) => {
    if (!orgId) return;
    try {
      const res = await MaintenanceApi.act(orgId, ticketId, {
        action: 'reject',
        remarks: remarksText || remarks || 'Rejected by Department HOD'
      });
      toast({ title: 'Success', description: 'Ticket rejected successfully' });
      setSelectedTicket(res.data);
      setRemarks('');
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to reject ticket', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!user?.email) {
      const loginPath = orgId ? `/org/${orgId}/login` : '/';
      navigate(loginPath);
      return;
    }
    if (user.role === 'super_admin') {
      navigate('/super-admin/dashboard', { replace: true });
    } else if (user.role === 'org_admin') {
      navigate(`/org/${orgId}/admin/dashboard`, { replace: true });
    } else if (user.role === 'coordinator') {
      navigate(`/org/${orgId}/coordinator/dashboard`, { replace: true });
    }
  }, [user?.email, user?.role, orgId, navigate]);

  const formatTime = (value?: string) => {
    if (!value) return 'Recently';
    try {
      return new Date(value).toLocaleString();
    } catch {
      return 'Recently';
    }
  };

  const formatCommentTime = (value?: string) => {
    if (!value) return 'Recently';
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recently';
    }
  };

  const loadCanteenSummary = useCallback(async () => {
    if (!organization || role !== 'canteen_owner') return;
    if (summaryInFlight.current) return;

    summaryInFlight.current = true;
    try {
      setCanteenLoading(true);
      setSummaryError(null);
      const data = await cachedRequisitionList(organization);
      const list = data as Record<string, unknown>[];
      setRawRequisitions(list);
      const toPrepare = list.filter((r) => r.status === 'APPROVED_DIRECTOR').length;
      const prepared = list.filter((r) => r.status === 'PREPARED').length;
      const delivered = list.filter((r) => r.status === 'HANDED_OVER').length;
      const totalRevenue = list.reduce(
        (sum, r) => sum + ((r.billing as { totalAmount?: number })?.totalAmount || 0),
        0
      );

      setCanteenCounts({ toPrepare, prepared, delivered, totalRevenue });

      const labelByStatus: Record<string, string> = {
        PENDING_HOD: 'Pending HOD approval',
        APPROVED_HOD: 'Approved by HOD',
        APPROVED_REGISTRAR: 'Approved by Registrar',
        APPROVED_DIRECTOR: 'Approved by Director',
        PREPARED: 'Prepared by canteen',
        HANDED_OVER: 'Delivered to department',
        CANCELLED: 'Cancelled',
      };

      const sorted = [...list].sort((a, b) => {
        const aDate = (a.handedOverAt || a.submittedAt || a.createdAt) as string;
        const bDate = (b.handedOverAt || b.submittedAt || b.createdAt) as string;
        return new Date(bDate || 0).getTime() - new Date(aDate || 0).getTime();
      });

      setCanteenRecent(
        sorted.slice(0, 5).map((r) => {
          let type: ActivityType = 'info';
          if (r.status === 'HANDED_OVER') type = 'success';
          else if (r.status === 'APPROVED_DIRECTOR' || r.status === 'PREPARED') type = 'warning';

          const dept = (r.department || r.requesterDepartment || 'Unknown department') as string;
          return {
            action: `${dept}: ${labelByStatus[r.status as string] || r.status}`,
            time: formatTime(
              (r.handedOverAt || r.submittedAt || r.createdAt) as string | undefined
            ),
            type,
          };
        })
      );

      setStats([
        { label: 'To Prepare', value: String(toPrepare), icon: UtensilsCrossed, trend: 'Awaiting preparation' },
        { label: 'Prepared', value: String(prepared), icon: UtensilsCrossed, trend: 'Ready to deliver' },
        { label: 'Delivered', value: String(delivered), icon: UtensilsCrossed, trend: 'Completed orders' },
        { label: 'Total Billing (INR)', value: totalRevenue.toFixed(2), icon: TrendingUp, trend: 'All time' },
      ]);
    } catch (err) {
      setSummaryError(
        isRateLimitError(err)
          ? 'Too many requests. Please wait a moment and try again.'
          : 'Could not load canteen orders. Please try again.'
      );
      toast({
        title: 'Error',
        description: 'Failed to load canteen dashboard data',
        variant: 'destructive',
      });
    } finally {
      summaryInFlight.current = false;
      setCanteenLoading(false);
    }
  }, [organization, role]);

  const loadGeneralSummary = useCallback(async () => {
    if (!organization || role === 'canteen_owner' || role === 'super_admin') {
      return;
    }
    if (summaryInFlight.current) return;

    summaryInFlight.current = true;
    const org = organization;
    const activities: ActivityItem[] = [];
    let activeBookings = 0;
    let pendingBookings = 0;
    let pendingRequisitions = 0;
    let openMaintenance = 0;
    let monthCount = 0;

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    try {
      setSummaryLoading(true);
      setSummaryError(null);

      const tasks: Promise<void>[] = [];

      if (hasPermission(role, PERMISSIONS.BOOKING_VIEW)) {
        tasks.push(
          cachedBookingList(org).then((bookings) => {
            const list = bookings as Record<string, unknown>[];
            setRawBookings(list);
            const mine = list.filter(
              (b) => !email || b.requesterEmail === email
            );
            const scope = hasPermission(role, PERMISSIONS.BOOKING_APPROVE)
              ? list
              : mine;

            activeBookings = scope.filter((b) =>
              ACTIVE_BOOKING_STATUSES.has(b.status as string)
            ).length;
            pendingBookings = scope.filter((b) => b.status === 'pending').length;

            scope
              .sort((a, b) => {
                const ad = new Date((a.updatedAt || a.createdAt) as string).getTime();
                const bd = new Date((b.updatedAt || b.createdAt) as string).getTime();
                return bd - ad;
              })
              .slice(0, 3)
              .forEach((b) => {
                activities.push({
                  action: `${b.utilityName || 'Facility'}: ${b.status}`,
                  time: formatTime((b.updatedAt || b.createdAt) as string),
                  type:
                    b.status === 'confirmed' || b.status === 'completed'
                      ? 'success'
                      : b.status === 'pending'
                        ? 'warning'
                        : 'info',
                });
              });

            scope.forEach((b) => {
              const d = new Date((b.createdAt || b.date) as string);
              if (d >= monthStart) monthCount += 1;
            });
          })
        );
      }

      if (hasPermission(role, PERMISSIONS.CANTEEN_VIEW)) {
        tasks.push(
          cachedRequisitionList(org).then((reqs) => {
            const list = reqs as Record<string, unknown>[];
            setRawRequisitions(list);
            const mine = list.filter(
              (r) =>
                (r.requesterEmail as string) === email ||
                (r.createdBy as { email?: string })?.email === email
            );
            pendingRequisitions = mine.filter((r) =>
              String(r.status).startsWith('PENDING')
            ).length;

            mine.slice(0, 2).forEach((r) => {
              activities.push({
                action: `Canteen order: ${r.status}`,
                time: formatTime((r.submittedAt || r.createdAt) as string),
                type: String(r.status).includes('APPROVED') ? 'success' : 'warning',
              });
            });
          })
        );
      }

      if (hasPermission(role, PERMISSIONS.MAINTENANCE_VIEW)) {
        tasks.push(
          cachedMaintenanceList(org).then((tickets) => {
            const list = tickets as Record<string, unknown>[];
            setRawMaintenance(list);
            const mine = list.filter(
              (t) =>
                (t.requesterEmail as string) === email ||
                (t.createdBy as { email?: string })?.email === email
            );
            const scope = hasPermission(role, PERMISSIONS.MAINTENANCE_ACT)
              ? list
              : mine;
            openMaintenance = scope.filter((t) =>
              isMaintenanceTicketOpen(t.status)
            ).length;

            scope.slice(0, 2).forEach((t) => {
              activities.push({
                action: `Maintenance: ${getMaintenanceTicketLabel(t as { problemTitle?: string; title?: string; status?: string })}`,
                time: formatTime((t.updatedAt || t.createdAt) as string),
                type: 'info',
              });
            });
          })
        );
      }

      await Promise.all(tasks);

      if (role === 'registrar' || role === 'director') {
        const pendingBookingStatus = role === 'registrar' ? 'hod_approved' : 'registrar_approved';
        const pendingReqStatus = role === 'registrar' ? 'APPROVED_HOD' : 'APPROVED_REGISTRAR';

        const regBookingsCount = rawBookings.filter(b => canApproveBooking(role, b.status, b.approvalFlow, user?.id)).length;
        const regReqsCount = rawRequisitions.filter(r => r.status === pendingReqStatus).length;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const bookingsApprovedToday = rawBookings.filter(b => {
          const isConfirmed = b.status === 'confirmed' || b.status === 'registrar_approved' || b.status === 'director_approved';
          const isToday = new Date((b.updatedAt || b.createdAt) as string) >= todayStart;
          return isConfirmed && isToday;
        }).length;

        const requisitionsApprovedToday = rawRequisitions.filter(r => {
          const isApproved = r.status !== 'PENDING_HOD' && r.status !== 'APPROVED_HOD' && r.status !== 'APPROVED_REGISTRAR' && r.status !== 'CANCELLED';
          const isToday = new Date((r.updatedAt || r.createdAt) as string) >= todayStart;
          return isApproved && isToday;
        }).length;

        const totalApprovedToday = bookingsApprovedToday + requisitionsApprovedToday;

        const bookingsRejectedToday = rawBookings.filter(b => {
          const isRejected = b.status === 'rejected';
          const isToday = new Date((b.updatedAt || b.createdAt) as string) >= todayStart;
          return isRejected && isToday;
        }).length;

        const requisitionsRejectedToday = rawRequisitions.filter(r => {
          const isRejected = r.status === 'CANCELLED';
          const isToday = new Date((r.updatedAt || r.createdAt) as string) >= todayStart;
          return isRejected && isToday;
        }).length;

        const totalRejectedToday = bookingsRejectedToday + requisitionsRejectedToday;

        setStats([
          {
            label: 'Pending Bookings',
            value: String(regBookingsCount),
            icon: Calendar,
            trend: 'Awaiting signature',
          },
          {
            label: 'Pending Budget Requests',
            value: String(regReqsCount),
            icon: UtensilsCrossed,
            trend: 'Awaiting release',
          },
          {
            label: "Today's Sign-offs",
            value: String(totalApprovedToday),
            icon: CheckCircle2,
            trend: 'Approved today',
          },
          {
            label: "Today's Rejections",
            value: String(totalRejectedToday),
            icon: XCircle,
            trend: 'Rejected today',
          },
        ]);
      } else {
        const pendingLabel = hasPermission(role, PERMISSIONS.BOOKING_APPROVE)
          ? 'Pending Approvals'
          : 'Pending Bookings';

        setStats([
          {
            label: hasPermission(role, PERMISSIONS.BOOKING_APPROVE)
              ? 'Active Bookings (org)'
              : 'My Active Bookings',
            value: String(activeBookings),
            icon: Calendar,
            trend: 'In progress',
          },
          {
            label: pendingLabel,
            value: String(pendingBookings),
            icon: Clock,
            trend: 'Needs attention',
          },
          {
            label: hasPermission(role, PERMISSIONS.CANTEEN_VIEW)
              ? 'Pending Canteen Orders'
              : 'Open Tickets',
            value: String(
              hasPermission(role, PERMISSIONS.CANTEEN_VIEW)
                ? pendingRequisitions
                : openMaintenance
            ),
            icon: hasPermission(role, PERMISSIONS.CANTEEN_VIEW)
              ? UtensilsCrossed
              : Wrench,
            trend: 'Your requests',
          },
          {
            label: 'This Month',
            value: String(monthCount),
            icon: TrendingUp,
            trend: 'Recorded activities',
          },
        ]);
      }

      setRecentActivity(
        activities
          .sort((a, b) => (a.time > b.time ? -1 : 1))
          .slice(0, 5)
      );
    } catch (err) {
      setSummaryError(
        isRateLimitError(err)
          ? 'Too many requests. Please wait a moment and try again.'
          : 'Could not load dashboard summary. Please try again.'
      );
    } finally {
      summaryInFlight.current = false;
      setSummaryLoading(false);
    }
  }, [organization, role, email]);

  useEffect(() => {
    if (!organization || !email) return;

    const loadKey = `${organization}:${role}:${email}`;
    if (summaryLoadedFor.current === loadKey) return;
    summaryLoadedFor.current = loadKey;

    if (role === 'canteen_owner') {
      void loadCanteenSummary();
    } else if (role !== 'super_admin') {
      void loadGeneralSummary();
    }
  }, [organization, role, email]);

  useEffect(() => {
    const handleBookingChanged = () => {
      // Invalidate cache first so that the refresh actually fetches new data
      if (orgId) {
        invalidateRequestCache(`bookings:${orgId}`);
      }
      handleRetrySummary();
    };
    const handleMaintenanceChanged = () => {
      if (orgId) {
        invalidateRequestCache(`maintenance:${orgId}`);
      }
      handleRetrySummary();
    };
    window.addEventListener('booking-changed', handleBookingChanged);
    window.addEventListener('maintenance-changed', handleMaintenanceChanged);
    return () => {
      window.removeEventListener('booking-changed', handleBookingChanged);
      window.removeEventListener('maintenance-changed', handleMaintenanceChanged);
    };
  }, [orgId, role, email]);

  useEffect(() => {
    if (orgId && role === 'workshop_hod') {
      MaintenanceApi.listWorkers(orgId)
        .then((res) => setWorkersList(res.data || []))
        .catch(() => {});
    }
  }, [orgId, role]);

  useEffect(() => {
    const autoOpenChatId = searchParams.get('chat');
    const autoOpenTicketId = searchParams.get('ticket');
    if (rawMaintenance.length > 0) {
      if (autoOpenChatId) {
        const ticket = rawMaintenance.find((t: any) => (t._id || t.id) === autoOpenChatId);
        if (ticket) {
          void openChat(ticket);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('chat');
          setSearchParams(newParams, { replace: true });
        }
      } else if (autoOpenTicketId) {
        const ticket = rawMaintenance.find((t: any) => (t._id || t.id) === autoOpenTicketId);
        if (ticket) {
          setSelectedTicket(ticket);
          setTicketDetailsOpen(true);
          void loadTicketDetails(ticket._id || ticket.id);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('ticket');
          setSearchParams(newParams, { replace: true });
        }
      }
    }
  }, [rawMaintenance, searchParams, setSearchParams]);

  const handleApproveBooking = async (bookingId: string, approveRemarks?: string) => {
    if (!orgId) return;
    try {
      await BookingApi.updateStatus(orgId, bookingId, 'approve', approveRemarks);
      toast({ title: 'Success', description: 'Booking approved successfully' });
      invalidateRequestCache(`bookings:${orgId}`);
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to approve booking', variant: 'destructive' });
    }
  };

  const handleRejectBooking = async (bookingId: string, rejectRemarks?: string) => {
    if (!orgId) return;
    const remarks = rejectRemarks !== undefined ? rejectRemarks : (prompt('Enter rejection remarks:') || '');
    if (rejectRemarks === undefined && !remarks.trim()) return;
    try {
      await BookingApi.updateStatus(orgId, bookingId, 'reject', remarks);
      toast({ title: 'Success', description: 'Booking rejected successfully' });
      invalidateRequestCache(`bookings:${orgId}`);
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to reject booking', variant: 'destructive' });
    }
  };

  const handleApproveRequisition = async (reqId: string, approveRemarks?: string) => {
    if (!orgId) return;
    try {
      await RequisitionApi.updateStatus(orgId, reqId, 'approve', approveRemarks);
      toast({ title: 'Success', description: 'Requisition approved successfully' });
      invalidateRequestCache(`requisitions:${orgId}`);
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to approve order', variant: 'destructive' });
    }
  };

  const handleCancelRequisition = async (reqId: string, cancelRemarks?: string) => {
    if (!orgId) return;
    const remarks = cancelRemarks !== undefined ? cancelRemarks : (prompt('Enter cancel remarks:') || '');
    if (cancelRemarks === undefined && !remarks.trim()) return;
    try {
      await RequisitionApi.updateStatus(orgId, reqId, 'cancel', remarks);
      toast({ title: 'Success', description: 'Requisition cancelled' });
      invalidateRequestCache(`requisitions:${orgId}`);
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to cancel order', variant: 'destructive' });
    }
  };

  const handleAssignWorker = async (ticketId: string, workerId: string, workerName: string) => {
    if (!orgId) return;
    try {
      await MaintenanceApi.act(orgId, ticketId, {
        action: 'assign_worker',
        workerId,
        workerName,
        remarks: 'Assigned by HOD via Dashboard.'
      });
      toast({ title: 'Success', description: 'Worker assigned successfully' });
      handleRetrySummary();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to assign worker', variant: 'destructive' });
    }
  };

  const handleRetrySummary = () => {
    summaryLoadedFor.current = null;
    summaryInFlight.current = false;
    setSummaryError(null);
    if (role === 'canteen_owner') {
      void loadCanteenSummary();
    } else {
      void loadGeneralSummary();
    }
  };

  if (!user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingState message="Signing you in…" rows={2} />
      </div>
    );
  }

  if (user.role === 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingState message="Opening platform dashboard…" rows={2} />
      </div>
    );
  }

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `Good ${timeOfDay}, ${user.email.split('@')[0]}!`;
  };

  const getQuickActions = () => {
    if (user.role === 'super_admin') {
      return [
        { icon: Users, label: 'Organizations', path: '/super-admin/dashboard', color: 'bg-primary' },
      ];
    }

    if (user.role === 'org_admin' && user.organization) {
      return [
        { icon: Users, label: 'Manage Users', path: `/org/${user.organization}/admin/users`, color: 'bg-primary' },
        { icon: Calendar, label: 'Admin Dashboard', path: `/org/${user.organization}/admin/dashboard`, color: 'bg-warning' },
      ];
    }

    const actions: { icon: React.ComponentType<{ className?: string }>; label: string; path: string; color: string }[] = [];

    if (hasPermission(user.role, PERMISSIONS.UTILITY_VIEW) && user.organization) {
      actions.push({
        icon: Calendar,
        label: 'Book Utility',
        path: `/org/${user.organization}/utilities`,
        color: 'bg-primary',
      });
    }

    if (hasPermission(user.role, PERMISSIONS.CANTEEN_VIEW) && user.organization) {
      actions.push({
        icon: UtensilsCrossed,
        label: user.role === 'canteen_owner' ? 'Canteen Queue' : 'Order Food',
        path: `/org/${user.organization}/canteen`,
        color: 'bg-success',
      });
    }

    if (user.role === 'canteen_owner' && user.organization) {
      actions.push({
        icon: TrendingUp,
        label: 'Billing History',
        path: `/org/${user.organization}/canteen/analytics`,
        color: 'bg-primary',
      });
    }

    if (hasPermission(user.role, PERMISSIONS.MAINTENANCE_CREATE) && user.organization) {
      actions.push({
        icon: Wrench,
        label: 'Report Issue',
        path: `/org/${user.organization}/maintenance`,
        color: 'bg-warning',
      });
    }

    if (hasPermission(user.role, PERMISSIONS.BOOKING_VIEW) && user.organization) {
      actions.push({
        icon: Clock,
        label: 'My Appointments',
        path: `/org/${user.organization}/my-bookings`,
        color: 'bg-muted-foreground',
      });
    }

    return actions;
  };
  const displayStats = stats;

  // ────────────────────────────────────────────────────────────────────────────
  // ROLE DASHBOARD: CANTEEN OWNER
  // ────────────────────────────────────────────────────────────────────────────
  const renderCanteenOwnerDashboard = () => {
    const activeOrders = rawRequisitions.filter(r => ['APPROVED_DIRECTOR', 'PREPARED'].includes(r.status));
    const recentBilling = rawRequisitions.filter(r => r.status === 'HANDED_OVER').slice(0, 5);

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Welcome Section */}
        <div className="bg-[#123458] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <UtensilsCrossed className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">Canteen Owner Console</h2>
            <p className="text-blue-100 text-xs sm:text-sm">Manage menu orders, prep lists, and peon handover tracking.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{stat.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{stat.trend}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center shrink-0 border border-slate-100/50">
                  <stat.icon className="w-5 h-5 text-[#123458]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Lists */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Preparation queue */}
          <Card className="xl:col-span-2 shadow-sm border-slate-200/60 bg-white">
            <CardHeader className="border-b border-slate-50">
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <UtensilsCrossed className="w-4.5 h-4.5 text-blue-600" />
                Active Preparation Queue ({activeOrders.length})
              </CardTitle>
              <CardDescription>Track active orders awaiting kitchen prep or ready for handover</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {activeOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No active orders to prepare</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activeOrders.map(order => (
                    <div key={order._id || order.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-black text-[#123458] bg-blue-50 px-2 py-0.5 rounded-md capitalize">
                            {order.department || order.requesterDepartment || 'General'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">#{String(order._id || order.id).slice(-6).toUpperCase()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">Requester: {order.requesterName}</h4>
                        <div className="mt-1.5 space-y-1">
                          {(order.items || []).map((item: any, idx: number) => (
                            <p key={idx} className="text-xs text-slate-600">
                              • <span className="font-semibold text-slate-800">{item.name || 'Menu item'}</span> x {item.quantity} 
                              {item.reasoning && <span className="text-[10px] text-slate-400 ml-1.5">({item.reasoning})</span>}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {order.status === 'APPROVED_DIRECTOR' ? (
                          <Button 
                            onClick={async () => {
                              const total = parseFloat(prompt("Confirm Total Amount (INR):", String(order.billing?.totalAmount || 0)) || "0");
                              if (!total || isNaN(total)) return;
                              try {
                                const bid = order._id || order.id;
                                await RequisitionApi.markPrepared(orgId!, bid, {
                                  totalAmount: total,
                                  items: (order.items || []).map((item: any) => ({
                                    name: item.name || 'Menu item',
                                    quantity: item.quantity,
                                    unitPrice: total / (order.items?.length || 1),
                                    amount: total / (order.items?.length || 1) * item.quantity
                                  }))
                                });
                                toast({ title: 'Success', description: 'Order marked as prepared!' });
                                invalidateRequestCache(`requisitions:${orgId}`);
                                handleRetrySummary();
                              } catch (err: any) {
                                toast({ title: 'Error', description: err.message || 'Action failed', variant: 'destructive' });
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold px-3.5 h-9"
                          >
                            Mark Prepared
                          </Button>
                        ) : (
                          <Button 
                            onClick={async () => {
                              const peonName = prompt("Enter Peon Name:") || '';
                              if (!peonName.trim()) return;
                              const peonPhone = prompt("Enter Peon Phone Number:") || '';
                              if (!peonPhone.trim()) return;
                              try {
                                const bid = order._id || order.id;
                                await RequisitionApi.handOver(orgId!, bid, { peonName, peonPhone });
                                toast({ title: 'Success', description: 'Order delivered successfully!' });
                                invalidateRequestCache(`requisitions:${orgId}`);
                                handleRetrySummary();
                              } catch (err: any) {
                                toast({ title: 'Error', description: err.message || 'Action failed', variant: 'destructive' });
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-3.5 h-9"
                          >
                            Mark Handed Over
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing summary */}
          <Card className="shadow-sm border-slate-200/60 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Recent Deliveries</CardTitle>
              <CardDescription>Latest processed order requisitions</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {recentBilling.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No billing records found</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentBilling.map(order => (
                    <div key={order._id || order.id} className="p-4 flex items-center justify-between hover:bg-slate-50/20 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{order.requesterName}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{order.department || order.requesterDepartment || 'Department'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-extrabold text-emerald-600">₹{(order.billing?.totalAmount || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Delivered</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ROLE DASHBOARD: HOD (DEPARTMENT HEAD)
  // ────────────────────────────────────────────────────────────────────────────
  const renderHodDashboard = () => {
    // 1. Bookings for department:
    // pending department bookings (for overview and approvals list)
    const deptBookingsPending = rawBookings.filter(b => {
      const isAllowedRole = canApproveBooking('hod', b.status, b.approvalFlow, user?.id);
      if (!isAllowedRole) return false;
      const steps = b.approvalFlow?.filter((s: any) => s.isRequired !== false) || [];
      const hodStep = steps.find((s: any) => normalizeRole(s.role) === 'hod');
      if (hodStep && hodStep.approverId) {
        return hodStep.approverId === user?.id;
      }
      return user?.department && 
        String(b.requesterDepartment).toLowerCase() === String(user.department).toLowerCase();
    });
    // all department bookings
    const deptBookingsAll = rawBookings.filter(b => {
      const steps = b.approvalFlow?.filter((s: any) => s.isRequired !== false) || [];
      const hodStep = steps.find((s: any) => normalizeRole(s.role) === 'hod');
      if (hodStep && hodStep.approverId) {
        return hodStep.approverId === user?.id;
      }
      return user?.department && 
        String(b.requesterDepartment).toLowerCase() === String(user.department).toLowerCase();
    });

    // 2. Canteen requisitions for department:
    // pending HOD clearances
    const deptCanteenPending = rawRequisitions.filter(r => 
      r.status === 'PENDING_HOD' && 
      user?.department && 
      String(r.department || r.requesterDepartment).toLowerCase() === String(user.department).toLowerCase()
    );
    // all department requisitions
    const deptCanteenAll = rawRequisitions.filter(r => 
      user?.department && 
      String(r.department || r.requesterDepartment).toLowerCase() === String(user.department).toLowerCase()
    );

    // 3. Maintenance tickets for department:
    const deptTickets = rawMaintenance.filter(t => 
      user?.department && 
      String(t.department || t.requesterDepartment).toLowerCase() === String(user.department).toLowerCase()
    );
    // top 5 department tickets for overview
    const deptTicketsOverview = deptTickets.slice(0, 5);

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Welcome Section */}
        <div className="bg-[#123458] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <ShieldAlert className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">Department Head Workspace</h2>
            <p className="text-blue-100 text-xs sm:text-sm">Manage utility approvals, budget approvals, and maintenance logs for {user.department || 'your department'}.</p>
          </div>
        </div>

        {/* Tabs Control */}
        <Tabs value={hodTab} onValueChange={(val) => { setHodTab(val as any); setSearchParams({ tab: val }); }} className="w-full">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl flex flex-wrap gap-1 h-auto mb-6">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer">Overview</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer">
              Booking Approvals {deptBookingsPending.length > 0 && <Badge className="ml-1.5 bg-blue-600 text-white font-bold px-1.5 py-0 text-[10px]">{deptBookingsPending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="canteen" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer">
              Canteen Clearances {deptCanteenPending.length > 0 && <Badge className="ml-1.5 bg-emerald-600 text-white font-bold px-1.5 py-0 text-[10px]">{deptCanteenPending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer">Maintenance Tracker</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg text-xs font-semibold px-4 py-2 cursor-pointer">Profile</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <Card key={i} className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{stat.value}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{stat.trend}</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center shrink-0 border border-slate-100/50">
                      <stat.icon className="w-5 h-5 text-[#123458]" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Approvals Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Booking approvals */}
              <Card className="shadow-sm border-slate-200/60 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                    <Calendar className="w-4.5 h-4.5 text-blue-600" />
                    Department Utility Bookings ({deptBookingsPending.length})
                  </CardTitle>
                  <CardDescription>Facility bookings awaiting your HOD recommendation</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {deptBookingsPending.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No utility bookings pending approval</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {deptBookingsPending.map(booking => (
                        <div key={booking._id || booking.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-800">{booking.utilityName} ({booking.categoryName})</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Date: {booking.date} | Slot: {booking.timeSlotLabel}</p>
                            <p className="text-[10px] text-slate-600 font-medium truncate mt-1">Purpose: {booking.purpose}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">By {booking.requesterName || 'N/A'} ({booking.requesterEmail || 'N/A'}) | Phone: {booking.requesterPhone || 'N/A'}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button 
                              onClick={() => { setSelectedBooking(booking); setBookingDetailsOpen(true); }}
                              variant="outline"
                              className="rounded-lg text-[10px] font-bold h-7 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                            >
                              View Details
                            </Button>
                            <Button 
                              onClick={() => handleApproveBooking(booking._id || booking.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer border-none"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleRejectBooking(booking._id || booking.id)}
                              variant="destructive"
                              className="rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Canteen budget approvals */}
              <Card className="shadow-sm border-slate-200/60 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                    <UtensilsCrossed className="w-4.5 h-4.5 text-emerald-600" />
                    Canteen Budget Clearances ({deptCanteenPending.length})
                  </CardTitle>
                  <CardDescription>Canteen requisitions awaiting HOD approval</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {deptCanteenPending.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">No canteen orders pending approval</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {deptCanteenPending.map(req => (
                        <div key={req._id || req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-800">Requisition by {req.requesterName}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">Reason: {req.reasoning || 'Department program'}</p>
                            <p className="text-[10px] text-slate-600 mt-1 font-bold">Billing Est: ₹{(req.billing?.totalAmount || 0).toFixed(2)} | Items: {req.items?.length || 0}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button 
                              onClick={() => { setSelectedRequisition(req); setRequisitionDetailsOpen(true); }}
                              variant="outline"
                              className="rounded-lg text-[10px] font-bold h-7 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                            >
                              View Details
                            </Button>
                            <Button 
                              onClick={() => handleApproveRequisition(req._id || req.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer border-none"
                            >
                              Approve
                            </Button>
                            <Button 
                              onClick={() => handleCancelRequisition(req._id || req.id)}
                              variant="destructive"
                              className="rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Department tickets overview (top 5) */}
            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Wrench className="w-4.5 h-4.5 text-blue-600" />
                    Department Maintenance Tracker
                  </CardTitle>
                  <CardDescription>Latest tickets raised by department members</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setHodTab('maintenance'); setSearchParams({ tab: 'maintenance' }); }}
                  className="text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer"
                >
                  View All
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {deptTicketsOverview.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No department maintenance tickets found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-3 font-bold text-slate-600">Problem</th>
                          <th className="p-3 font-bold text-slate-600">Category</th>
                          <th className="p-3 font-bold text-slate-600">Requester</th>
                          <th className="p-3 font-bold text-slate-600">Worker</th>
                          <th className="p-3 font-bold text-slate-600 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptTicketsOverview.map((t: any) => (
                          <tr key={t._id || t.id} className="border-b border-slate-100 hover:bg-slate-50/25 transition-colors">
                            <td className="p-3 font-semibold text-slate-800">{t.problemTitle}</td>
                            <td className="p-3 capitalize">{t.issueCategory}</td>
                            <td className="p-3 text-slate-500">{t.requesterName}</td>
                            <td className="p-3 text-slate-500">{t.assignedWorkerName || 'Unassigned'}</td>
                            <td className="p-3 text-right">
                              <Badge variant="outline" className="capitalize text-[10px]">
                                {(t.status || '').replace(/_/g, ' ').toLowerCase()}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* BOOKINGS TAB */}
          <TabsContent value="bookings" className="space-y-6">
            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                  <Calendar className="w-4.5 h-4.5 text-blue-600" />
                  All Department Booking Requests ({deptBookingsAll.length})
                </CardTitle>
                <CardDescription>Comprehensive list of facility bookings requested by your department</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {deptBookingsAll.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No utility bookings requested yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-3 font-bold text-slate-600">Utility / Facility</th>
                          <th className="p-3 font-bold text-slate-600">Requester</th>
                          <th className="p-3 font-bold text-slate-600">Date & Slot</th>
                          <th className="p-3 font-bold text-slate-600">Purpose</th>
                          <th className="p-3 font-bold text-slate-600 text-center">Status</th>
                          <th className="p-3 font-bold text-slate-600 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptBookingsAll.map((booking: any) => (
                          <tr key={booking._id || booking.id} className="border-b border-slate-100 hover:bg-slate-50/25 transition-colors">
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{booking.utilityName}</p>
                              <span className="text-[10px] text-slate-400 capitalize">{booking.categoryName}</span>
                            </td>
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{booking.requesterName || 'N/A'}</p>
                              <p className="text-[10px] text-slate-400 leading-tight">{booking.requesterEmail || 'N/A'}</p>
                              <span className="text-[10px] text-slate-400 font-mono">Ph: {booking.requesterPhone || 'N/A'}</span>
                            </td>
                            <td className="p-3 text-slate-600">
                              <p>{booking.date}</p>
                              <span className="text-[10px] text-slate-400">{booking.timeSlotLabel}</span>
                            </td>
                            <td className="p-3 text-slate-500 max-w-[200px] truncate" title={booking.purpose}>{booking.purpose}</td>
                            <td className="p-3 text-center">
                              <Badge className={`capitalize text-[9px] font-bold ${
                                booking.status === 'confirmed' || booking.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                  : booking.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                                  : booking.status?.includes('approved')
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50'
                              }`} variant="outline">
                                {(booking.status || '').replace(/_/g, ' ')}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              {canApproveBooking(role, booking.status, booking.approvalFlow, user?.id) ? (
                                <div className="flex gap-1 justify-end">
                                  <Button 
                                    onClick={() => handleApproveBooking(booking._id || booking.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-2 cursor-pointer border-none"
                                  >
                                    Approve
                                  </Button>
                                  <Button 
                                    onClick={() => handleRejectBooking(booking._id || booking.id)}
                                    variant="destructive"
                                    className="rounded-lg text-[10px] font-bold h-7 px-2 cursor-pointer"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">Decided</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* CANTEEN TAB */}
          <TabsContent value="canteen" className="space-y-6">
            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                  <UtensilsCrossed className="w-4.5 h-4.5 text-emerald-600" />
                  All Department Canteen Requisitions ({deptCanteenAll.length})
                </CardTitle>
                <CardDescription>Clearances and order lists raised by department faculty and assistant</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {deptCanteenAll.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No canteen orders requested yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-3 font-bold text-slate-600">Requisition details</th>
                          <th className="p-3 font-bold text-slate-600">Items</th>
                          <th className="p-3 font-bold text-slate-600">Total Price</th>
                          <th className="p-3 font-bold text-slate-600 text-center">Status</th>
                          <th className="p-3 font-bold text-slate-600 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptCanteenAll.map((req: any) => (
                          <tr key={req._id || req.id} className="border-b border-slate-100 hover:bg-slate-50/25 transition-colors">
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">By {req.requesterName}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Reason: {req.reasoning || req.items?.[0]?.reasoning || 'No reason provided'}</p>
                            </td>
                            <td className="p-3">
                              <div className="space-y-0.5">
                                {req.items?.map((item: any, idx: number) => (
                                  <p key={idx} className="text-[10px] text-slate-600">
                                    • {item.name} x {item.quantity}
                                  </p>
                                )) || <span className="text-slate-400">0 items</span>}
                              </div>
                            </td>
                            <td className="p-3 font-bold text-slate-800">
                              ₹{(req.billing?.totalAmount || req.totalPrice || req.items?.reduce((acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 0), 0) || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <Badge className={`capitalize text-[9px] font-bold ${
                                req.status?.includes('APPROVED')
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                  : req.status?.includes('PENDING')
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50'
                              }`} variant="outline">
                                {(req.status || '').replace(/_/g, ' ').toLowerCase()}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button 
                                  onClick={() => { setSelectedRequisition(req); setRequisitionDetailsOpen(true); }}
                                  variant="outline"
                                  className="rounded-lg text-[10px] font-bold h-7 px-2 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                                >
                                  View Details
                                </Button>
                                {req.status === 'PENDING_HOD' && (
                                  <>
                                    <Button 
                                      onClick={() => handleApproveRequisition(req._id || req.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-2 cursor-pointer border-none"
                                    >
                                      Approve
                                    </Button>
                                    <Button 
                                      onClick={() => handleCancelRequisition(req._id || req.id)}
                                      variant="destructive"
                                      className="rounded-lg text-[10px] font-bold h-7 px-2 cursor-pointer"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                )}
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
          </TabsContent>

          {/* MAINTENANCE TAB */}
          <TabsContent value="maintenance" className="space-y-6">
            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Wrench className="w-4.5 h-4.5 text-blue-600" />
                  Department Maintenance Log ({deptTickets.length})
                </CardTitle>
                <CardDescription>Full log of maintenance tickets reported within your department</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {deptTickets.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No department maintenance tickets found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="p-3 font-bold text-slate-600">Problem</th>
                          <th className="p-3 font-bold text-slate-600">Category</th>
                          <th className="p-3 font-bold text-slate-600">Location</th>
                          <th className="p-3 font-bold text-slate-600">Requester</th>
                          <th className="p-3 font-bold text-slate-600">Worker</th>
                          <th className="p-3 font-bold text-slate-600 text-center">Status</th>
                          <th className="p-3 font-bold text-slate-600 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deptTickets.map((t: any) => (
                          <tr key={t._id || t.id} className="border-b border-slate-100 hover:bg-slate-50/25 transition-colors">
                            <td className="p-3">
                              <p className="font-semibold text-slate-800">{t.problemTitle}</p>
                              <span className="text-[10px] text-slate-400 truncate block max-w-[200px]" title={t.problemDescription}>{t.problemDescription}</span>
                            </td>
                            <td className="p-3 capitalize text-slate-600">{t.issueCategory}</td>
                            <td className="p-3 text-slate-600">{t.location || 'N/A'}</td>
                            <td className="p-3 text-slate-500">
                              <p className="font-medium">{t.requesterName}</p>
                              <span className="text-[10px] text-slate-400">{t.requesterEmail}</span>
                            </td>
                            <td className="p-3 text-slate-500">{t.assignedWorkerName || 'Unassigned'}</td>
                            <td className="p-3 text-center">
                              <Badge variant="outline" className={`capitalize text-[9px] font-bold ${
                                t.status === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                  : isMaintenanceTicketOpen(t.status)
                                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50'
                              }`}>
                                {(t.status || '').replace(/_/g, ' ').toLowerCase()}
                              </Badge>
                            </td>
                            <td className="p-3 text-right">
                              <Button 
                                variant="link" 
                                size="sm" 
                                className="text-blue-600 hover:text-blue-700 font-bold text-xs cursor-pointer p-0"
                                onClick={() => {
                                  setSelectedTicket(t);
                                  setTicketDetailsOpen(true);
                                  void loadTicketDetails(t._id || t.id);
                                }}
                              >
                                View / Chat
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="profile" className="mt-4 animate-fade-in">
            <ProfileSection orgId={orgId!} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ROLE DASHBOARD: REGISTRAR (INSTITUTE SIGN-OFF)
  // ────────────────────────────────────────────────────────────────────────────
  const renderRegistrarDashboard = () => {
    const pendingReqStatus = role === 'registrar' ? 'APPROVED_HOD' : 'APPROVED_REGISTRAR';

    const regBookings = rawBookings.filter(b => canApproveBooking(role, b.status, b.approvalFlow, user?.id));
    const regRequisitions = rawRequisitions.filter(r => r.status === pendingReqStatus);

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Welcome Section */}
        <div className="bg-[#123458] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Building2 className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">
              {role === 'registrar' ? 'Registrar Executive Workspace' : 'Director Executive Workspace'}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm">
              {role === 'registrar' 
                ? 'Review, verify, and stamp booking recommendations and canteen budget requisitions.'
                : 'Review and grant final approvals for campus bookings and canteen budget requisitions.'}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{stat.value}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{stat.trend}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center shrink-0 border border-slate-100/50">
                  <stat.icon className="w-5 h-5 text-[#123458]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Queues */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Booking approvals */}
          <Card className="shadow-sm border-slate-200/60 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <Calendar className="w-4.5 h-4.5 text-blue-600" />
                Pending Booking Sign-offs ({regBookings.length})
              </CardTitle>
              <CardDescription>
                {role === 'registrar'
                  ? 'Bookings recommended by HODs requiring registrar approval'
                  : 'Bookings approved by Registrar requiring Director final sign-off'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {regBookings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No bookings awaiting verification</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {regBookings.map(booking => (
                    <div key={booking._id || booking.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">{booking.utilityName}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {booking.requesterDepartment} dept | Requester: {booking.requesterName || 'N/A'} ({booking.requesterEmail || 'N/A'}) | Ph: {booking.requesterPhone || 'N/A'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Date: {booking.date} | Slot: {booking.timeSlotLabel}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          onClick={() => { setSelectedBooking(booking); setBookingDetailsOpen(true); }}
                          variant="outline"
                          className="rounded-lg text-[10px] font-bold h-7 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                        >
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleApproveBooking(booking._id || booking.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer border-none"
                        >
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleRejectBooking(booking._id || booking.id)}
                          variant="destructive"
                          className="rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Canteen budget approvals */}
          <Card className="shadow-sm border-slate-200/60 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                <UtensilsCrossed className="w-4.5 h-4.5 text-emerald-600" />
                Pending Budget Clearances ({regRequisitions.length})
              </CardTitle>
              <CardDescription>
                {role === 'registrar'
                  ? 'Canteen requisitions recommended by HODs awaiting Registrar sanction'
                  : 'Canteen requisitions approved by Registrar awaiting Director final clearance'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {regRequisitions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No requisitions awaiting budget release</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {regRequisitions.map(req => (
                    <div key={req._id || req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-slate-800">Requisition for {req.department}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">By {req.requesterName} | Reasoning: {req.reasoning}</p>
                        <p className="text-[10px] text-slate-600 mt-1 font-bold">Billing Est: ₹{(req.billing?.totalAmount || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button 
                          onClick={() => { setSelectedRequisition(req); setRequisitionDetailsOpen(true); }}
                          variant="outline"
                          className="rounded-lg text-[10px] font-bold h-7 px-3 border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                        >
                          View Details
                        </Button>
                        <Button 
                          onClick={() => handleApproveRequisition(req._id || req.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer border-none"
                        >
                          Approve
                        </Button>
                        <Button 
                          onClick={() => handleCancelRequisition(req._id || req.id)}
                          variant="destructive"
                          className="rounded-lg text-[10px] font-bold h-7 px-3 cursor-pointer"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ROLE DASHBOARD: WORKSHOP HOD (MAINTENANCE MANAGER)
  // ────────────────────────────────────────────────────────────────────────────
  const renderWorkshopHodDashboard = () => {
    const unassignedTickets = rawMaintenance.filter(t => 
      t.status === 'open' || 
      t.status === 'pending' || 
      t.status === 'PENDING_WORKSHOP_HOD' ||
      t.status === 'BACK_TO_WORKSHOP_AFTER_APPROVALS'
    );
    const activeJobs = rawMaintenance.filter(t => ['assigned', 'in_progress', 'ASSIGNED_TO_WORKER'].includes(t.status));
    const completedCount = rawMaintenance.filter(t => t.status === 'COMPLETED').length;
    const historyJobs = rawMaintenance.filter(t => t.status === 'COMPLETED' || t.status === 'REJECTED');

    // Filter states for Workshop HOD (uses top-level states)
    const filteredQueue = unassignedTickets.filter(t =>
      t.problemTitle.toLowerCase().includes(workshopSearchTerm.toLowerCase()) ||
      t.actualProblem.toLowerCase().includes(workshopSearchTerm.toLowerCase()) ||
      String(t._id || t.id).toLowerCase().includes(workshopSearchTerm.toLowerCase())
    );

    const filteredActive = activeJobs.filter(t =>
      t.problemTitle.toLowerCase().includes(workshopSearchTerm.toLowerCase()) ||
      t.actualProblem.toLowerCase().includes(workshopSearchTerm.toLowerCase()) ||
      String(t._id || t.id).toLowerCase().includes(workshopSearchTerm.toLowerCase())
    );

    const filteredHistory = historyJobs.filter(t =>
      t.problemTitle.toLowerCase().includes(workshopSearchTerm.toLowerCase()) ||
      t.actualProblem.toLowerCase().includes(workshopSearchTerm.toLowerCase()) ||
      String(t._id || t.id).toLowerCase().includes(workshopSearchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Welcome Section */}
        <div className="bg-[#123458] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Wrench className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black mb-1">Maintenance Command Center</h2>
              <p className="text-blue-100 text-xs sm:text-sm">Manage campus assets, assign work orders to technicians, and verify completions.</p>
            </div>
            <Badge className="bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-full border border-white/15 text-[10px] uppercase tracking-wider shrink-0">
              Workshop HOD Workspace
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Awaiting Action</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{unassignedTickets.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">Pending allocation</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center shrink-0 border border-slate-100/50">
                <Clock className="w-5 h-5 text-[#123458]" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Jobs</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{activeJobs.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">In progress</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50/50 flex items-center justify-center shrink-0 border border-indigo-100/50">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Jobs</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{completedCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Resolved repairs</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50/50 flex items-center justify-center shrink-0 border border-emerald-100/50">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Workload</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{rawMaintenance.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">Total overall tickets</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                <Wrench className="w-5 h-5 text-slate-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Controls */}
        <Tabs value={workshopTab} onValueChange={(val) => { setWorkshopTab(val as any); setSearchParams({ workshopTab: val }); }} className="w-full">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="queue" className="rounded-lg text-xs font-semibold px-4 py-2">Queue ({unassignedTickets.length})</TabsTrigger>
            <TabsTrigger value="active" className="rounded-lg text-xs font-semibold px-4 py-2">Active Jobs ({activeJobs.length})</TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg text-xs font-semibold px-4 py-2">History ({historyJobs.length})</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg text-xs font-semibold px-4 py-2">Analytics</TabsTrigger>
            <TabsTrigger value="profile" className="rounded-lg text-xs font-semibold px-4 py-2">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-4 space-y-4 animate-fade-in">
            {/* Search filter row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                value={workshopSearchTerm}
                onChange={(e) => setWorkshopSearchTerm(e.target.value)}
                placeholder="Search queue..."
                className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-[#123458]/20 flex-1"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Tickets list */}
              <Card className="xl:col-span-2 shadow-sm border-slate-200/60 bg-white">
                <CardContent className="p-0">
                  {filteredQueue.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">
                      <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      No unassigned tickets in queue.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredQueue.map(t => (
                        <div key={t._id || t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/10">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${t.issueCategory === 'major' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                                {t.issueCategory}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">#{String(t._id || t.id).slice(-6).toUpperCase()}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${STATUS_COLOR[t.status] || 'bg-slate-100'}`}>
                                {STATUS_LABEL[t.status] || t.status}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t.problemTitle}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.actualProblem}</p>
                            <p className="text-[10px] text-slate-400 mt-1">From {t.department} | By {t.requesterName}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-bold">
                            {workersList.length === 0 ? (
                              <span className="text-[10px] text-slate-400">No workers available</span>
                            ) : (
                              <select 
                                onChange={(e) => {
                                  const workerId = e.target.value;
                                  const wObj = workersList.find(w => w._id === workerId);
                                  if (wObj && confirm(`Assign this job to ${wObj.name}?`)) {
                                    handleAssignWorker(t._id || t.id, wObj._id, wObj.name);
                                  }
                                }}
                                className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#123458]/20 cursor-pointer"
                                defaultValue=""
                              >
                                <option value="" disabled>Assign Worker...</option>
                                {workersList.map(w => (
                                  <option key={w._id} value={w._id}>{w.name}</option>
                                ))}
                              </select>
                            )}
                            <Button 
                              onClick={async () => {
                                setSelectedTicket(t);
                                setTicketDetailsOpen(true);
                                setRemarks('');
                                setSelectedWorkerId('');
                                await loadTicketDetails(t._id || t.id);
                              }}
                              variant="outline" 
                              size="sm"
                              className="h-8 rounded-lg text-xs"
                            >
                              Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Workers Pool (Right Column) */}
              <Card className="shadow-sm border-slate-200/60 bg-white self-start">
                <CardHeader className="p-4 border-b border-slate-50">
                  <CardTitle className="text-sm font-bold text-slate-800">Workers Pool ({workersList.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {workersList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">No workers registered.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {workersList.map(w => {
                        const jobsCount = activeJobs.filter(t => t.assignedWorkerId === w._id).length;
                        return (
                          <div key={w._id} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{w.name}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{w.phone}</p>
                            </div>
                            <Badge variant={jobsCount > 0 ? 'secondary' : 'outline'} className="text-[9px]">
                              {jobsCount} active jobs
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-4 space-y-4 animate-fade-in">
            {/* Search filter row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                value={workshopSearchTerm}
                onChange={(e) => setWorkshopSearchTerm(e.target.value)}
                placeholder="Search active jobs..."
                className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-[#123458]/20 flex-1"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Active Jobs list */}
              <Card className="xl:col-span-2 shadow-sm border-slate-200/60 bg-white">
                <CardContent className="p-0">
                  {filteredActive.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">
                      <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      No active jobs in progress.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredActive.map(t => (
                        <div key={t._id || t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/10">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${t.issueCategory === 'major' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                                {t.issueCategory}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">#{String(t._id || t.id).slice(-6).toUpperCase()}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${STATUS_COLOR[t.status] || 'bg-slate-100'}`}>
                                {STATUS_LABEL[t.status] || t.status}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t.problemTitle}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.actualProblem}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Worker: <span className="font-semibold text-slate-700">{t.assignedWorkerName || 'Unassigned'}</span> | Dept: {t.department}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-bold">
                            <Button 
                              onClick={async () => {
                                setSelectedTicket(t);
                                setTicketDetailsOpen(true);
                                setRemarks('');
                                setSelectedWorkerId('');
                                await loadTicketDetails(t._id || t.id);
                              }}
                              variant="outline" 
                              size="sm"
                              className="h-8 rounded-lg text-xs"
                            >
                              Details
                            </Button>
                            <Button 
                              onClick={() => openChat(t)}
                              className="bg-[#123458] hover:bg-[#123458]/95 text-white h-8 rounded-lg text-xs font-bold"
                            >
                              Chat
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Workers Pool (Right Column) */}
              <Card className="shadow-sm border-slate-200/60 bg-white self-start">
                <CardHeader className="p-4 border-b border-slate-50">
                  <CardTitle className="text-sm font-bold text-slate-800">Workers Pool ({workersList.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {workersList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">No workers registered.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {workersList.map(w => {
                        const jobsCount = activeJobs.filter(t => t.assignedWorkerId === w._id).length;
                        return (
                          <div key={w._id} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{w.name}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{w.phone}</p>
                            </div>
                            <Badge variant={jobsCount > 0 ? 'secondary' : 'outline'} className="text-[9px]">
                              {jobsCount} active jobs
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4 animate-fade-in">
            {/* Search filter row */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <Input
                value={workshopSearchTerm}
                onChange={(e) => setWorkshopSearchTerm(e.target.value)}
                placeholder="Search history..."
                className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-[#123458]/20 flex-1"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* History list */}
              <Card className="xl:col-span-2 shadow-sm border-slate-200/60 bg-white">
                <CardContent className="p-0">
                  {filteredHistory.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 text-sm">
                      <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      No completed or rejected tickets in history.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredHistory.map(t => (
                        <div key={t._id || t.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/10">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${t.issueCategory === 'major' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-50 text-slate-600'}`}>
                                {t.issueCategory}
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">#{String(t._id || t.id).slice(-6).toUpperCase()}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${STATUS_COLOR[t.status] || 'bg-slate-100'}`}>
                                {STATUS_LABEL[t.status] || t.status}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-800">{t.problemTitle}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{t.actualProblem}</p>
                            <p className="text-[10px] text-slate-400 mt-1">Worker: <span className="font-semibold text-slate-700">{t.assignedWorkerName || 'Unassigned'}</span> | Dept: {t.department}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 font-bold">
                            <Button 
                              onClick={async () => {
                                setSelectedTicket(t);
                                setTicketDetailsOpen(true);
                                setRemarks('');
                                setSelectedWorkerId('');
                                await loadTicketDetails(t._id || t.id);
                              }}
                              variant="outline" 
                              size="sm"
                              className="h-8 rounded-lg text-xs"
                            >
                              Details
                            </Button>
                            <Button 
                              onClick={() => openChat(t)}
                              className="bg-[#123458] hover:bg-[#123458]/95 text-white h-8 rounded-lg text-xs font-bold"
                            >
                              Chat
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Workers Pool (Right Column) */}
              <Card className="shadow-sm border-slate-200/60 bg-white self-start">
                <CardHeader className="p-4 border-b border-slate-50">
                  <CardTitle className="text-sm font-bold text-slate-800">Workers Pool ({workersList.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {workersList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">No workers registered.</div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {workersList.map(w => {
                        const jobsCount = activeJobs.filter(t => t.assignedWorkerId === w._id).length;
                        return (
                          <div key={w._id} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{w.name}</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">{w.phone}</p>
                            </div>
                            <Badge variant={jobsCount > 0 ? 'secondary' : 'outline'} className="text-[9px]">
                              {jobsCount} active jobs
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm border-slate-200/60 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-800">Repair Status Breakdown</CardTitle>
                  <CardDescription>Number of maintenance requests per workflow status</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {rawMaintenance.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-10">No ticket logs recorded yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statusBreakdown}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} style={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Tickets count" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200/60 bg-white">
                <CardHeader>
                  <CardTitle className="text-base font-bold text-slate-800">Worker Load Tracker</CardTitle>
                  <CardDescription>Active and completed assignments for each team member</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {workerPerformance.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-10">No assignments logged yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={workerPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="worker" angle={-15} textAnchor="end" height={60} style={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="assigned" fill="#6366f1" radius={[6, 6, 0, 0]} name="Assigned" />
                        <Bar dataKey="completed" fill="#22c55e" radius={[6, 6, 0, 0]} name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="profile" className="mt-4 animate-fade-in">
            <ProfileSection orgId={orgId!} />
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ROLE DASHBOARD: WORKER (MAINTENANCE TECHNICIAN)
  // ────────────────────────────────────────────────────────────────────────────
  const renderWorkerDashboard = () => {
    const myTasks = rawMaintenance.filter(t => 
      t.assignedWorkerId === user.id || 
      t.assignedWorkerEmail === user.email ||
      String(t.assignedWorkerName).toLowerCase() === String(user.email).split('@')[0].toLowerCase()
    );

    const activeTasks = myTasks.filter(t => ['assigned', 'in_progress', 'open', 'ASSIGNED_TO_WORKER', 'BACK_TO_WORKSHOP_AFTER_APPROVALS'].includes(t.status));
    const completedTasksCount = myTasks.filter(t => t.status === 'COMPLETED').length;

    const filteredTasks = myTasks.filter(t => {
      const matchesSearch = t.problemTitle.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
        t.actualProblem.toLowerCase().includes(workerSearchTerm.toLowerCase()) ||
        String(t._id || t.id).toLowerCase().includes(workerSearchTerm.toLowerCase());
      
      const isActive = ['assigned', 'in_progress', 'open', 'ASSIGNED_TO_WORKER', 'BACK_TO_WORKSHOP_AFTER_APPROVALS'].includes(t.status);
      const isCompleted = t.status === 'COMPLETED';

      if (workerStatusFilter === 'active') return matchesSearch && isActive;
      if (workerStatusFilter === 'completed') return matchesSearch && isCompleted;
      return matchesSearch;
    });

    // Recharts task statistics
    const analyticsData = [
      { name: 'Active Tasks', count: activeTasks.length },
      { name: 'Completed Tasks', count: completedTasksCount },
    ];

    return (
      <div className="space-y-6 animate-slide-up">
        {/* Welcome Section */}
        <div className="bg-[#123458] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <Wrench className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black mb-1">Worker Command Center</h2>
              <p className="text-blue-100 text-xs sm:text-sm">Review your assigned repair logs, update completion details, and chat with HODs.</p>
            </div>
            <Badge className="bg-white/20 text-white font-extrabold px-3 py-1.5 rounded-full border border-white/15 text-[10px] uppercase tracking-wider shrink-0">
              Worker Workspace
            </Badge>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Jobs</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{activeTasks.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">Pending resolution</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50/50 flex items-center justify-center shrink-0 border border-slate-100/50">
                <Clock className="w-5 h-5 text-[#123458]" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Jobs</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{completedTasksCount}</p>
                <p className="text-[10px] text-slate-500 mt-1">Total resolved</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50/50 flex items-center justify-center shrink-0 border border-emerald-100/50">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
            <CardContent className="p-5 flex items-center justify-between col-span-2 lg:col-span-1">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Workload</p>
                <p className="text-2xl font-black text-slate-800 leading-tight mt-1">{myTasks.length}</p>
                <p className="text-[10px] text-slate-500 mt-1">All time assigned</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50/50 flex items-center justify-center shrink-0 border border-indigo-100/50">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Controls */}
        <Tabs value={workerTab} onValueChange={(val) => { setWorkerTab(val as any); setSearchParams({ tab: val }); }} className="w-full">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl">
            <TabsTrigger value="tasks" className="rounded-lg text-xs font-semibold px-4 py-2">My Tasks ({myTasks.length})</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-lg text-xs font-semibold px-4 py-2">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4 space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={workerSearchTerm}
                  onChange={(e) => setWorkerSearchTerm(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-9 rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-[#123458]/20"
                />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto shrink-0 pb-1 sm:pb-0">
                {(['all', 'active', 'completed'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setWorkerStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${workerStatusFilter === status ? 'bg-[#123458] text-white shadow-xs' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Tasks Queue List */}
            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardContent className="p-0">
                {filteredTasks.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">
                    <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    No tasks found matching current filters.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {filteredTasks.map(ticket => (
                      <div key={ticket._id || ticket.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/20 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border capitalize ${ticket.issueCategory === 'major' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-slate-50 text-slate-600'}`}>
                              {ticket.issueCategory}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">#{String(ticket._id || ticket.id).slice(-6).toUpperCase()}</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${STATUS_COLOR[ticket.status] || 'bg-slate-100'}`}>
                              {STATUS_LABEL[ticket.status] || ticket.status}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">{ticket.problemTitle}</h4>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{ticket.actualProblem}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Raised by: {ticket.requesterName} | Dept: {ticket.department}</p>
                        </div>
                        <div className="flex gap-2 shrink-0 font-bold">
                          <Button 
                            onClick={async () => {
                              setSelectedTicket(ticket);
                              setTicketDetailsOpen(true);
                              setRemarks('');
                              setSelectedWorkerId('');
                              await loadTicketDetails(ticket._id || ticket.id);
                            }}
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs"
                          >
                            Details
                          </Button>
                          <Button 
                            onClick={() => openChat(ticket)}
                            className="bg-[#123458] hover:bg-[#123458]/95 text-white h-8 rounded-lg text-xs font-bold"
                          >
                            Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4">
            <Card className="shadow-sm border-slate-200/60 bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-800">Job Completion Statistics</CardTitle>
                <CardDescription>Visual breakdown of tasks solved versus pending work</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" style={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#123458" radius={[8, 8, 0, 0]} name="Tickets count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ────────────────────────────────────────────────────────────────────────────
  // ROLE DASHBOARD: DEFAULT (FACULTY / ASSISTANT / COORDINATOR IN SUMMARY)
  // ────────────────────────────────────────────────────────────────────────────
  const renderDefaultDashboard = () => {
    return (
      <div className="space-y-6 sm:space-y-8 animate-slide-up">
        {/* Welcome Section */}
        <div className="bg-[#123458] text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10">
            <TrendingUp className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-1">{getWelcomeMessage()}</h2>
            <p className="text-blue-100 text-xs sm:text-sm">Welcome back to {user.orgName}. Here is your quick activities summary.</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {stats.map((stat, index) => (
            <Card key={index} className="hover-card-lift border-slate-100/60 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.04)]">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider truncate">
                      {stat.label}
                    </p>
                    <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stat.value}</p>
                    <p className="text-[10px] text-slate-500 mt-1 truncate">{stat.trend}</p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-blue-50/50 border border-slate-100/50 rounded-xl flex items-center justify-center">
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#123458]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {quickActions.length > 0 && (
          <Card className="shadow-sm border-slate-200/60 bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-800">Quick Actions</CardTitle>
              <CardDescription>Frequently used features for your role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => navigate(action.path)}
                    className="h-auto p-4 sm:p-5 flex flex-col items-center gap-3 transition-all hover:bg-blue-50/20 border-slate-200/80 hover:border-blue-200 rounded-2xl group shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <div
                      className={`w-11 h-11 ${action.color} rounded-xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 duration-200`}
                    >
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-slate-700 text-xs sm:text-sm text-center">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm border-slate-200/60 bg-white">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800">Recent Activity Log</CardTitle>
            <CardDescription>Latest updates from your modules</CardDescription>
          </CardHeader>
          <CardContent>
            {displayActivity.length === 0 ? (
              <EmptyState
                icon={<Inbox className="h-12 w-12 text-slate-300" />}
                title="No recent activity"
                description="Book a facility, place a canteen order, or raise a maintenance ticket to see updates here."
                action={
                  hasPermission(user.role, PERMISSIONS.UTILITY_VIEW) && user.organization ? (
                    <Button onClick={() => navigate(`/org/${user.organization}/utilities`)} className="rounded-xl font-bold bg-[#123458] hover:bg-[#1e4b77] text-white">
                      Book a utility
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <div className="space-y-3">
                {displayActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-3 border border-slate-100 rounded-xl hover:bg-slate-50/20 transition-all duration-200"
                  >
                    <div
                      className={`w-2.5 h-2.5 mt-1.5 rounded-full shrink-0 ${
                        activity.type === 'success'
                          ? 'bg-emerald-500'
                          : activity.type === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-[#123458]'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-700 break-words">
                        {activity.action}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const WORKFLOW_STEPS = [
    { label: 'Dept HOD', statuses: ['PENDING_DEPT_HOD'] },
    { label: 'Workshop HOD', statuses: ['PENDING_WORKSHOP_HOD'] },
    { label: 'Worker', statuses: ['ASSIGNED_TO_WORKER', 'BACK_TO_WORKSHOP_AFTER_APPROVALS'] },
    { label: 'Completed', statuses: ['COMPLETED'] },
  ];

  const getStepState = (stepStatuses: string[], currentStatus: string) => {
    if (currentStatus === 'REJECTED') return 'pending';
    const orderedAll = [
      'PENDING_DEPT_HOD',
      'PENDING_WORKSHOP_HOD',
      'BACK_TO_WORKSHOP_AFTER_APPROVALS',
      'ASSIGNED_TO_WORKER',
      'COMPLETED',
    ];
    let mappedStatus = currentStatus;
    if (['PENDING_BUDGET_DEPT_HOD', 'PENDING_REGISTRAR', 'PENDING_DIRECTOR', 'PAUSED'].includes(currentStatus)) {
      mappedStatus = 'BACK_TO_WORKSHOP_AFTER_APPROVALS';
    }
    const currentIdx = orderedAll.indexOf(mappedStatus);
    
    const stepIndices = stepStatuses.map(s => orderedAll.indexOf(s));
    const minStepIdx = Math.min(...stepIndices);
    const maxStepIdx = Math.max(...stepIndices);

    if (currentStatus === 'COMPLETED') return 'completed';
    if (currentIdx > maxStepIdx) return 'completed';
    if (currentIdx >= minStepIdx && currentIdx <= maxStepIdx) return 'current';
    return 'pending';
  };

  const renderWorkflowProgress = (currentStatus: string) => {
    return (
      <div className="flex items-center justify-between w-full mt-2 relative">
        {/* Connector line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
        
        {WORKFLOW_STEPS.map((step, idx) => {
          const state = getStepState(step.statuses, currentStatus);
          let bgClass = 'bg-slate-100 border-slate-200 text-slate-400';
          let labelClass = 'text-slate-400';
          
          if (state === 'completed') {
            bgClass = 'bg-emerald-500 border-emerald-600 text-white z-10';
            labelClass = 'text-emerald-600 font-bold';
          } else if (state === 'current') {
            bgClass = 'bg-[#123458] border-[#123458] text-white z-10';
            labelClass = 'text-[#123458] font-bold';
          } else {
            bgClass = 'bg-white border-slate-200 text-slate-400 z-10';
          }
          
          return (
            <div key={idx} className="flex flex-col items-center gap-1 z-10 relative">
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold ${bgClass}`}>
                {state === 'completed' ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span className={`text-[9px] font-medium tracking-tight ${labelClass}`}>{step.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDashboardContent = () => {
    const activeTab = searchParams.get('tab');
    if (activeTab === 'profile' && ['registrar', 'director', 'assistant'].includes(role)) {
      return (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setSearchParams({})}
              className="p-2 h-auto text-slate-500 hover:text-slate-800 flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Button>
          </div>
          <ProfileSection orgId={orgId!} />
        </div>
      );
    }

    if (role === 'canteen_owner') return renderCanteenOwnerDashboard();
    if (role === 'hod') return renderHodDashboard();
    if (role === 'registrar' || role === 'director') return renderRegistrarDashboard();
    if (role === 'workshop_hod') return renderWorkshopHodDashboard();
    if (role === 'worker') return renderWorkerDashboard();
    return renderDefaultDashboard();
  };

  const displayActivity = user.role === 'canteen_owner' ? canteenRecent : recentActivity;
  const isLoading = user.role === 'canteen_owner' ? canteenLoading : summaryLoading;
  const quickActions = getQuickActions();

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6 sm:space-y-8 animate-fade-in">
        {summaryError && (
          <ErrorState message={summaryError} onRetry={handleRetrySummary} />
        )}

        {isLoading && !summaryError ? (
          <LoadingState message="Loading your command center summary…" rows={5} />
        ) : (
          !summaryError && renderDashboardContent()
        )}
      </div>

      {/* Ticket Details Dialog */}
      <Dialog open={ticketDetailsOpen} onOpenChange={setTicketDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-slate-100 p-6 shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800">
              Ticket Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-5">
              {/* Metadata row */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{String(selectedTicket._id || selectedTicket.id).slice(-6).toUpperCase()}
                  </span>
                  <h3 className="text-sm font-black text-slate-700 mt-0.5">
                    {selectedTicket.problemTitle}
                  </h3>
                </div>
                <Badge className={`capitalize text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${STATUS_COLOR[selectedTicket.status] || 'bg-slate-50 text-slate-600'}`}>
                  {STATUS_LABEL[selectedTicket.status] || selectedTicket.status}
                </Badge>
              </div>

              {/* Progress Tracker Card */}
              <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Repair Status Progress</p>
                {renderWorkflowProgress(selectedTicket.status)}
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Requester</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedTicket.requesterName || 'N/A'}</p>
                  <p className="text-slate-400">{selectedTicket.requesterEmail || ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department</p>
                  <p className="font-semibold text-slate-700 mt-0.5">{selectedTicket.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category</p>
                  <p className="font-semibold capitalize text-slate-700 mt-0.5">{selectedTicket.issueCategory || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Worker</p>
                  <p className="font-semibold text-slate-700 mt-0.5">
                    {selectedTicket.assignedWorkerName || 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* Problem Description */}
              <div className="text-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Problem Description</p>
                <p className="text-slate-600 bg-slate-50/50 border border-slate-100 rounded-xl p-3 mt-1 leading-relaxed">
                  {selectedTicket.actualProblem}
                </p>
              </div>

              {/* Items to Repair */}
              {selectedTicket.itemsToRepair && selectedTicket.itemsToRepair.length > 0 && (
                <div className="text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Items to Repair</p>
                  <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {selectedTicket.itemsToRepair.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2.5 bg-white">
                        <span className="font-semibold text-slate-700">{it.name}</span>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          Qty: {it.quantity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussion Chat Shortcut */}
              {(role === 'workshop_hod' || role === 'worker') && (
                <div className="border border-[#123458]/10 bg-slate-50/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-700">Discussion Workspace</p>
                    <p className="text-[10px] text-slate-400">Discuss issues, share updates, and upload images/files.</p>
                  </div>
                  <Button
                    onClick={() => {
                      setTicketDetailsOpen(false);
                      openChat(selectedTicket);
                    }}
                    className="bg-[#123458] hover:bg-[#123458]/90 text-white rounded-xl text-xs font-bold h-9 px-4 flex items-center gap-2 shadow-sm shrink-0 w-full sm:w-auto justify-center"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Discussion Chat
                    {selectedTicket.comments && selectedTicket.comments.length > 0 && (
                      <Badge className="bg-white text-[#123458] font-bold hover:bg-slate-100 shrink-0">
                        {selectedTicket.comments.length}
                      </Badge>
                    )}
                  </Button>
                </div>
              )}

              {/* Action Log History */}
              {selectedTicket.actionLogs && selectedTicket.actionLogs.length > 0 && (
                <div className="text-xs">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">History & Remarks</p>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedTicket.actionLogs.map((log: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-2 bg-slate-50/30 rounded-lg border border-slate-100/50">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.action === 'reject' ? 'bg-red-500' : log.action === 'complete' ? 'bg-emerald-500' : 'bg-[#123458]'}`} />
                        <div>
                          <p className="font-semibold text-slate-700">
                            {log.actorName} <span className="text-slate-400 font-normal">({log.role})</span>
                          </p>
                          <p className="text-[10px] text-slate-500 capitalize">Action: {log.action.replace(/_/g, ' ')}</p>
                          {log.remarks && (
                            <p className="text-xs text-slate-500 italic mt-0.5 bg-white border border-slate-100 rounded-md p-1.5">
                              "{log.remarks}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions panel card */}
              {selectedTicket.status !== 'COMPLETED' && selectedTicket.status !== 'REJECTED' && (
                <div className="border border-[#123458]/10 bg-slate-50/50 rounded-2xl p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-700">Perform Action</p>
                  {selectedTicket.status !== 'PAUSED' && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Comments</Label>
                      <Input
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Add remarks..."
                        className="rounded-xl border-slate-200 text-xs focus:ring-1 focus:ring-[#123458]/20"
                      />
                    </div>
                  )}

                  {/* Worker Action */}
                  {role === 'worker' && selectedTicket.status === 'ASSIGNED_TO_WORKER' && (
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleWorkerCompleteTicket(selectedTicket._id || selectedTicket.id, remarks)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm border-none cursor-pointer"
                      >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark Completed
                      </Button>
                      <Button
                        onClick={() => handlePauseTicketClick(selectedTicket._id || selectedTicket.id)}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm border-none cursor-pointer"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause Ticket
                      </Button>
                    </div>
                  )}

                  {/* Workshop HOD Action */}
                  {role === 'workshop_hod' && (
                    <div className="space-y-3 pt-1">
                      {selectedTicket.status === 'PENDING_WORKSHOP_HOD' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Worker</Label>
                            {workersList.length === 0 ? (
                              <p className="text-xs text-slate-400">No workers registered. Add workers in the Maintenance module.</p>
                            ) : (
                              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                                <SelectTrigger className="rounded-xl border-slate-200 text-xs">
                                  <SelectValue placeholder="Select worker" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {workersList.map((w: any) => (
                                    <SelectItem key={w._id} value={w._id} className="text-xs rounded-lg">
                                      {w.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Button
                            onClick={() => handleApproveAndAssignDialog(selectedTicket._id || selectedTicket.id, selectedWorkerId, remarks)}
                            disabled={!selectedWorkerId}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm"
                          >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Approve & Assign
                          </Button>
                        </>
                      )}

                      {selectedTicket.status === 'BACK_TO_WORKSHOP_AFTER_APPROVALS' && (
                        <>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign Worker</Label>
                            {workersList.length === 0 ? (
                              <p className="text-xs text-slate-400">No workers registered. Add workers in the Maintenance module.</p>
                            ) : (
                              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                                <SelectTrigger className="rounded-xl border-slate-200 text-xs">
                                  <SelectValue placeholder="Select worker" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                  {workersList.map((w: any) => (
                                    <SelectItem key={w._id} value={w._id} className="text-xs rounded-lg">
                                      {w.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              const w = workersList.find((x: any) => x._id === selectedWorkerId);
                              if (w) {
                                handleAssignWorkerDialog(selectedTicket._id || selectedTicket.id, w._id, w.name, remarks);
                              }
                            }}
                            disabled={!selectedWorkerId}
                            className="w-full bg-[#123458] hover:bg-[#123458]/95 text-white font-bold text-xs h-9 rounded-xl shadow-sm"
                          >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Assign Worker
                          </Button>
                        </>
                      )}

                      {selectedTicket.status === 'ASSIGNED_TO_WORKER' && (
                        <div className="space-y-2">
                          <Button
                            onClick={() => handleCompleteTicketDialog(selectedTicket._id || selectedTicket.id, remarks)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm border-none cursor-pointer"
                          >
                            <CheckCheck className="w-4 h-4 mr-2" />
                            Mark Completed
                          </Button>
                          <Button
                            onClick={() => handlePauseTicketClick(selectedTicket._id || selectedTicket.id)}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm border-none cursor-pointer"
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pause Ticket
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reopen Action (Requester, HOD, Admins) */}
                  {selectedTicket.status === 'PAUSED' && canReopenTicket(selectedTicket) && (
                    <Button
                      onClick={() => handleReopenTicketClick(selectedTicket._id || selectedTicket.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm border-none cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reopen Ticket
                    </Button>
                  )}

                  {/* Department HOD Actions */}
                  {role === 'hod' && (
                    <div className="space-y-3 pt-1">
                      {selectedTicket.status === 'PENDING_DEPT_HOD' && (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleDeptHodApproveTicket(selectedTicket._id || selectedTicket.id, remarks)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm border-none cursor-pointer"
                          >
                            <Check className="w-4 h-4 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleDeptHodRejectTicket(selectedTicket._id || selectedTicket.id, remarks)}
                            variant="destructive"
                            className="flex-1 font-bold text-xs h-9 rounded-xl shadow-sm cursor-pointer"
                          >
                            <X className="w-4 h-4 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {selectedTicket.status === 'PENDING_BUDGET_DEPT_HOD' && (
                        <Button
                          onClick={() => handleDeptHodApproveTicket(selectedTicket._id || selectedTicket.id, remarks)}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 rounded-xl shadow-sm border-none cursor-pointer"
                        >
                          <CheckCheck className="w-4 h-4 mr-2" />
                          Approve Budget
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── WhatsApp-style Chat Sidebar ─── */}
      {chatOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setChatOpen(false)} />

          {/* Chat panel */}
          <div className="relative z-10 flex flex-col w-full max-w-md h-full bg-[#efeae2] shadow-2xl border-l">
            {/* Chat header */}
            <div className="flex items-center gap-3 p-3.5 bg-[#008069] text-white shrink-0 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white uppercase tracking-wider relative shrink-0">
                {(selectedTicket.problemTitle || '').slice(0, 2)}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] border-2 border-[#008069] rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-bold text-sm truncate">{selectedTicket.problemTitle}</p>
                <div className="flex items-center gap-1 text-[11px] text-white/80">
                  <span className="font-medium">{selectedTicket.department}</span>
                  <span>•</span>
                  <span className="bg-white/10 px-1.5 py-0.5 rounded capitalize text-[10px]">
                    {(selectedTicket.status || '').replace(/_/g, ' ').toLowerCase()}
                  </span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Worker "Work is Done" banner */}
            {canWorkerComplete(selectedTicket) && (
              <div className="shrink-0 px-4 py-2.5 bg-[#efeae2] border-b border-[#008069]/10 flex items-center justify-between">
                <span className="text-xs text-[#008069] font-bold uppercase tracking-wider">Assigned Task</span>
                <Button
                  size="sm"
                  className="bg-[#00a884] hover:bg-[#008f72] text-white h-8 rounded-lg text-xs font-bold shadow-xs cursor-pointer border-none"
                  onClick={async () => {
                    if (!confirm('Mark this work as done? This will complete the ticket.')) return;
                    await handleWorkerCompleteTicket(selectedTicket._id || selectedTicket.id, 'Work marked done by assigned worker.');
                    setChatOpen(false);
                  }}
                >
                  <CheckCheck className="w-3.5 h-3.5 mr-1" /> Work is Done
                </Button>
              </div>
            )}

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: '#efeae2', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)', backgroundSize: '16px 16px' }}>
              {(!selectedTicket.comments || selectedTicket.comments.length === 0) ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageSquare className="w-12 h-12 text-[#8696a0]/60 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-[#667781]">No messages yet</p>
                  <p className="text-xs text-[#8696a0] mt-1">Start the conversation below.</p>
                </div>
              ) : (
                selectedTicket.comments.map((c: any, idx: number) => {
                  const isMine = c.authorRole === role || c.authorName === email;
                  return (
                    <div key={idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%] flex flex-col gap-0.5">
                        {/* Sender label */}
                        {!isMine && (
                          <span className="text-[10px] font-bold text-[#128c7e] ml-2 mb-0.5">
                            {(c.authorName || '').split('@')[0]} ({c.authorRole === 'workshop_hod' ? 'Workshop HOD' : 'Worker'})
                          </span>
                        )}
                        {/* Bubble */}
                        <div className={`relative rounded-xl px-3.5 py-1.5 text-sm shadow-xs ${
                          isMine
                            ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none border border-[#e1f7de]/50'
                            : 'bg-white text-[#111b21] rounded-tl-none border border-slate-100'
                        }`}>
                          {c.attachmentUrl && (
                            <div className="mb-2">
                              <AttachmentPreview url={c.attachmentUrl} name={c.attachmentName} type={c.attachmentType} />
                            </div>
                          )}
                          {c.content && <p className="break-words pr-12 pb-1 text-left">{c.content}</p>}
                          <div className="absolute right-2 bottom-1 flex items-center gap-1">
                            <span className="text-[9px] text-[#667781]/80 select-none">
                              {formatCommentTime(c.createdAt)}
                            </span>
                            {isMine && (
                              <span className="text-[10px] text-[#53bdeb] font-black select-none">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* File preview */}
            {chatFile && chatFilePreview && (
              <div className="shrink-0 px-4 py-2 border-t bg-[#f0f2f5] flex items-center gap-3">
                {chatFile.type.startsWith('image/') ? (
                  <img src={chatFilePreview} alt="preview" className="w-12 h-12 object-cover rounded" />
                ) : chatFile.type.startsWith('video/') ? (
                  <Video className="w-8 h-8 text-[#008069]" />
                ) : (
                  <FileText className="w-8 h-8 text-[#008069]" />
                )}
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{chatFile.name}</p>
                  <p className="text-xs text-muted-foreground">{(chatFile.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => { setChatFile(null); setChatFilePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="cursor-pointer">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}

            {/* Input area */}
            {isStaff && (selectedTicket.status || '').toUpperCase() !== 'COMPLETED' && (selectedTicket.status || '').toUpperCase() !== 'REJECTED' ? (
              <div className="shrink-0 p-3 bg-[#f0f2f5] border-t border-slate-200/80 flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={handleFileSelect} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-slate-200/50 transition-colors text-[#54656f] cursor-pointer shrink-0"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <textarea
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full resize-none rounded-xl border-none bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-0 max-h-32 overflow-y-auto text-[#111b21] shadow-xs placeholder-[#667781]"
                    style={{ minHeight: '40px' }}
                  />
                </div>
                <button
                  onClick={sendChatMessage}
                  disabled={sendingChat || (!chatText.trim() && !chatFile)}
                  className="p-2.5 rounded-full bg-[#00a884] hover:bg-[#008f72] text-white disabled:opacity-50 transition-all shrink-0 cursor-pointer shadow-sm hover:shadow border-none"
                >
                  {sendingChat ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="shrink-0 p-4 border-t bg-[#f0f2f5] text-center">
                <p className="text-xs text-[#667781] flex items-center justify-center gap-1 font-medium">
                  {((selectedTicket.status || '').toUpperCase() === 'COMPLETED' || (selectedTicket.status || '').toUpperCase() === 'REJECTED') ? (
                    <>
                      {(selectedTicket.status || '').toUpperCase() === 'COMPLETED' ? <Check className="w-3.5 h-3.5 text-[#00a884] font-bold" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                      Chat closed — ticket is {(selectedTicket.status || '').toLowerCase()}.
                    </>
                  ) : (
                    <>Read-only Mode. Only workshop staff can send messages.</>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Pause Ticket Dialog inside Dashboard ─── */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white border border-[#123458]/10 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <Pause className="w-5 h-5 text-yellow-600" />
              Pause Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              Pausing this ticket will notify all panel members and the faculty/requester.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Pause Reason <span className="text-red-500">*</span></Label>
              <Textarea
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="Why is this ticket being paused? (e.g., waiting for parts, faculty needs to provide access, etc.)"
                rows={3}
                className="resize-none rounded-xl text-xs border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" className="text-xs font-semibold rounded-xl" onClick={() => setPauseDialogOpen(false)} disabled={pausingTicket}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
              onClick={handleConfirmPause}
              disabled={!pauseReason.trim() || pausingTicket}
            >
              {pausingTicket ? 'Pausing...' : 'Confirm Pause'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reopen Ticket Dialog inside Dashboard ─── */}
      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white border border-[#123458]/10 shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              Reopen Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <p className="text-xs text-slate-500 leading-relaxed">
              Reopening this ticket will notify the Workshop HOD, the assigned worker, and all panel members. The same worker will resume work on this ticket.
            </p>
            {selectedTicket?.pauseReason && (
              <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                <p className="text-[10px] font-bold text-yellow-700 mb-0.5 uppercase tracking-wider">Original Pause Reason:</p>
                <p className="text-xs text-yellow-800 leading-relaxed">"{selectedTicket.pauseReason}"</p>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Reopen Reason <span className="text-red-500">*</span></Label>
              <Textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Why is this ticket being reopened? (e.g., access granted, ready to resume, etc.)"
                rows={3}
                className="resize-none rounded-xl text-xs border-slate-200"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" className="text-xs font-semibold rounded-xl" onClick={() => setReopenDialogOpen(false)} disabled={reopeningTicket}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
              onClick={handleConfirmReopen}
              disabled={!reopenReason.trim() || reopeningTicket}
            >
              {reopeningTicket ? 'Reopening...' : 'Confirm Reopen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Booking Details Dialog ─── */}
      <Dialog open={bookingDetailsOpen} onOpenChange={setBookingDetailsOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white border border-[#123458]/10 shadow-xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <Calendar className="w-5 h-5 text-primary" />
              Booking Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 py-1 text-xs text-left">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Facility / Utility</p>
                  <p className="font-semibold text-slate-800">{selectedBooking.utilityName} ({selectedBooking.categoryName || 'N/A'})</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Current Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLOR[selectedBooking.status.toUpperCase()] || 'bg-slate-100 text-slate-700'}`}>
                    {selectedBooking.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Date</p>
                  <p className="font-semibold text-slate-800">{selectedBooking.date}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Time Slot</p>
                  <p className="font-semibold text-slate-800">{selectedBooking.timeSlotLabel}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-500 mb-0.5">Booking Purpose</p>
                <p className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 text-slate-700 leading-relaxed italic">
                  "{selectedBooking.purpose || 'No purpose declared'}"
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-600 border-b pb-0.5">Requester Information</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><span className="font-semibold text-slate-500">Name:</span> {selectedBooking.requesterName || 'N/A'}</p>
                  <p><span className="font-semibold text-slate-500">Email:</span> {selectedBooking.requesterEmail || 'N/A'}</p>
                  <p><span className="font-semibold text-slate-500">Role:</span> {selectedBooking.requesterRole || 'N/A'}</p>
                  <p><span className="font-semibold text-slate-500">Department:</span> {selectedBooking.requesterDepartment || 'N/A'}</p>
                  <p><span className="font-semibold text-slate-500">Phone:</span> {selectedBooking.requesterPhone || 'N/A'}</p>
                </div>
              </div>

              {selectedBooking.customFieldValues && Object.keys(selectedBooking.customFieldValues).length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-600 border-b pb-0.5">Additional Details</p>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    {Object.entries(selectedBooking.customFieldValues).map(([k, v]) => (
                      <p key={k}><span className="font-semibold text-slate-500 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span> {String(v)}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Approval History */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-600 border-b pb-0.5">Approval History & Audit Trail</p>
                {selectedBooking.approvals && selectedBooking.approvals.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedBooking.approvals.map((app: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-700 uppercase tracking-wide">{app.role} ({app.approverName || 'Approver'})</p>
                          <p className="text-[10px] text-slate-500">{new Date(app.timestamp).toLocaleString('en-IN')}</p>
                          {app.remarks && <p className="text-slate-600 mt-1 italic">Remarks: "{app.remarks}"</p>}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${app.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No approvals recorded yet. Awaiting initial step.</p>
                )}
              </div>

              {/* Remarks Form */}
              {(canApproveBooking(role, selectedBooking.status, selectedBooking.approvalFlow, user?.id) ||
                canRejectBooking(role, selectedBooking.status, selectedBooking.approvalFlow, user?.id)) && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="font-bold text-slate-600">Decision Remarks / Comments</Label>
                  <Textarea
                    value={bookingRemarks}
                    onChange={(e) => setBookingRemarks(e.target.value)}
                    placeholder="Enter remarks for approval or rejection reference..."
                    rows={2}
                    className="resize-none rounded-xl text-xs"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" className="text-xs font-semibold rounded-xl" onClick={() => { setBookingDetailsOpen(false); setBookingRemarks(''); }} disabled={actioningBooking}>
              Close
            </Button>
            {selectedBooking && canRejectBooking(role, selectedBooking.status, selectedBooking.approvalFlow, user?.id) && (
              <Button
                variant="destructive"
                className="text-xs font-semibold rounded-xl cursor-pointer"
                disabled={actioningBooking}
                onClick={async () => {
                  setActioningBooking(true);
                  const bid = selectedBooking.id || selectedBooking._id;
                  await handleRejectBooking(bid, bookingRemarks);
                  setActioningBooking(false);
                  setBookingDetailsOpen(false);
                  setBookingRemarks('');
                }}
              >
                Reject Request
              </Button>
            )}
            {selectedBooking && canApproveBooking(role, selectedBooking.status, selectedBooking.approvalFlow, user?.id) && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
                disabled={actioningBooking}
                onClick={async () => {
                  setActioningBooking(true);
                  const bid = selectedBooking.id || selectedBooking._id;
                  await handleApproveBooking(bid, bookingRemarks);
                  setActioningBooking(false);
                  setBookingDetailsOpen(false);
                  setBookingRemarks('');
                }}
              >
                Approve Request
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Requisition Details Dialog ─── */}
      <Dialog 
        open={requisitionDetailsOpen} 
        onOpenChange={(open) => {
          setRequisitionDetailsOpen(open);
          if (!open) {
            setIsEditingItems(false);
            setEditRemarks('');
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl bg-white border border-[#123458]/10 shadow-xl overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
              <UtensilsCrossed className="w-5 h-5 text-success" />
              Canteen Requisition Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequisition && (
            <div className="space-y-4 py-1 text-xs text-left">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Department</p>
                  <p className="font-semibold text-slate-800">{selectedRequisition.department || 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Current Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100`}>
                    {selectedRequisition.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Submitted At</p>
                  <p className="font-semibold text-slate-800">{selectedRequisition.submittedAt ? new Date(selectedRequisition.submittedAt).toLocaleString('en-IN') : 'N/A'}</p>
                </div>
                <div>
                  <p className="font-bold text-slate-500 mb-0.5">Billing Total</p>
                  <p className="font-bold text-green-700">₹{selectedRequisition.billing?.totalAmount || 0}</p>
                </div>
              </div>

              <div>
                <p className="font-bold text-slate-500 mb-0.5">Event Reasoning / Program</p>
                <p className="p-2.5 bg-slate-50/50 rounded-lg border border-slate-100 text-slate-700 leading-relaxed italic">
                  "{selectedRequisition.reasoning || selectedRequisition.items?.[0]?.reasoning || 'No details provided'}"
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-600 border-b pb-0.5">Requester Information</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <p><span className="font-semibold text-slate-500">Name:</span> {selectedRequisition.requesterName || 'N/A'}</p>
                  <p><span className="font-semibold text-slate-500">Email:</span> {selectedRequisition.requesterEmail || 'N/A'}</p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center border-b pb-0.5">
                  <p className="font-bold text-slate-600">Requested Items</p>
                  {canEditRequisition(selectedRequisition) && !isEditingItems && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const resolved = selectedRequisition.items.map((item: any) => {
                          const menu = menuItems.find(m => m.name === item.name);
                          return {
                            menuItemId: menu?._id || '',
                            name: item.name,
                            type: item.type,
                            quantity: item.quantity,
                            unit: item.unit
                          };
                        }).filter((item: any) => item.menuItemId);
                        setEditItems(resolved);
                        setEditRemarks('');
                        setIsEditingItems(true);
                      }}
                      className="border-[#123458] text-[#123458] hover:bg-[#123458]/5 h-6 px-2 text-[10px] font-bold cursor-pointer"
                    >
                      <Pencil className="w-3 h-3 mr-1" /> Edit Items
                    </Button>
                  )}
                </div>

                {isEditingItems ? (
                  <div className="border border-slate-100 rounded-xl bg-white p-3 space-y-4">
                    <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1">
                      {editItems.map((item, idx) => (
                        <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                            <span className="text-[10px] text-slate-500 capitalize">{item.type} ({item.unit})</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it));
                              }}
                              className="w-6 h-6 flex items-center justify-center border rounded-md hover:bg-slate-50 font-bold"
                            >
                              -
                            </button>
                            <span className="font-bold w-5 text-center text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditItems(prev => prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it));
                              }}
                              className="w-6 h-6 flex items-center justify-center border rounded-md hover:bg-slate-50 font-bold"
                            >
                              +
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditItems(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-6 w-6"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <Select
                        value={addItemId}
                        onValueChange={(val) => {
                          const menu = menuItems.find(m => m._id === val);
                          if (!menu) return;
                          if (editItems.some(i => i.menuItemId === val)) {
                            toast({ title: "Already added", description: `${menu.name} is already in the list`, variant: "destructive" });
                            return;
                          }
                          setEditItems(prev => [...prev, {
                            menuItemId: menu._id,
                            name: menu.name,
                            type: menu.type,
                            quantity: 1,
                            unit: menu.unit
                          }]);
                          setAddItemId('');
                        }}
                      >
                        <SelectTrigger className="flex-1 bg-white h-8 text-xs">
                          <SelectValue placeholder="Add another item to order..." />
                        </SelectTrigger>
                        <SelectContent>
                          {menuItems.filter(m => m.isActive !== false).map(m => (
                            <SelectItem key={m._id} value={m._id}>
                              {m.name} (₹{m.price || 0})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-bold text-[#123458]">
                        Modification Remarks *
                      </Label>
                      <Input
                        value={editRemarks}
                        onChange={(e) => setEditRemarks(e.target.value)}
                        placeholder="Enter modification remarks..."
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingItems(false);
                          setEditRemarks('');
                        }}
                        disabled={actioningRequisition}
                        className="h-8 text-xs cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={async () => {
                          if (editItems.length === 0) {
                            toast({ title: "Validation", description: "At least one item is required", variant: "destructive" });
                            return;
                          }
                          if (!editRemarks.trim()) {
                            toast({ title: "Validation", description: "Modification remarks are required", variant: "destructive" });
                            return;
                          }
                          setActioningRequisition(true);
                          try {
                            const rid = selectedRequisition._id || selectedRequisition.id;
                            await RequisitionApi.update(orgId!, rid, {
                              items: editItems.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
                              remarks: editRemarks.trim() || undefined
                            });
                            toast({ title: "Success", description: "Order items modified successfully" });
                            setIsEditingItems(false);
                            setEditRemarks('');
                            const res = await RequisitionApi.get(orgId!, rid);
                            setSelectedRequisition(res.data);
                            // Refresh main dashboard lists
                            handleRetrySummary();
                          } catch (err: any) {
                            toast({
                              title: "Error",
                              description: err.message || "Failed to modify items",
                              variant: "destructive"
                            });
                          } finally {
                            setActioningRequisition(false);
                          }
                        }}
                        disabled={actioningRequisition}
                        className="bg-[#123458] hover:bg-[#123458]/90 text-white h-8 text-xs cursor-pointer border-none"
                      >
                        {actioningRequisition ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b text-slate-500">
                          <th className="p-2 font-bold">Item Name</th>
                          <th className="p-2 font-bold text-center">Qty</th>
                          <th className="p-2 font-bold text-right">Price</th>
                          <th className="p-2 font-bold text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRequisition.billing?.items && selectedRequisition.billing.items.length > 0 ? (
                          selectedRequisition.billing.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                              <td className="p-2 font-medium text-slate-800">{item.name}</td>
                              <td className="p-2 text-center text-slate-700">{item.quantity}</td>
                              <td className="p-2 text-right text-slate-700">₹{item.unitPrice}</td>
                              <td className="p-2 text-right font-semibold text-slate-800">₹{item.amount}</td>
                            </tr>
                          ))
                        ) : selectedRequisition.items && selectedRequisition.items.length > 0 ? (
                          selectedRequisition.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b last:border-0 hover:bg-slate-50/50">
                              <td className="p-2 font-medium text-slate-800">{item.name || `Item ${idx+1}`}</td>
                              <td className="p-2 text-center text-slate-700">{item.quantity}</td>
                              <td className="p-2 text-right text-slate-700">N/A</td>
                              <td className="p-2 text-right font-semibold text-slate-800">N/A</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-2 text-center text-slate-400 italic">No items listed</td>
                          </tr>
                        )}
                        <tr className="bg-slate-50 font-bold border-t">
                          <td colSpan={3} className="p-2 text-right text-slate-600">Grand Total:</td>
                          <td className="p-2 text-right text-green-700 font-bold">₹{selectedRequisition.billing?.totalAmount || 0}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Approval History */}
              <div className="space-y-1.5">
                <p className="font-bold text-slate-600 border-b pb-0.5">Approval Progress & Comments</p>
                {selectedRequisition.approvals && selectedRequisition.approvals.length > 0 ? (
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedRequisition.approvals.map((app: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-700 uppercase tracking-wide">{app.role} ({app.approverName || 'Approver'})</p>
                          <p className="text-[10px] text-slate-500">{new Date(app.timestamp).toLocaleString('en-IN')}</p>
                          {app.remarks && <p className="text-slate-600 mt-1 italic">Remarks: "{app.remarks}"</p>}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${app.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No workflow history recorded yet.</p>
                )}
              </div>

              {/* Remarks Form */}
              {!isEditingItems && ((role === 'hod' && selectedRequisition.status === 'PENDING_HOD') ||
                (role === 'registrar' && selectedRequisition.status === 'APPROVED_HOD') ||
                (role === 'director' && selectedRequisition.status === 'APPROVED_REGISTRAR')) && (
                <div className="space-y-2 pt-2 border-t">
                  <Label className="font-bold text-slate-600">Remarks / Clarification Comments</Label>
                  <Textarea
                    value={requisitionRemarks}
                    onChange={(e) => setRequisitionRemarks(e.target.value)}
                    placeholder="Enter approval/rejection comments..."
                    rows={2}
                    className="resize-none rounded-xl text-xs"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" className="text-xs font-semibold rounded-xl" onClick={() => { setRequisitionDetailsOpen(false); setRequisitionRemarks(''); }} disabled={actioningRequisition}>
              Close
            </Button>
            {!isEditingItems && selectedRequisition && ((role === 'hod' && selectedRequisition.status === 'PENDING_HOD') ||
              (role === 'registrar' && selectedRequisition.status === 'APPROVED_HOD') ||
              (role === 'director' && selectedRequisition.status === 'APPROVED_REGISTRAR')) && (
              <Button
                variant="destructive"
                className="text-xs font-semibold rounded-xl cursor-pointer"
                disabled={actioningRequisition}
                onClick={async () => {
                  setActioningRequisition(true);
                  const rid = selectedRequisition._id || selectedRequisition.id;
                  await handleCancelRequisition(rid, requisitionRemarks);
                  setActioningRequisition(false);
                  setRequisitionDetailsOpen(false);
                  setRequisitionRemarks('');
                }}
              >
                Reject Order
              </Button>
            )}
            {!isEditingItems && selectedRequisition && ((role === 'hod' && selectedRequisition.status === 'PENDING_HOD') ||
              (role === 'registrar' && selectedRequisition.status === 'APPROVED_HOD') ||
              (role === 'director' && selectedRequisition.status === 'APPROVED_REGISTRAR')) && (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl border-none cursor-pointer"
                disabled={actioningRequisition}
                onClick={async () => {
                  setActioningRequisition(true);
                  const rid = selectedRequisition._id || selectedRequisition.id;
                  await handleApproveRequisition(rid, requisitionRemarks);
                  setActioningRequisition(false);
                  setRequisitionDetailsOpen(false);
                  setRequisitionRemarks('');
                }}
              >
                Approve Order
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

function AttachmentPreview({ url, name, type }: { url: string; name?: string | null; type?: string | null }) {
  if (!url) return null;
  const mimeType = type || '';
  const fileName = name || 'attachment';

  if (mimeType.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt={fileName} className="max-w-[200px] max-h-[160px] rounded-lg object-cover border" />
      </a>
    );
  }
  if (mimeType.startsWith('video/')) {
    return (
      <video src={url} controls className="max-w-[240px] rounded-lg border" />
    );
  }
  return (
    <a
      href={url}
      download={fileName}
      className="flex items-center gap-2 p-2 bg-white/20 rounded-lg border border-white/30 hover:bg-white/30 transition-colors text-sm"
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate max-w-[160px]">{fileName}</span>
      <Download className="w-4 h-4 shrink-0" />
    </a>
  );
}

export default Dashboard;
