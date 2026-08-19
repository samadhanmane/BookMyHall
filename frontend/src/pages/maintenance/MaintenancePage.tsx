import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/user/Navbar';
import Footer from '@/components/user/Footer';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Wrench, Plus, Check, X, MessageSquare, User as UserIcon, Phone,
  Send, Paperclip, Image, FileText, Video, Download, ChevronRight,
  CheckCheck, Clock, AlertCircle, Pause, Play, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceApi, RequisitionApi, getApiErrorMessage } from '@/lib/api';
import { buildDashboardUser } from '@/lib/dashboardUser';
import { invalidateRequestCache } from '@/lib/requestCache';
import { LoadingState } from '@/components/PageState';
import { canRejectMaintenance } from '@/lib/workflow/maintenanceWorkflow';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasPermission, PERMISSIONS } from '@/rbac/permissions';
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

type TicketStatus =
  | 'PENDING_DEPT_HOD'
  | 'PENDING_WORKSHOP_HOD'
  | 'PENDING_BUDGET_DEPT_HOD'
  | 'PENDING_REGISTRAR'
  | 'PENDING_DIRECTOR'
  | 'BACK_TO_WORKSHOP_AFTER_APPROVALS'
  | 'ASSIGNED_TO_WORKER'
  | 'PAUSED'
  | 'COMPLETED'
  | 'REJECTED';

type Comment = {
  authorName: string;
  authorRole: string;
  authorId?: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  createdAt: string;
};

type Ticket = {
  _id: string;
  department: string;
  issueCategory: 'minor' | 'major';
  problemTitle: string;
  actualProblem: string;
  itemsToRepair?: { name: string; quantity: number }[];
  status: TicketStatus;
  purchaseRequired?: boolean;
  estimatedCost?: number | null;
  requesterName?: string;
  requesterEmail?: string;
  requesterId?: string;
  assignedWorkerName?: string | null;
  assignedWorkerId?: string | null;
  pauseReason?: string | null;
  pausedByName?: string | null;
  pausedAt?: string | null;
  comments?: Comment[];
  actionLogs?: any[];
  createdAt?: string;
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  PENDING_DEPT_HOD: 'Pending Dept HOD',
  PENDING_WORKSHOP_HOD: 'Pending Workshop HOD',
  PENDING_BUDGET_DEPT_HOD: 'Pending Budget HOD',
  PENDING_REGISTRAR: 'Pending Registrar',
  PENDING_DIRECTOR: 'Pending Director',
  BACK_TO_WORKSHOP_AFTER_APPROVALS: 'Back to Workshop',
  ASSIGNED_TO_WORKER: 'Assigned to Worker',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const STATUS_COLOR: Record<TicketStatus, string> = {
  PENDING_DEPT_HOD: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING_WORKSHOP_HOD: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING_BUDGET_DEPT_HOD: 'bg-purple-100 text-purple-800 border-purple-200',
  PENDING_REGISTRAR: 'bg-orange-100 text-orange-800 border-orange-200',
  PENDING_DIRECTOR: 'bg-pink-100 text-pink-800 border-pink-200',
  BACK_TO_WORKSHOP_AFTER_APPROVALS: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  ASSIGNED_TO_WORKER: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
};

const WORKFLOW_STEPS: { label: string; statuses: TicketStatus[] }[] = [
  { label: 'Dept HOD', statuses: ['PENDING_DEPT_HOD'] },
  { label: 'Workshop HOD', statuses: ['PENDING_WORKSHOP_HOD'] },
  { label: 'Worker Assigned', statuses: ['ASSIGNED_TO_WORKER', 'BACK_TO_WORKSHOP_AFTER_APPROVALS', 'PAUSED'] },
  { label: 'Completed', statuses: ['COMPLETED'] },
];

function getStepState(stepStatuses: TicketStatus[], currentStatus: TicketStatus): 'done' | 'active' | 'pending' {
  if (currentStatus === 'REJECTED') return 'pending';
  if (currentStatus === 'COMPLETED') return 'done';
  const orderedAll: TicketStatus[] = [
    'PENDING_DEPT_HOD', 'PENDING_WORKSHOP_HOD', 'ASSIGNED_TO_WORKER', 'COMPLETED',
  ];
  let mappedStatus = currentStatus;
  if (['PENDING_BUDGET_DEPT_HOD', 'PENDING_REGISTRAR', 'PENDING_DIRECTOR', 'BACK_TO_WORKSHOP_AFTER_APPROVALS', 'PAUSED'].includes(currentStatus)) {
    mappedStatus = 'ASSIGNED_TO_WORKER';
  }
  const currentIdx = orderedAll.indexOf(mappedStatus);
  const stepIdx = Math.max(...stepStatuses.map((s) => orderedAll.indexOf(s === 'BACK_TO_WORKSHOP_AFTER_APPROVALS' ? 'ASSIGNED_TO_WORKER' : s)));
  if (stepStatuses.includes(currentStatus)) return 'active';
  if (stepIdx < currentIdx && currentIdx !== -1) return 'done';
  return 'pending';
}

// ─── Approval Flow Visual ────────────────────────────────────────────────────
function ApprovalFlow({ status }: { status: TicketStatus }) {
  if (status === 'REJECTED') {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <X className="w-5 h-5 text-red-600 shrink-0" />
        <span className="text-sm font-medium text-red-700">Ticket Rejected</span>
      </div>
    );
  }
  if (status === 'PAUSED') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
          <Pause className="w-5 h-5 text-yellow-600 shrink-0" />
          <span className="text-sm font-medium text-yellow-700">Ticket Paused</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {WORKFLOW_STEPS.map((step, i) => {
        const state = getStepState(step.statuses, status);
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  state === 'done'
                    ? 'bg-green-500 border-green-500 text-white'
                    : state === 'active'
                    ? 'bg-primary border-primary text-white animate-pulse'
                    : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {state === 'done' ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-[10px] mt-1 text-center max-w-[60px] leading-tight ${
                state === 'active' ? 'text-primary font-medium' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <ChevronRight className={`w-4 h-4 mb-4 shrink-0 ${
                state === 'done' ? 'text-green-500' : 'text-muted-foreground/40'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Chat Attachment Preview ──────────────────────────────────────────────────
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

function formatCommentTime(value?: string) {
  if (!value) return 'Recently';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return 'Recently';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MaintenancePage: React.FC = () => {
  const { orgId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const layoutUser = buildDashboardUser(orgId);
  const user = {
    email: layoutUser?.email || '',
    role: layoutUser?.role || '',
    organization: orgId,
    orgName: layoutUser?.orgName || 'Organization',
    department: layoutUser?.department || '',
    id: layoutUser?.id || '',
  };

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [workers, setWorkers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [addWorkerOpen, setAddWorkerOpen] = useState(false);
  const [workerForm, setWorkerForm] = useState({ name: '', phone: '' });
  const [creatingWorker, setCreatingWorker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Chat state
  const [chatText, setChatText] = useState('');
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatFilePreview, setChatFilePreview] = useState<string | null>(null);
  const [sendingChat, setSendingChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchParams] = useSearchParams();
  const autoOpenChatId = searchParams.get('chat');
  const autoOpenTicketId = searchParams.get('ticket');

  useEffect(() => {
    if (tickets.length > 0) {
      if (autoOpenChatId) {
        const ticket = tickets.find(t => t._id === autoOpenChatId);
        if (ticket) {
          setSelected(ticket);
          setChatOpen(true);
        }
      } else if (autoOpenTicketId) {
        const ticket = tickets.find(t => t._id === autoOpenTicketId);
        if (ticket) {
          setSelected(ticket);
          setDetailOpen(true);
        }
      }
    }
  }, [tickets, autoOpenChatId, autoOpenTicketId]);

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

  const [form, setForm] = useState({
    department: '',
    issueCategory: 'minor' as 'minor' | 'major',
    problemTitle: '',
    actualProblem: '',
    itemsToRepair: [{ name: '', quantity: 1 }],
  });

  const [remarks, setRemarks] = useState('');
  const [purchaseRequired, setPurchaseRequired] = useState<'no' | 'yes'>('no');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');

  // Pause / Reopen dialog state
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [pausingTicket, setPausingTicket] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopeningTicket, setReopeningTicket] = useState(false);

  useEffect(() => {
    if (!layoutUser?.email && orgId) {
      navigate(`/org/${orgId}/login`);
    }
  }, [layoutUser?.email, navigate, orgId]);

  useEffect(() => {
    if (orgId) {
      if (user.role === 'hod') {
        navigate(`/org/${orgId}/dashboard?tab=maintenance`, { replace: true });
      } else if (user.role === 'workshop_hod' || user.role === 'worker') {
        navigate(`/org/${orgId}/dashboard`, { replace: true });
      }
    }
  }, [user.role, orgId, navigate]);

  const canAccess = hasPermission(user.role, PERMISSIONS.MAINTENANCE_VIEW);
  const canCreate = hasPermission(user.role, PERMISSIONS.MAINTENANCE_CREATE);
  const canAct = hasPermission(user.role, PERMISSIONS.MAINTENANCE_ACT);
  const canManageWorkers = hasPermission(user.role, PERMISSIONS.MAINTENANCE_WORKER_MANAGE);

  // Staff = workshop_hod or worker (can see/use chat)
  const isStaff = user.role === 'workshop_hod' || user.role === 'worker';
  const canViewChat = ['workshop_hod', 'worker', 'hod', 'budget_hod', 'registrar', 'director'].includes(user.role);

  useEffect(() => {
    if (!orgId || !canAccess) return;
    loadTickets();
    loadDepartments();
    loadWorkers();
  }, [orgId, canAccess]);

  useEffect(() => {
    const handleMaintenanceChanged = () => {
      if (orgId && canAccess) loadTickets();
    };
    window.addEventListener('maintenance-changed', handleMaintenanceChanged);
    return () => {
      window.removeEventListener('maintenance-changed', handleMaintenanceChanged);
    };
  }, [orgId, canAccess]);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatOpen, selected?.comments]);

  const loadTickets = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      invalidateRequestCache(`maintenance:${orgId}`);
      const res = await MaintenanceApi.list(orgId);
      setTickets(res.data || []);
    } catch (e: any) {
      toast({ title: 'Error', description: getApiErrorMessage(e, 'Failed to load tickets'), variant: 'destructive' });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    if (!orgId) return;
    try {
      const res = await RequisitionApi.listDepartments(orgId);
      setDepartments(res.data || []);
    } catch {
      setDepartments([]);
    }
  };

  const loadWorkers = async () => {
    if (!orgId || !canManageWorkers) { setWorkers([]); return; }
    try {
      const res = await MaintenanceApi.listWorkers(orgId);
      const list = (res.data || [])
        .filter((u: any) => u.role === 'worker')
        .map((u: any) => ({ id: u._id || u.id, name: u.name || u.email, email: u.email }));
      setWorkers(list);
    } catch {
      setWorkers([]);
    }
  };

  const handleCreateWorker = async () => {
    if (!orgId) return;
    const name = workerForm.name.trim();
    const phone = workerForm.phone.trim();
    if (!name || !phone) {
      toast({ title: 'Validation', description: 'Worker name and phone are required', variant: 'destructive' });
      return;
    }
    try {
      setCreatingWorker(true);
      const res = await MaintenanceApi.createWorker(orgId, { name, phone });
      const created = res.data || {};
      toast({ title: 'Worker added', description: `Created ${created.name || name}. Login: ${created.email || 'generated'}` });
      if (created?.temporaryPassword) {
        toast({ title: 'Temporary password', description: `Save this once: ${created.temporaryPassword}` });
      }
      setWorkerForm({ name: '', phone: '' });
      setAddWorkerOpen(false);
      await loadWorkers();
    } catch (e: any) {
      toast({ title: 'Error', description: getApiErrorMessage(e, 'Failed to add worker'), variant: 'destructive' });
    } finally {
      setCreatingWorker(false);
    }
  };

  const canApprove = (t: Ticket) => {
    if (!canAct) return false;
    if (user.role === 'hod' && t.status === 'PENDING_DEPT_HOD') return true;
    if (user.role === 'workshop_hod' && t.status === 'PENDING_WORKSHOP_HOD') return true;
    if ((user.role === 'hod' || user.role === 'budget_hod') && t.status === 'PENDING_BUDGET_DEPT_HOD') return true;
    if (user.role === 'registrar' && t.status === 'PENDING_REGISTRAR') return true;
    if (user.role === 'director' && t.status === 'PENDING_DIRECTOR') return true;
    return false;
  };
  const canReject = (t: Ticket) => canAct && canRejectMaintenance(user.role, t.status);
  const canAssign = (t: Ticket) =>
    canAct && user.role === 'workshop_hod' && t.status === 'BACK_TO_WORKSHOP_AFTER_APPROVALS';
  const canComplete = (t: Ticket) =>
    canAct && user.role === 'workshop_hod' && t.status === 'ASSIGNED_TO_WORKER';
  const canWorkerComplete = (t: Ticket) =>
    user.role === 'worker' && t.status === 'ASSIGNED_TO_WORKER';
  const canPauseTicket = (t: Ticket) =>
    (user.role === 'workshop_hod' || user.role === 'worker') && t.status === 'ASSIGNED_TO_WORKER';
  const canReopenTicket = (t: Ticket) =>
    t.status === 'PAUSED' && (
      (user.role === 'faculty' && t.requesterId === user.id) ||
      user.role === 'hod' ||
      user.role === 'org_admin' ||
      user.role === 'super_admin'
    );

  const handleCreate = async () => {
    if (!orgId) return;
    const validItems = (form.itemsToRepair || []).filter((i) => i.name.trim() && i.quantity > 0);
    if (!form.department.trim() || !form.problemTitle.trim() || !form.actualProblem.trim() || validItems.length === 0) {
      toast({ title: 'Validation', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    try {
      await MaintenanceApi.create(orgId, { ...form, itemsToRepair: validItems });
      toast({ title: 'Success', description: 'Ticket created' });
      setCreateOpen(false);
      setForm({ department: '', issueCategory: 'minor', problemTitle: '', actualProblem: '', itemsToRepair: [{ name: '', quantity: 1 }] });
      invalidateRequestCache(`maintenance:${orgId}`);
      loadTickets();
    } catch (e: any) {
      toast({ title: 'Error', description: getApiErrorMessage(e, 'Failed to create ticket'), variant: 'destructive' });
    }
  };

  const openTicket = async (t: Ticket) => {
    if (!orgId) return;
    setSelected(t);
    setDetailOpen(true);
    setRemarks('');
    setPurchaseRequired('no');
    setEstimatedCost(t.estimatedCost ? String(t.estimatedCost) : '');
    setSelectedWorkerId('');
    try {
      const res = await MaintenanceApi.get(orgId, t._id);
      setSelected(res.data);
    } catch (e: any) {
      console.warn('Maintenance detail fetch skipped:', getApiErrorMessage(e));
    }
  };

  const openChat = async (t: Ticket) => {
    if (!orgId) return;
    setSelected(t);
    setChatOpen(true);
    setChatText('');
    setChatFile(null);
    setChatFilePreview(null);
    try {
      const res = await MaintenanceApi.get(orgId, t._id);
      setSelected(res.data);
    } catch (e: any) {
      console.warn('Chat detail fetch skipped:', getApiErrorMessage(e));
    }
  };

  const act = async (payload: any) => {
    if (!orgId || !selected) return;
    try {
      const res = await MaintenanceApi.act(orgId, selected._id, payload);
      setSelected(res.data);
      toast({ title: 'Success', description: 'Action completed' });
      invalidateRequestCache(`maintenance:${orgId}`);
      loadTickets();
    } catch (e: any) {
      toast({ title: 'Error', description: getApiErrorMessage(e, 'Action failed'), variant: 'destructive' });
    }
  };

  const handlePause = async () => {
    if (!orgId || !selected || !pauseReason.trim()) return;
    setPausingTicket(true);
    try {
      const res = await MaintenanceApi.act(orgId, selected._id, { action: 'pause', reason: pauseReason.trim() });
      setSelected(res.data);
      toast({ title: 'Ticket Paused', description: 'The ticket has been paused. Notifications sent to all stakeholders.' });
      setPauseDialogOpen(false);
      setPauseReason('');
      invalidateRequestCache(`maintenance:${orgId}`);
      loadTickets();
    } catch (e: any) {
      toast({ title: 'Error', description: getApiErrorMessage(e, 'Failed to pause ticket'), variant: 'destructive' });
    } finally {
      setPausingTicket(false);
    }
  };

  const handleReopen = async () => {
    if (!orgId || !selected || !reopenReason.trim()) return;
    setReopeningTicket(true);
    try {
      const res = await MaintenanceApi.act(orgId, selected._id, { action: 'reopen', reason: reopenReason.trim() });
      setSelected(res.data);
      toast({ title: 'Ticket Reopened', description: 'The ticket has been reopened. Worker can now resume work.' });
      setReopenDialogOpen(false);
      setReopenReason('');
      invalidateRequestCache(`maintenance:${orgId}`);
      loadTickets();
    } catch (e: any) {
      toast({ title: 'Error', description: getApiErrorMessage(e, 'Failed to reopen ticket'), variant: 'destructive' });
    } finally {
      setReopeningTicket(false);
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
    if (!orgId || !selected) return;
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
      const res = await MaintenanceApi.addComment(orgId, selected._id, {
        content: chatText.trim() || undefined,
        attachmentUrl,
        attachmentName,
        attachmentType,
      });
      setSelected(res.data);
      setChatText('');
      setChatFile(null);
      setChatFilePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      invalidateRequestCache(`maintenance:${orgId}`);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e: any) {
      toast({ title: 'Error', description: getApiErrorMessage(e, 'Failed to send message'), variant: 'destructive' });
    } finally {
      setSendingChat(false);
    }
  };

  const visibleTickets = useMemo(() => tickets, [tickets]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(STATUS_LABEL).forEach((status) => {
      counts[status] = 0;
    });
    tickets.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      }
    });
    return Object.entries(counts)
      .map(([status, count]) => ({
        name: STATUS_LABEL[status as TicketStatus] || status,
        value: count,
      }))
      .filter((item) => item.value > 0);
  }, [tickets]);

  const priorityBreakdown = useMemo(() => {
    let minor = 0;
    let major = 0;
    tickets.forEach((t) => {
      if (t.issueCategory === 'minor') minor++;
      else if (t.issueCategory === 'major') major++;
    });
    return [
      { name: 'Minor Priority', value: minor },
      { name: 'Major Priority', value: major },
    ].filter((item) => item.value > 0);
  }, [tickets]);

  const workerPerformance = useMemo(() => {
    const map = new Map<string, { worker: string; assigned: number; completed: number }>();
    workers.forEach((w) => { map.set(w.name, { worker: w.name, assigned: 0, completed: 0 }); });
    tickets.forEach((t) => {
      const worker = t.assignedWorkerName || 'Unassigned';
      const current = map.get(worker) || { worker, assigned: 0, completed: 0 };
      if (t.status === 'ASSIGNED_TO_WORKER' || t.status === 'COMPLETED') current.assigned += 1;
      if (t.status === 'COMPLETED') current.completed += 1;
      map.set(worker, current);
    });
    return Array.from(map.values()).filter((x) => x.worker !== 'Unassigned');
  }, [tickets, workers]);

  const workerActiveTicketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    workers.forEach((w) => {
      counts[w.id] = 0;
    });
    tickets.forEach((t) => {
      if (t.status === 'ASSIGNED_TO_WORKER' && t.assignedWorkerId) {
        counts[t.assignedWorkerId] = (counts[t.assignedWorkerId] || 0) + 1;
      }
    });
    return counts;
  }, [tickets, workers]);

  if (!user.email) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <LoadingState message="Loading maintenance…" rows={2} />
      </div>
    );
  }

  const pageContent = (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Maintenance</h1>
            <p className="text-sm text-muted-foreground">Raise and track maintenance requests with approvals.</p>
          </div>
        </div>

        {!canAccess ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">You do not have access to the maintenance module.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Tabs defaultValue="tickets">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="tickets">Tickets</TabsTrigger>
                  {(user.role === 'workshop_hod' || user.role === 'hod' || user.role === 'budget_hod' || user.role === 'registrar' || user.role === 'director') && (
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  )}
                </TabsList>
                <div className="flex items-center gap-2">
                  {canManageWorkers && (
                    <Button variant="outline" onClick={() => setAddWorkerOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> Add Worker
                    </Button>
                  )}
                  {canCreate && (
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" /> New Ticket
                    </Button>
                  )}
                </div>
              </div>

              <TabsContent value="tickets" className="mt-4">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    <p className="mt-4 text-muted-foreground">Loading tickets...</p>
                  </div>
                ) : visibleTickets.length === 0 ? (
                  <Card>
                    <CardContent className="p-10 text-center">
                      <Wrench className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">No maintenance tickets found.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {visibleTickets.map((t) => (
                      <Card
                        key={t._id}
                        className="cursor-pointer hover:shadow-md transition-all border hover:border-primary/30"
                        onClick={() => openTicket(t)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{t.problemTitle}</p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {t.department} • {t.issueCategory.toUpperCase()}
                                {t.assignedWorkerName && ` • Worker: ${t.assignedWorkerName}`}
                              </p>
                              {/* Compact approval flow */}
                              <div className="mt-2 overflow-x-auto">
                                <ApprovalFlow status={t.status} />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_COLOR[t.status]}`}>
                                {STATUS_LABEL[t.status]}
                              </span>
                              {/* Chat button visible only to allowed roles */}
                              {canViewChat && (
                                user.role === 'workshop_hod' ||
                                t.status === 'ASSIGNED_TO_WORKER' ||
                                t.status === 'BACK_TO_WORKSHOP_AFTER_APPROVALS' ||
                                t.status === 'COMPLETED'
                              ) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 gap-1 text-xs"
                                  onClick={(e) => { e.stopPropagation(); openChat(t); }}
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  Chat
                                  {(t.comments?.length ?? 0) > 0 && (
                                    <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                                      {t.comments!.length}
                                    </span>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {(user.role === 'workshop_hod' || user.role === 'hod' || user.role === 'budget_hod' || user.role === 'registrar' || user.role === 'director') && (
                <TabsContent value="analytics" className="mt-4 space-y-4">
                  {user.role === 'workshop_hod' ? (
                    <>
                      <Card>
                        <CardHeader><CardTitle>Registered Workers</CardTitle></CardHeader>
                        <CardContent>
                          {workers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No workers added yet.</p>
                          ) : (
                            <div className="grid gap-2">
                              {workers.map((w) => (
                                <div key={w.id} className="flex items-center justify-between border rounded px-3 py-2">
                                  <div>
                                    <p className="font-medium text-sm">{w.name}</p>
                                    <p className="text-xs text-muted-foreground">{w.email}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Worker Performance</CardTitle></CardHeader>
                        <CardContent>
                          {workerPerformance.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No assigned/completed tickets yet.</p>
                          ) : (
                            <ResponsiveContainer width="100%" height={320}>
                              <BarChart data={workerPerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="worker" angle={-20} textAnchor="end" height={60} style={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="assigned" fill="#6366f1" name="Assigned" />
                                <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader><CardTitle>Ticket Status Breakdown</CardTitle></CardHeader>
                        <CardContent>
                          {tickets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {user.role === 'hod' ? 'No tickets in this department.' : 'No tickets found.'}
                            </p>
                          ) : (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={statusBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-20} textAnchor="end" height={60} style={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" name="Tickets count" />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader><CardTitle>Ticket Priority Breakdown</CardTitle></CardHeader>
                        <CardContent>
                          {tickets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              {user.role === 'hod' ? 'No tickets in this department.' : 'No tickets found.'}
                            </p>
                          ) : (
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={priorityBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" style={{ fontSize: 11 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#ec4899" name="Tickets count" />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>

            {/* ─── Create Ticket Dialog ─── */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>New Maintenance Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select value={form.department} onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Fixing Type *</Label>
                    <Select value={form.issueCategory} onValueChange={(v: any) => setForm((p) => ({ ...p, issueCategory: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Problem Title *</Label>
                    <Input value={form.problemTitle} onChange={(e) => setForm((p) => ({ ...p, problemTitle: e.target.value }))} placeholder="e.g. Projector not working" />
                  </div>
                  <div className="space-y-2">
                    <Label>Actual Problem *</Label>
                    <Textarea value={form.actualProblem} onChange={(e) => setForm((p) => ({ ...p, actualProblem: e.target.value }))} rows={4} placeholder="Describe the issue in detail..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Items to Repair *</Label>
                    <div className="space-y-2">
                      {(form.itemsToRepair || []).map((it, idx) => (
                        <div key={idx} className="grid grid-cols-6 gap-2">
                          <div className="col-span-4">
                            <Input
                              value={it.name}
                              onChange={(e) => setForm((p) => ({
                                ...p,
                                itemsToRepair: (p.itemsToRepair || []).map((x, i) => i === idx ? { ...x, name: e.target.value } : x),
                              }))}
                              placeholder="Item name"
                            />
                          </div>
                          <div className="col-span-2 flex gap-2">
                            <Input
                              type="number" min={1} value={it.quantity}
                              onChange={(e) => {
                                const q = Number(e.target.value || 0);
                                setForm((p) => ({
                                  ...p,
                                  itemsToRepair: (p.itemsToRepair || []).map((x, i) => i === idx ? { ...x, quantity: Number.isFinite(q) ? q : 1 } : x),
                                }));
                              }}
                              placeholder="Qty"
                            />
                            <Button
                              type="button" variant="outline"
                              onClick={() => setForm((p) => ({ ...p, itemsToRepair: (p.itemsToRepair || []).filter((_, i) => i !== idx) }))}
                              disabled={(form.itemsToRepair || []).length <= 1}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button" variant="outline"
                        onClick={() => setForm((p) => ({ ...p, itemsToRepair: [...(p.itemsToRepair || []), { name: '', quantity: 1 }] }))}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Item
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Submit</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ─── Add Worker Dialog ─── */}
            <Dialog open={addWorkerOpen} onOpenChange={setAddWorkerOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Worker</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Worker Name *</Label>
                    <Input value={workerForm.name} onChange={(e) => setWorkerForm((p) => ({ ...p, name: e.target.value }))} placeholder="Enter worker name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input value={workerForm.phone} onChange={(e) => setWorkerForm((p) => ({ ...p, phone: e.target.value }))} className="pl-9" placeholder="Enter mobile number" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddWorkerOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateWorker} disabled={creatingWorker}>
                    {creatingWorker ? 'Adding...' : 'Add Worker'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ─── Ticket Detail Dialog ─── */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Ticket Details</DialogTitle>
                </DialogHeader>
                {selected && (
                  <div className="space-y-4">
                    {/* Status badge + meta */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`text-sm font-medium px-3 py-1 rounded-full border ${STATUS_COLOR[selected.status]}`}>
                        {STATUS_LABEL[selected.status]}
                      </span>
                      <div className="text-sm text-muted-foreground">
                        {selected.department} • {selected.issueCategory.toUpperCase()}
                      </div>
                    </div>

                    {/* Approval Flow */}
                    <Card className="p-3 bg-muted/30">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Approval Progress</p>
                      <ApprovalFlow status={selected.status} />
                    </Card>

                    {/* Problem details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">{selected.problemTitle}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-1">Actual problem</p>
                        <p className="text-sm mb-3">{selected.actualProblem}</p>
                        <p className="text-sm text-muted-foreground mb-1">Items to repair</p>
                        {selected.itemsToRepair?.length ? (
                          <ul className="text-sm list-disc pl-5 space-y-1">
                            {selected.itemsToRepair.map((it, idx) => (
                              <li key={idx}>{it.name} × {it.quantity}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">No items specified.</p>
                        )}
                        {selected.assignedWorkerName && (
                          <p className="text-sm text-muted-foreground mt-3">
                            Assigned worker: <span className="text-foreground font-medium">{selected.assignedWorkerName}</span>
                          </p>
                        )}
                        {selected.purchaseRequired && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Estimated purchase cost: <span className="text-foreground font-medium">Rs. {Number(selected.estimatedCost || 0).toFixed(2)}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Paused info banner */}
                    {selected.status === 'PAUSED' && (
                      <Card className="border-yellow-300 bg-yellow-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Pause className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-yellow-800">Ticket is Paused</p>
                              {selected.pausedByName && (
                                <p className="text-xs text-yellow-700 mt-0.5">Paused by: <span className="font-medium">{selected.pausedByName}</span></p>
                              )}
                              {selected.pauseReason && (
                                <p className="text-sm text-yellow-800 mt-1.5 bg-yellow-100 rounded p-2 border border-yellow-200">
                                  <span className="font-medium">Reason:</span> {selected.pauseReason}
                                </p>
                              )}
                              <p className="text-xs text-yellow-600 mt-2">The faculty/requester can reopen this ticket when ready.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Chat shortcut */}
                    {canViewChat && (
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2"
                        onClick={() => { setDetailOpen(false); openChat(selected); }}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Open Discussion Chat
                        {(selected.comments?.length ?? 0) > 0 && (
                          <Badge variant="secondary">{selected.comments!.length} messages</Badge>
                        )}
                      </Button>
                    )}

                    {/* Actions by stage */}
                    {(canApprove(selected) || canReject(selected) || canAssign(selected) || canComplete(selected) || canWorkerComplete(selected) || canPauseTicket(selected) || canReopenTicket(selected)) && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                          {selected.status !== 'PAUSED' && (
                            <div className="space-y-2">
                              <Label>Remarks (optional)</Label>
                              <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add remarks..." />
                            </div>
                          )}

                          {user.role === 'workshop_hod' && selected.status === 'PENDING_WORKSHOP_HOD' && (
                            <div className="space-y-3 pt-2">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workers Availability & Active Repair Load</Label>
                              {workers.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No active workers found. Please add workers first.</p>
                              ) : (
                                <div className="border rounded-lg overflow-hidden divide-y bg-slate-50/50">
                                  {workers.map((w) => {
                                    const activeCount = workerActiveTicketCounts[w.id] || 0;
                                    let badgeColor = "bg-green-100 text-green-800 border-green-200";
                                    if (activeCount >= 3) {
                                      badgeColor = "bg-red-100 text-red-800 border-red-200";
                                    } else if (activeCount > 0) {
                                      badgeColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
                                    }
                                    return (
                                      <div key={w.id} className="flex items-center justify-between px-3 py-2 text-xs">
                                        <div className="flex flex-col">
                                          <span className="font-medium text-foreground">{w.name}</span>
                                          <span className="text-[10px] text-muted-foreground">{w.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${badgeColor}`}>
                                            {activeCount} active task{activeCount !== 1 ? 's' : ''}
                                          </span>
                                          <Button
                                            size="sm"
                                            variant={selectedWorkerId === w.id ? "default" : "outline"}
                                            className="h-7 text-[10px] px-2 py-0"
                                            onClick={() => setSelectedWorkerId(w.id)}
                                            type="button"
                                          >
                                            {selectedWorkerId === w.id ? "Selected" : "Select"}
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              <div className="space-y-2">
                                <Label>Assigned Worker (required)</Label>
                                <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                                  <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                                  <SelectContent>
                                    {workers.map((w) => (
                                      <SelectItem key={w.id} value={w.id}>
                                        {w.name} ({workerActiveTicketCounts[w.id] || 0} active)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}

                          {canAssign(selected) && (
                            <div className="space-y-2">
                              <Label>Assign worker</Label>
                              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                                <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
                                <SelectContent>
                                  {workers.map((w) => (
                                    <SelectItem key={w.id} value={w.id}>
                                      {w.name} ({workerActiveTicketCounts[w.id] || 0} active)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button onClick={() => act({ action: 'assign_worker', workerId: selectedWorkerId, remarks })} disabled={!selectedWorkerId}>
                                Assign
                              </Button>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {canApprove(selected) && (
                              <Button
                                onClick={() => act({
                                  action: 'approve', remarks,
                                  ...(user.role === 'workshop_hod' && selected.status === 'PENDING_WORKSHOP_HOD'
                                    ? { workerId: selectedWorkerId }
                                    : {}),
                                })}
                                disabled={
                                  user.role === 'workshop_hod' && selected.status === 'PENDING_WORKSHOP_HOD' && !selectedWorkerId
                                }
                              >
                                <Check className="w-4 h-4 mr-2" />
                                {user.role === 'workshop_hod' ? 'Approve & Assign' : 'Approve'}
                              </Button>
                            )}
                            {canReject(selected) && (
                              <Button variant="destructive" onClick={() => { if (!confirm('Reject this ticket?')) return; act({ action: 'reject', remarks }); }}>
                                <X className="w-4 h-4 mr-2" /> Reject
                              </Button>
                            )}
                            {canComplete(selected) && (
                              <Button onClick={() => act({ action: 'complete', remarks })}>
                                <Check className="w-4 h-4 mr-2" /> Mark Completed (Workshop)
                              </Button>
                            )}
                            {canWorkerComplete(selected) && (
                              <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => { if (!confirm('Mark this work as done? This will complete the ticket.')) return; act({ action: 'complete', remarks: remarks || 'Work marked done by assigned worker.' }); }}
                              >
                                <CheckCheck className="w-4 h-4 mr-2" /> Work is Done
                              </Button>
                            )}
                          </div>
                          {canPauseTicket(selected) && (
                            <Button
                              variant="outline"
                              className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800"
                              onClick={() => { setPauseReason(''); setPauseDialogOpen(true); }}
                            >
                              <Pause className="w-4 h-4 mr-2" /> Pause Ticket
                            </Button>
                          )}
                          {canReopenTicket(selected) && (
                            <Button
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => { setReopenReason(''); setReopenDialogOpen(true); }}
                            >
                              <RotateCcw className="w-4 h-4 mr-2" /> Reopen Ticket
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Action logs */}
                    {selected.actionLogs && selected.actionLogs.length > 0 && (
                      <Card>
                        <CardHeader><CardTitle className="text-base">Activity Log</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selected.actionLogs.map((log, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.action === 'reject' ? 'bg-red-500' : log.action === 'complete' ? 'bg-green-500' : log.action === 'pause' ? 'bg-yellow-500' : log.action === 'reopen' ? 'bg-blue-500' : 'bg-primary'}`} />
                                <div>
                                  <span className="font-medium">{log.actorName}</span>
                                  <span className="text-muted-foreground"> ({log.role}) → {log.action}</span>
                                  {log.remarks && <p className="text-xs text-muted-foreground">{log.remarks}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* ─── Pause Ticket Dialog ─── */}
            <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Pause className="w-5 h-5 text-yellow-600" />
                    Pause Ticket
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Pausing this ticket will notify all panel members and the faculty/requester.
                  </p>
                  <div className="space-y-2">
                    <Label>Pause Reason <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={pauseReason}
                      onChange={(e) => setPauseReason(e.target.value)}
                      placeholder="Why is this ticket being paused? (e.g., waiting for parts, faculty needs to provide access, etc.)"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setPauseDialogOpen(false)} disabled={pausingTicket}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    onClick={handlePause}
                    disabled={!pauseReason.trim() || pausingTicket}
                  >
                    {pausingTicket ? 'Pausing...' : 'Confirm Pause'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ─── Reopen Ticket Dialog ─── */}
            <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                    Reopen Ticket
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Reopening this ticket will notify the Workshop HOD, the assigned worker, and all panel members. The same worker will resume work on this ticket.
                  </p>
                  {selected?.pauseReason && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs font-medium text-yellow-700 mb-1">Original Pause Reason:</p>
                      <p className="text-sm text-yellow-800">{selected.pauseReason}</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>Reopen Reason <span className="text-red-500">*</span></Label>
                    <Textarea
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      placeholder="Why is this ticket being reopened? (e.g., access granted, ready to resume, etc.)"
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setReopenDialogOpen(false)} disabled={reopeningTicket}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleReopen}
                    disabled={!reopenReason.trim() || reopeningTicket}
                  >
                    {reopeningTicket ? 'Reopening...' : 'Confirm Reopen'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* ─── WhatsApp-style Chat Sidebar ─── */}
            {chatOpen && selected && (
              <div className="fixed inset-0 z-50 flex justify-end animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setChatOpen(false); }}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setChatOpen(false)} />

                {/* Chat panel */}
                <div className="relative z-10 flex flex-col w-full max-w-md h-full bg-[#efeae2] shadow-2xl border-l">
                  {/* Chat header */}
                  <div className="flex items-center gap-3 p-3.5 bg-[#008069] text-white shrink-0 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-white uppercase tracking-wider relative shrink-0">
                      {selected.problemTitle.slice(0, 2)}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] border-2 border-[#008069] rounded-full animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-bold text-sm truncate">{selected.problemTitle}</p>
                      <div className="flex items-center gap-1 text-[11px] text-white/80">
                        <span className="font-medium">{selected.department}</span>
                        <span>•</span>
                        <span className="bg-white/10 px-1.5 py-0.5 rounded capitalize text-[10px]">
                          {selected.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setChatOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-white cursor-pointer shrink-0">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Worker "Work is Done" banner */}
                  {canWorkerComplete(selected) && (
                    <div className="shrink-0 px-4 py-2.5 bg-[#efeae2] border-b border-[#008069]/10 flex items-center justify-between">
                      <span className="text-xs text-[#008069] font-bold uppercase tracking-wider">Assigned Task</span>
                      <Button
                        size="sm"
                        className="bg-[#00a884] hover:bg-[#008f72] text-white h-8 rounded-lg text-xs font-bold shadow-xs cursor-pointer border-none"
                        onClick={() => {
                          if (!confirm('Mark this work as done? This will complete the ticket.')) return;
                          act({ action: 'complete', remarks: 'Work marked done by assigned worker.' });
                          setChatOpen(false);
                        }}
                      >
                        <CheckCheck className="w-3.5 h-3.5 mr-1" /> Work is Done
                      </Button>
                    </div>
                  )}

                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: '#efeae2', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)', backgroundSize: '16px 16px' }}>
                    {(!selected.comments || selected.comments.length === 0) ? (
                      <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <MessageSquare className="w-12 h-12 text-[#8696a0]/60 mb-3 animate-pulse" />
                        <p className="text-sm font-bold text-[#667781]">No messages yet</p>
                        <p className="text-xs text-[#8696a0] mt-1">Start the conversation below.</p>
                      </div>
                    ) : (
                      selected.comments.map((c, idx) => {
                        const isMine = c.authorRole === user.role || c.authorName === user.email;
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
                  {isStaff && (selected.status || '').toUpperCase() !== 'COMPLETED' && (selected.status || '').toUpperCase() !== 'REJECTED' && (selected.status || '').toUpperCase() !== 'PAUSED' ? (
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
                        {((selected.status || '').toUpperCase() === 'COMPLETED' || (selected.status || '').toUpperCase() === 'REJECTED') ? (
                          <>
                            {(selected.status || '').toUpperCase() === 'COMPLETED' ? <Check className="w-3.5 h-3.5 text-[#00a884] font-bold" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                            Chat closed — ticket is {(selected.status || '').toLowerCase()}.
                          </>
                        ) : (selected.status || '').toUpperCase() === 'PAUSED' ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-yellow-600" />
                            Chat paused — ticket is paused. Awaiting faculty to reopen.
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
          </>
        )}
    </div>
  );

  const useDashboardLayout = user.role !== 'faculty' && user.role !== 'student';

  if (useDashboardLayout) {
    return (
      <DashboardLayout user={user}>
        {pageContent}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#123458]/5 via-white/50 to-slate-50/50 flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 md:px-8 py-8 flex-grow">
        {pageContent}
      </div>
      <Footer />
    </div>
  );
};

export default MaintenancePage;
