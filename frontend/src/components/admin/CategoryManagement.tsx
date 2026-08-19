import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Building2, 
  Car, 
  Bed, 
  GraduationCap, 
  FlaskConical, 
  Dumbbell, 
  Projector,
  Settings,
  Clock,
  Users,
  CheckCircle2
} from 'lucide-react';
import { UtilityCategory, CustomField, ApprovalStepConfig, TimeSlot, UserRole, APPROVAL_FLOW_TEMPLATES, Utility } from '@/types/utility';
import { useToast } from '@/hooks/use-toast';
import { UserApi } from '@/lib/api';

const ICON_OPTIONS = [
  { value: 'Building2', label: 'Building', icon: Building2 },
  { value: 'Car', label: 'Vehicle', icon: Car },
  { value: 'Bed', label: 'Bed', icon: Bed },
  { value: 'GraduationCap', label: 'Classroom', icon: GraduationCap },
  { value: 'FlaskConical', label: 'Laboratory', icon: FlaskConical },
  { value: 'Dumbbell', label: 'Sports', icon: Dumbbell },
  { value: 'Projector', label: 'Equipment', icon: Projector },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Yes/No Toggle' },
  { value: 'select', label: 'Dropdown' },
  { value: 'multiselect', label: 'Multi-Select' },
  { value: 'textarea', label: 'Long Text' },
];

const APPROVAL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'hod', label: 'HOD' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'director', label: 'Director' },
];

interface CategoryManagementProps {
  orgId: string;
  categories: UtilityCategory[];
  utilities: Utility[];
  onCategoryCreate: (category: Partial<UtilityCategory>) => void;
  onCategoryUpdate: (category: UtilityCategory) => void;
  onCategoryDelete: (categoryId: string) => void;
}

const CategoryManagement: React.FC<CategoryManagementProps> = ({
  orgId,
  categories,
  utilities,
  onCategoryCreate,
  onCategoryUpdate,
  onCategoryDelete,
}) => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UtilityCategory | null>(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [hodUsers, setHodUsers] = useState<{ id: string; name: string; department: string }[]>([]);

  // Fetch HOD users for the approval step picker
  useEffect(() => {
    if (!orgId) return;
    UserApi.list(orgId).then((res: any) => {
      const users = (res.data || []).filter((u: any) => u.role === 'hod');
      setHodUsers(users.map((u: any) => ({ id: u._id || u.id, name: u.name, department: u.department || '' })));
    }).catch(() => { /* ignore */ });
  }, [orgId]);

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    icon: string;
    customFields: CustomField[];
    timeSlots: TimeSlot[];
    approvalSteps: ApprovalStepConfig[];
    allowSkipOnAdminApproval: boolean;
  }>({
    name: '',
    description: '',
    icon: 'Building2',
    customFields: [],
    timeSlots: [],
    approvalSteps: [{ id: 'step-1', order: 1, role: 'coordinator', label: 'Coordinator Approval', isRequired: true, canEdit: false }],
    allowSkipOnAdminApproval: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'Building2',
      customFields: [],
      timeSlots: [],
      approvalSteps: [{ id: 'step-1', order: 1, role: 'coordinator', label: 'Coordinator Approval', isRequired: true, canEdit: false }],
      allowSkipOnAdminApproval: true,
    });
    setActiveTab('basic');
  };

  const handleEditCategory = (category: UtilityCategory) => {
    // Ensure category has id field (from _id if needed)
    const categoryWithId = {
      ...category,
      id: (category as any)._id || category.id,
    };
    setEditingCategory(categoryWithId);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon,
      customFields: category.customFields,
      timeSlots: category.defaultTimeSlots,
      approvalSteps: category.approvalFlow.steps,
      allowSkipOnAdminApproval: category.approvalFlow.allowSkipOnAdminApproval,
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveCategory = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }

    const hasUnassignedHOD = formData.approvalSteps.some(step => step.role === 'hod' && !step.approverId);
    if (hasUnassignedHOD) {
      toast({ title: 'Error', description: 'Please select a specific HOD for the HOD approval step.', variant: 'destructive' });
      return;
    }

    const categoryData = {
      name: formData.name,
      slug: formData.name.toLowerCase().replace(/\s+/g, '-'),
      description: formData.description,
      icon: formData.icon,
      customFields: formData.customFields,
      defaultTimeSlots: formData.timeSlots,
      approvalFlow: {
        steps: formData.approvalSteps,
        allowSkipOnAdminApproval: formData.allowSkipOnAdminApproval,
      },
      isActive: true,
    };

    if (editingCategory) {
      // Ensure we have the correct ID for the update
      const categoryToUpdate = {
        ...editingCategory,
        ...categoryData,
        id: (editingCategory as any)._id || editingCategory.id,
      };
      onCategoryUpdate(categoryToUpdate);
      toast({ title: 'Success', description: 'Category updated successfully' });
    } else {
      onCategoryCreate(categoryData);
      toast({ title: 'Success', description: 'Category created successfully' });
    }

    setIsCreateDialogOpen(false);
    setEditingCategory(null);
    resetForm();
  };

  // Custom Field Management
  const addCustomField = () => {
    const newField: CustomField = {
      id: `cf-${Date.now()}`,
      name: '',
      label: '',
      type: 'text',
      required: false,
      showInCard: true,
      showInBooking: false,
    };
    setFormData({ ...formData, customFields: [...formData.customFields, newField] });
  };

  const updateCustomField = (index: number, field: Partial<CustomField>) => {
    const updatedFields = [...formData.customFields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    // Auto-generate name from label
    if (field.label) {
      updatedFields[index].name = field.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    }
    setFormData({ ...formData, customFields: updatedFields });
  };

  const removeCustomField = (index: number) => {
    const updatedFields = formData.customFields.filter((_, i) => i !== index);
    setFormData({ ...formData, customFields: updatedFields });
  };

  // Time Slot Management
  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
      label: '',
      isActive: true,
    };
    setFormData({ ...formData, timeSlots: [...formData.timeSlots, newSlot] });
  };

  const updateTimeSlot = (index: number, slot: Partial<TimeSlot>) => {
    const updatedSlots = [...formData.timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], ...slot };
    // Auto-generate label
    if (slot.startTime || slot.endTime) {
      const start = updatedSlots[index].startTime;
      const end = updatedSlots[index].endTime;
      updatedSlots[index].label = `${formatTime(start)} - ${formatTime(end)}`;
    }
    setFormData({ ...formData, timeSlots: updatedSlots });
  };

  const removeTimeSlot = (index: number) => {
    const updatedSlots = formData.timeSlots.filter((_, i) => i !== index);
    setFormData({ ...formData, timeSlots: updatedSlots });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Approval Step Management
  const addApprovalStep = () => {
    const nextOrder = formData.approvalSteps.length + 1;
    const availableRoles = APPROVAL_ROLES.filter(
      role => !formData.approvalSteps.some(step => step.role === role.value)
    );
    if (availableRoles.length === 0) {
      toast({ title: 'Info', description: 'All approval roles have been added' });
      return;
    }
    const newStep: ApprovalStepConfig = {
      id: `step-${Date.now()}`,
      order: nextOrder,
      role: availableRoles[0].value,
      label: `${availableRoles[0].label} Approval`,
      isRequired: true,
      canEdit: true,
    };
    setFormData({ ...formData, approvalSteps: [...formData.approvalSteps, newStep] });
  };

  const updateApprovalStep = (index: number, step: Partial<ApprovalStepConfig>) => {
    const updatedSteps = [...formData.approvalSteps];
    updatedSteps[index] = { ...updatedSteps[index], ...step };
    if (step.role) {
      const roleLabel = APPROVAL_ROLES.find(r => r.value === step.role)?.label || step.role;
      updatedSteps[index].label = `${roleLabel} Approval`;
      // Clear approverId when role changes away from hod
      if (step.role !== 'hod') {
        updatedSteps[index].approverId = undefined;
        updatedSteps[index].approverName = undefined;
      }
    }
    setFormData({ ...formData, approvalSteps: updatedSteps });
  };

  const removeApprovalStep = (index: number) => {
    if (formData.approvalSteps.length <= 1) {
      toast({ title: 'Error', description: 'At least one approval step is required', variant: 'destructive' });
      return;
    }
    const updatedSteps = formData.approvalSteps.filter((_, i) => i !== index);
    // Reorder steps
    updatedSteps.forEach((step, i) => {
      step.order = i + 1;
    });
    setFormData({ ...formData, approvalSteps: updatedSteps });
  };

  const applyApprovalTemplate = (templateKey: keyof typeof APPROVAL_FLOW_TEMPLATES) => {
    const template = APPROVAL_FLOW_TEMPLATES[templateKey];
    setFormData({
      ...formData,
      approvalSteps: template.steps.map((step, index) => ({
        ...step,
        id: `step-${Date.now()}-${index}`,
      })),
      allowSkipOnAdminApproval: template.allowSkipOnAdminApproval,
    });
    toast({ title: 'Template Applied', description: template.name });
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(i => i.value === iconName);
    return iconOption ? iconOption.icon : Building2;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#123458] tracking-tight">Utility Categories</h2>
          <p className="text-xs text-slate-500 font-semibold">Define resource classes with custom form fields, timeslots, and approval workflows</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingCategory(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#123458] hover:bg-[#123458]/90 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition duration-200 shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-slate-100 shadow-xl rounded-3xl p-6 bg-white">
            <DialogHeader className="border-b border-slate-100 pb-4">
              <DialogTitle className="text-lg font-black text-slate-800">{editingCategory ? 'Edit Utility Category' : 'Create New Category'}</DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
              <div className="lg:col-span-2 space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full bg-slate-100/70 p-1 border border-slate-200/50 rounded-xl mb-4">
                <TabsTrigger value="basic" className="rounded-lg text-xs font-bold py-2">Basic Info</TabsTrigger>
                <TabsTrigger value="fields" className="rounded-lg text-xs font-bold py-2">Custom Fields</TabsTrigger>
                <TabsTrigger value="slots" className="rounded-lg text-xs font-bold py-2">Time Slots</TabsTrigger>
                <TabsTrigger value="approval" className="rounded-lg text-xs font-bold py-2">Approval Flow</TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold text-slate-500">Category Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Hall, Vehicle, Guest Room"
                      className="border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="icon" className="text-xs font-bold text-slate-500">Icon</Label>
                    <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                      <SelectTrigger className="border-slate-200 text-xs h-10 rounded-xl focus:ring-[#123458]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            <div className="flex items-center gap-2">
                              <option.icon className="w-4 h-4 opacity-75" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-bold text-slate-500">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this category, its purpose, and booking eligibility..."
                    className="border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs"
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Custom Fields Tab */}
              <TabsContent value="fields" className="space-y-4 mt-2">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Custom Fields Configuration</p>
                  <Button variant="outline" size="sm" onClick={addCustomField} className="h-8 border-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50 hover:text-slate-800">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Field
                  </Button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {formData.customFields.map((field, index) => (
                    <Card key={field.id || (field as any)._id || field.name || index} className="p-4 border-slate-100 shadow-2xs rounded-2xl bg-slate-50/20">
                      <div className="grid grid-cols-6 gap-3 items-end">
                        <div className="col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Field Label *</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateCustomField(index, { label: e.target.value })}
                            placeholder="e.g., Capacity, Vehicle Model"
                            className="bg-white border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</Label>
                          <Select value={field.type} onValueChange={(value: any) => updateCustomField(index, { type: value })}>
                            <SelectTrigger className="bg-white border-slate-200 text-xs h-9 rounded-xl focus:ring-[#123458]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="text-xs">{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 pb-2 justify-center">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateCustomField(index, { required: checked })}
                          />
                          <Label className="text-xs font-bold text-slate-600">Required</Label>
                        </div>
                        <div className="flex items-center gap-2 pb-2 justify-center">
                          <Switch
                            checked={field.showInBooking}
                            onCheckedChange={(checked) => updateCustomField(index, { showInBooking: checked })}
                          />
                          <Label className="text-xs font-bold text-slate-600">In Booking</Label>
                        </div>
                        <div className="flex justify-end pb-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeCustomField(index)} 
                            className="hover:bg-rose-50 rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {(field.type === 'select' || field.type === 'multiselect') && (
                        <div className="mt-3.5 space-y-1.5">
                          <Label className="text-xs font-bold text-slate-500">Options (comma-separated)</Label>
                          <Input
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateCustomField(index, { options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                            placeholder="Option 1, Option 2, Option 3"
                            className="bg-white border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs h-9"
                          />
                        </div>
                      )}
                    </Card>
                  ))}
                  {formData.customFields.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs border-2 border-dashed border-slate-200/60 rounded-2xl">
                      No custom fields defined. Click "Add Field" to define metadata questions for this category.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Time Slots Tab */}
              <TabsContent value="slots" className="space-y-4 mt-2">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Configure Booking Interval Slots</p>
                  <Button variant="outline" size="sm" onClick={addTimeSlot} className="h-8 border-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50 hover:text-slate-800">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Slot
                  </Button>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {formData.timeSlots.map((slot, index) => (
                    <div key={slot.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50/20">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex items-center gap-2 shrink-0">
                        <Input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateTimeSlot(index, { startTime: e.target.value })}
                          className="w-28 bg-white border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs h-9"
                        />
                        <span className="text-slate-400 text-xs font-semibold">to</span>
                        <Input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateTimeSlot(index, { endTime: e.target.value })}
                          className="w-28 bg-white border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs h-9"
                        />
                      </div>
                      <Input
                        value={slot.label}
                        onChange={(e) => updateTimeSlot(index, { label: e.target.value })}
                        placeholder="Slot label (auto-generated if empty)"
                        className="flex-1 bg-white border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs h-9"
                      />
                      <div className="flex items-center gap-3.5">
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={slot.isActive}
                            onCheckedChange={(checked) => updateTimeSlot(index, { isActive: checked })}
                          />
                          <Label className="text-xs font-bold text-slate-500">Active</Label>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeTimeSlot(index)} 
                          className="hover:bg-rose-50 rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {formData.timeSlots.length === 0 && (
                    <div className="text-center py-10 text-slate-400 text-xs border-2 border-dashed border-slate-200/60 rounded-2xl">
                      No time slots defined. Click "Add Slot" to define daily booking hours.
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Approval Flow Tab */}
              <TabsContent value="approval" className="space-y-4 mt-2">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Multi-stage Approval Pipeline</p>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(value) => applyApprovalTemplate(value as keyof typeof APPROVAL_FLOW_TEMPLATES)}>
                      <SelectTrigger className="w-44 text-xs h-8 rounded-xl border-slate-200 focus:ring-[#123458]">
                        <SelectValue placeholder="Apply Template" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(APPROVAL_FLOW_TEMPLATES).map(([key, template]) => (
                          <SelectItem key={key} value={key} className="text-xs">{template.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={addApprovalStep} className="h-8 border-slate-200 font-bold text-xs rounded-xl hover:bg-slate-50 hover:text-slate-800">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Step
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                  {formData.approvalSteps.map((step, index) => (
                    <div key={step.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/20 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#123458] to-[#1d528b] text-white font-bold text-xs shrink-0 shadow-xs">
                          {step.order}
                        </div>
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Select value={step.role} onValueChange={(value: UserRole) => updateApprovalStep(index, { role: value })}>
                              <SelectTrigger className="bg-white border-slate-200 text-xs h-9 rounded-xl focus:ring-[#123458]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {APPROVAL_ROLES.map((role) => (
                                  <SelectItem key={role.value} value={role.value} className="text-xs">{role.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Input
                              value={step.label}
                              onChange={(e) => updateApprovalStep(index, { label: e.target.value })}
                              placeholder="e.g. Dean Approval"
                              className="bg-white border-slate-200 focus-visible:ring-[#123458] rounded-xl text-xs h-9"
                            />
                          </div>
                          <div className="flex items-center gap-3 justify-end pr-2">
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={step.isRequired}
                                onCheckedChange={(checked) => updateApprovalStep(index, { isRequired: checked })}
                              />
                              <Label className="text-[10px] font-bold text-slate-500">Required</Label>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Switch
                                checked={step.canEdit}
                                onCheckedChange={(checked) => updateApprovalStep(index, { canEdit: checked })}
                              />
                              <Label className="text-[10px] font-bold text-slate-500">Can Edit</Label>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeApprovalStep(index)} 
                          className="hover:bg-rose-50 rounded-xl h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {/* HOD-specific user picker */}
                      {step.role === 'hod' && (
                        <div className="ml-10 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <Select
                            value={step.approverId || ''}
                            onValueChange={(value) => {
                              const hod = hodUsers.find(u => u.id === value);
                              updateApprovalStep(index, { approverId: value, approverName: hod?.name });
                            }}
                          >
                            <SelectTrigger className="bg-white border-slate-200 text-xs h-8 rounded-xl focus:ring-[#123458] flex-1">
                              <SelectValue placeholder="Select HOD" />
                            </SelectTrigger>
                            <SelectContent>
                              {hodUsers.map((hod) => (
                                <SelectItem key={hod.id} value={hod.id} className="text-xs">
                                  {hod.name}{hod.department ? ` — ${hod.department}` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {step.approverId && (
                            <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 shrink-0">
                              HOD Assigned
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50/30 border border-blue-100/50 rounded-2xl">
                  <Switch
                    checked={formData.allowSkipOnAdminApproval}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowSkipOnAdminApproval: checked })}
                  />
                  <div>
                    <Label className="font-bold text-slate-800 text-xs">Allow Admin to Bypass Pipeline</Label>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">If toggled, the Organization Admin can instantly confirm or reject requests without routing them through HOD/Registrar/Director stages</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Live Card Preview Column */}
          <div className="lg:col-span-1 space-y-4 lg:border-l lg:border-slate-100 lg:pl-6 pt-4 lg:pt-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Live Card Preview</span>
            
            <div className="border border-slate-100/80 rounded-2xl bg-white shadow-[0_8px_25px_-5px_rgba(18,52,88,0.06)] p-5 space-y-4 sticky top-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#123458] to-[#1d528b] text-white shadow-sm shadow-[#123458]/10">
                    {(() => {
                      const IconComponent = getIconComponent(formData.icon);
                      return <IconComponent className="w-5 h-5" />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-slate-800 tracking-tight truncate max-w-[150px]">
                      {formData.name || 'Category Name'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-') : 'slug-preview'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 rounded-lg border-0 bg-emerald-50 text-emerald-700">
                  Active
                </Badge>
              </div>

              <p className="text-xs text-slate-500 font-medium leading-relaxed min-h-[32px] line-clamp-2">
                {formData.description || 'Define a category description to preview card text layout...'}
              </p>

              <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                <div className="flex flex-col items-center">
                  <p className="text-base font-black text-slate-800 leading-tight">{formData.customFields.length}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Fields</p>
                </div>
                <div className="flex flex-col items-center border-x border-slate-200/50">
                  <p className="text-base font-black text-slate-800 leading-tight">{formData.timeSlots.length}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Slots</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-base font-black text-slate-800 leading-tight">{formData.approvalSteps.length}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Steps</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-1 min-h-[26px]">
                {formData.approvalSteps.map((step, index) => (
                  <React.Fragment key={step.id || `preview-step-${index}-${step.role}`}>
                    <Badge variant="outline" className="text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 border-slate-200 text-slate-500 bg-white">
                      {step.role.replace('_', ' ')}
                    </Badge>
                    {index < formData.approvalSteps.length - 1 && (
                      <span className="text-slate-300 text-xs font-bold">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">Linked Utilities</span>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px]">
                  0 facilities
                </Badge>
              </div>
            </div>
          </div>
        </div>

            <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setEditingCategory(null);
                resetForm();
              }} className="rounded-xl text-xs h-9 border-slate-200 hover:bg-slate-50 font-bold px-4">
                Cancel
              </Button>
              <Button onClick={handleSaveCategory} className="bg-[#123458] hover:bg-[#123458]/90 text-white font-bold text-xs h-9 rounded-xl px-4 shadow-xs transition duration-200">
                {editingCategory ? 'Update Category' : 'Create Category'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          return (
            <Card key={category.id} className="group border-slate-100/80 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.03)] hover:shadow-[0_12px_30px_-6px_rgba(18,52,88,0.08)] bg-white rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden">
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#123458] to-[#1d528b] text-white shadow-sm shadow-[#123458]/10 group-hover:scale-105 transition-transform duration-200">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-bold text-slate-800 tracking-tight group-hover:text-[#123458] transition-colors">{category.name}</CardTitle>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{category.slug}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border-0 shrink-0 ${
                      category.isActive 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-5 pb-5">
                <p className="text-xs text-slate-500 font-medium leading-relaxed min-h-[32px] line-clamp-2">{category.description || 'No description provided.'}</p>
                
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                  <div key={`${category.id}-fields`} className="flex flex-col items-center">
                    <p className="text-base font-black text-slate-800 leading-tight">{category.customFields.length}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Fields</p>
                  </div>
                  <div key={`${category.id}-slots`} className="flex flex-col items-center border-x border-slate-200/50">
                    <p className="text-base font-black text-slate-800 leading-tight">{category.defaultTimeSlots.length}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Slots</p>
                  </div>
                  <div key={`${category.id}-steps`} className="flex flex-col items-center">
                    <p className="text-base font-black text-slate-800 leading-tight">{category.approvalFlow.steps.length}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Steps</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-1 min-h-[26px]">
                  {category.approvalFlow.steps.map((step, index) => (
                    <React.Fragment key={step.id || `step-${index}-${step.role}`}>
                      <Badge variant="outline" className="text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 border-slate-200 text-slate-500 bg-white">
                        {step.role.replace('_', ' ')}
                      </Badge>
                      {index < category.approvalFlow.steps.length - 1 && (
                        <span className="text-slate-300 text-xs font-bold">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Linked Utilities */}
                {(() => {
                  const categoryUtilities = (utilities || []).filter(
                    u => String(u.categoryId) === String(category.id || (category as any)._id)
                  );
                  return (
                    <div className="space-y-2 pt-3 border-t border-slate-100/80">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Linked Utilities ({categoryUtilities.length})
                      </span>
                      {categoryUtilities.length === 0 ? (
                        <p className="text-[11px] text-slate-400 italic font-medium">No utilities linked yet</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                          {categoryUtilities.map((u) => {
                            const uId = u._id || u.id;
                            return (
                              <Badge 
                                key={String(uId)} 
                                variant="outline" 
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                                  u.isActive 
                                    ? 'bg-blue-50/20 text-[#123458] border-blue-100/60 hover:bg-blue-50/40' 
                                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100/50'
                                }`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                {u.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex gap-2 pt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 font-bold text-xs h-9 border-slate-200 rounded-xl hover:bg-blue-50/20 hover:text-[#123458] hover:border-blue-200 transition-all" 
                    onClick={() => handleEditCategory(category)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5 opacity-70" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50/20 hover:border-rose-200 border-slate-200 w-9 h-9 p-0 rounded-xl transition-all"
                    onClick={() => onCategoryDelete(category.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {categories.length === 0 && (
        <Card className="border border-slate-200/70 p-12 rounded-2xl bg-white shadow-2xs">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No Categories Yet</h3>
            <p className="text-xs text-slate-500 mb-5 font-semibold">Create your first utility category to start adding and managing campus assets</p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-[#123458] hover:bg-[#123458]/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition duration-200">
              <Plus className="w-4 h-4 mr-1.5" /> Create Category
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CategoryManagement;
