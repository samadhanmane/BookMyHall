import React, { useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
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
  Clock,
  Users,
  MapPin,
  Settings,
  Search,
  Check,
  X,
  Image as ImageIcon,
  Upload,
  Calendar as CalendarIcon,
  Ban
} from 'lucide-react';
import { Utility, UtilityCategory, TimeSlot, ApprovalStep, User } from '@/types/utility';
import { useToast } from '@/hooks/use-toast';

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Building2,
  Car,
  Bed,
  GraduationCap,
  FlaskConical,
  Dumbbell,
  Projector,
};

interface UtilityManagementProps {
  utilities: Utility[];
  categories: UtilityCategory[];
  coordinators: User[];
  onUtilityCreate: (utility: Partial<Utility>) => void;
  onUtilityUpdate: (utility: Utility) => void;
  onUtilityDelete: (utilityId: string) => void;
}

const UtilityManagement: React.FC<UtilityManagementProps> = ({
  utilities,
  categories,
  coordinators,
  onUtilityCreate,
  onUtilityUpdate,
  onUtilityDelete,
}) => {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUtility, setEditingUtility] = useState<Utility | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [coordinatorSearchOpen, setCoordinatorSearchOpen] = useState(false);
  const [coordinatorSearchTerm, setCoordinatorSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    categoryId: string;
    customFieldValues: Record<string, any>;
    coordinatorIds: string[];
    timeSlots: TimeSlot[];
    images: string[];
    isActive: boolean;
    disabledDateRanges: Array<{ startDate: string; endDate: string; reason?: string }>;
    disabledDaysOfWeek: number[];
  }>({
    name: '',
    description: '',
    categoryId: '',
    customFieldValues: {},
    coordinatorIds: [],
    timeSlots: [],
    images: [],
    isActive: true,
    disabledDateRanges: [],
    disabledDaysOfWeek: [],
  });

  const selectedCategory = categories.find(c => c.id === formData.categoryId);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      categoryId: '',
      customFieldValues: {},
      coordinatorIds: [],
      timeSlots: [],
      images: [],
      isActive: true,
      disabledDateRanges: [],
      disabledDaysOfWeek: [],
    });
    setSelectedCategoryId('');
    setEditingUtility(null);
  };

  const handleCategorySelect = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setFormData({
        ...formData,
        categoryId,
        customFieldValues: category.customFields.reduce((acc, field) => {
          acc[field.name] = field.defaultValue ?? (field.type === 'boolean' ? false : field.type === 'number' ? 0 : '');
          return acc;
        }, {} as Record<string, any>),
        timeSlots: [...category.defaultTimeSlots],
      });
    }
  };

  const handleEditUtility = (utility: Utility) => {
    setEditingUtility(utility);
    setFormData({
      name: utility.name,
      description: utility.description,
      categoryId: utility.categoryId,
      customFieldValues: utility.customFieldValues,
      coordinatorIds: utility.coordinatorIds,
      timeSlots: utility.timeSlots,
      images: utility.images || [],
      isActive: utility.isActive,
      disabledDateRanges: utility.disabledDateRanges || [],
      disabledDaysOfWeek: utility.disabledDaysOfWeek || [],
    });
    setSelectedCategoryId(utility.categoryId);
    setIsCreateDialogOpen(true);
  };

  // Compress image to reduce file size
  const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        };
        img.onerror = reject;
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please select image files only',
        variant: 'destructive',
      });
      return;
    }

    // Check file sizes (max 5MB per file before compression)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: 'Please select images smaller than 5MB. Images will be compressed automatically.',
        variant: 'destructive',
      });
      // Continue with other files
    }

    const validFiles = imageFiles.filter(file => file.size <= 5 * 1024 * 1024);

    // Compress and convert images to base64
    const imagePromises = validFiles.map(file => compressImage(file));

    Promise.all(imagePromises)
      .then(base64Images => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...base64Images],
        }));
        toast({
          title: 'Success',
          description: `${validFiles.length} image(s) uploaded and compressed successfully`,
        });
      })
      .catch(error => {
        console.error('Image upload error:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload images. Please try again.',
          variant: 'destructive',
        });
      });

    // Reset input
    e.target.value = '';
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSaveUtility = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Utility name is required', variant: 'destructive' });
      return;
    }
    if (!formData.categoryId) {
      toast({ title: 'Error', description: 'Please select a category', variant: 'destructive' });
      return;
    }

    const category = categories.find(c => c.id === formData.categoryId);
    const utilityData = {
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId,
      categoryName: category?.name || '',
      customFieldValues: formData.customFieldValues,
      coordinatorIds: formData.coordinatorIds,
      timeSlots: formData.timeSlots,
      images: formData.images,
      approvalFlow: category?.approvalFlow.steps.map(step => ({
        id: step.id,
        order: step.order,
        role: step.role,
        label: step.label,
        isRequired: step.isRequired,
        approverId: step.approverId,
        approverName: step.approverName,
      })) || [],
      isActive: formData.isActive,
      disabledDateRanges: formData.disabledDateRanges,
      disabledDaysOfWeek: formData.disabledDaysOfWeek,
    };

    if (editingUtility) {
      // Ensure we preserve the original ID
      const utilityId = (editingUtility as any)._id || editingUtility.id;
      onUtilityUpdate({ 
        ...editingUtility, 
        ...utilityData,
        id: utilityId,
        _id: (editingUtility as any)._id || undefined
      });
      // Don't show success toast here - let the parent handle it
    } else {
      onUtilityCreate(utilityData);
      toast({ title: 'Success', description: 'Utility created successfully' });
    }

    setIsCreateDialogOpen(false);
    setEditingUtility(null);
    resetForm();
  };

  const updateCustomFieldValue = (fieldName: string, value: any) => {
    setFormData({
      ...formData,
      customFieldValues: {
        ...formData.customFieldValues,
        [fieldName]: value,
      },
    });
  };

  const toggleCoordinator = (coordinatorId: string) => {
    const coordIdStr = String(coordinatorId);
    setFormData(prev => {
      const isSelected = prev.coordinatorIds.some(id => String(id) === coordIdStr);
      const newIds = isSelected
        ? prev.coordinatorIds.filter(id => String(id) !== coordIdStr)
        : [...prev.coordinatorIds.filter(id => String(id) !== coordIdStr), coordIdStr];
      return {
        ...prev,
        coordinatorIds: newIds,
      };
    });
  };

  const removeCoordinator = (coordinatorId: string) => {
    const coordIdStr = String(coordinatorId);
    setFormData(prev => ({
      ...prev,
      coordinatorIds: prev.coordinatorIds.filter(id => String(id) !== coordIdStr),
    }));
  };

  // Filter coordinators based on search term
  const filteredCoordinators = coordinators.filter(coordinator => {
    const coordId = (coordinator as any)._id || coordinator.id;
    const name = coordinator.name || '';
    const email = coordinator.email || '';
    const department = coordinator.department || '';
    return (
      name.toLowerCase().includes(coordinatorSearchTerm.toLowerCase()) ||
      email.toLowerCase().includes(coordinatorSearchTerm.toLowerCase()) ||
      department.toLowerCase().includes(coordinatorSearchTerm.toLowerCase())
    );
  });

  // Get selected coordinator details - ensure we use the correct ID field
  const selectedCoordinators = coordinators.filter(c => {
    const coordId = String((c as any)._id || c.id);
    return formData.coordinatorIds.some(id => String(id) === coordId);
  });

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      startTime: '09:00',
      endTime: '10:00',
      label: '9:00 AM - 10:00 AM',
      isActive: true,
    };
    setFormData({ ...formData, timeSlots: [...formData.timeSlots, newSlot] });
  };

  const updateTimeSlot = (index: number, slot: Partial<TimeSlot>) => {
    const updatedSlots = [...formData.timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], ...slot };
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

  const getIconComponent = (iconName: string) => {
    return ICON_MAP[iconName] || Building2;
  };

  const filteredUtilities = filterCategory === 'all'
    ? utilities
    : utilities.filter(u => u.categoryId === filterCategory);

  const renderCustomFieldInput = (field: any, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Switch checked={!!value} onCheckedChange={onChange} />
            <Label>{field.label}</Label>
          </div>
        );
      case 'number':
        return (
          <div className="space-y-1">
            <Label>{field.label} {field.required && '*'}</Label>
            <Input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(parseInt(e.target.value) || 0)}
              placeholder={field.placeholder}
            />
          </div>
        );
      case 'select':
        return (
          <div className="space-y-1">
            <Label>{field.label} {field.required && '*'}</Label>
            <Select value={value || ''} onValueChange={onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-1">
            <Label>{field.label} {field.required && '*'}</Label>
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              rows={3}
            />
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <Label>{field.label} {field.required && '*'}</Label>
            <Input
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-[#123458] tracking-tight">Utility Directory</h2>
          <p className="text-xs text-slate-500 font-semibold">Manage physical spaces, shuttle vehicles, equipment, and room assets</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-44 border-slate-200 text-xs h-9 rounded-xl focus:ring-[#123458]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs">{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingUtility(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-[#123458] hover:bg-[#123458]/90 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition duration-200">
                <Plus className="w-4 h-4 mr-1.5" /> Add Utility
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-slate-100 shadow-xl rounded-3xl p-6 bg-white">
              <DialogHeader className="border-b border-slate-100 pb-4">
                <DialogTitle className="text-lg font-black text-slate-800">{editingUtility ? 'Edit Utility' : 'Create New Utility'}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={handleCategorySelect}
                    disabled={!!editingUtility}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => {
                        const IconComponent = getIconComponent(cat.icon);
                        return (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {cat.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {formData.categoryId && (
                  <>
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Utility Name *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g., Main Auditorium, Bus 1"
                        />
                      </div>
                      <div className="flex items-center gap-3 pt-7">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                        <Label>Active</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe this utility..."
                        rows={2}
                      />
                    </div>

                    {/* Custom Fields */}
                    {selectedCategory && selectedCategory.customFields.filter(f => !f.showInBooking).length > 0 && (
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Utility Details</Label>
                        <div className="grid grid-cols-2 gap-4">
                          {selectedCategory.customFields
                            .filter(field => !field.showInBooking)
                            .map((field) => (
                              <div key={field.id}>
                                {renderCustomFieldInput(
                                  field,
                                  formData.customFieldValues[field.name],
                                  (value) => updateCustomFieldValue(field.name, value)
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Coordinators */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Assign Coordinators</Label>
                      
                      {/* Selected Coordinators Display */}
                      {selectedCoordinators.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {selectedCoordinators.map(coordinator => {
                            const coordId = String((coordinator as any)._id || coordinator.id);
                            return (
                              <Badge key={coordId} variant="secondary" className="pr-1">
                                <span className="mr-1">{coordinator.name}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    removeCoordinator(coordId);
                                  }}
                                  className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Searchable Coordinator Dropdown */}
                      <Popover 
                        open={coordinatorSearchOpen} 
                        onOpenChange={(open) => {
                          setCoordinatorSearchOpen(open);
                          if (!open) {
                            setCoordinatorSearchTerm(''); // Reset search when closing
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                            type="button"
                          >
                            <div className="flex items-center gap-2">
                              <Search className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {selectedCoordinators.length > 0
                                  ? `${selectedCoordinators.length} coordinator${selectedCoordinators.length > 1 ? 's' : ''} selected`
                                  : 'Search and select coordinators...'}
                              </span>
                            </div>
                            <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Search by name, email, or department..."
                              value={coordinatorSearchTerm}
                              onValueChange={setCoordinatorSearchTerm}
                            />
                            <CommandList>
                              <CommandEmpty>No coordinators found.</CommandEmpty>
                              <CommandGroup>
                                {filteredCoordinators.map(coordinator => {
                                  // Get the correct ID (handle both _id from MongoDB and id)
                                  const coordId = String((coordinator as any)._id || coordinator.id);
                                  const isSelected = formData.coordinatorIds.some(id => String(id) === coordId);
                                  // Create searchable value for Command component
                                  const searchValue = `${coordinator.name} ${coordinator.email} ${coordinator.department || ''}`;
                                  return (
                                    <CommandItem
                                      key={coordId}
                                      value={searchValue}
                                      onSelect={() => {
                                        // Prevent default Command selection behavior - we handle it with onClick
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <div 
                                        className="flex items-center justify-between w-full"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          // Use the correct coordinator ID - ensure it's a string
                                          toggleCoordinator(coordId);
                                        }}
                                        onMouseDown={(e) => {
                                          // Prevent Command component from handling the click
                                          e.stopPropagation();
                                        }}
                                      >
                                        <div className="flex items-center gap-2 flex-1">
                                          <div
                                            className={`flex h-4 w-4 items-center justify-center rounded-sm border ${
                                              isSelected
                                                ? 'bg-primary text-primary-foreground'
                                                : 'border-input'
                                            }`}
                                          >
                                            {isSelected && (
                                              <Check className="h-3 w-3" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-medium text-sm">{coordinator.name}</p>
                                            <p className="text-xs text-muted-foreground">{coordinator.email}</p>
                                            {coordinator.department && (
                                              <p className="text-xs text-muted-foreground">{coordinator.department}</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      
                      {coordinators.length === 0 && (
                        <p className="text-sm text-muted-foreground">No coordinators available. Create coordinators in the Users section.</p>
                      )}
                    </div>

                    {/* Images */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Images</Label>
                      <div className="space-y-4">
                        {/* Image Upload Button */}
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            id="image-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('image-upload')?.click()}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Images
                          </Button>
                        </div>

                        {/* Image Previews */}
                        {formData.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {formData.images.map((image, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                                  <img
                                    src={image}
                                    alt={`Utility image ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleRemoveImage(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {formData.images.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                            <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">No images uploaded</p>
                            <p className="text-xs text-muted-foreground mt-1">Click "Upload Images" to add images</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">Time Slots</Label>
                        <Button variant="outline" size="sm" onClick={addTimeSlot}>
                          <Plus className="w-4 h-4 mr-2" /> Add Slot
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {formData.timeSlots.map((slot, index) => (
                          <div key={slot.id} className="flex items-center gap-3 p-2 border rounded-lg">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateTimeSlot(index, { startTime: e.target.value })}
                              className="w-28"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateTimeSlot(index, { endTime: e.target.value })}
                              className="w-28"
                            />
                            <Input
                              value={slot.label}
                              onChange={(e) => updateTimeSlot(index, { label: e.target.value })}
                              className="flex-1"
                            />
                            <Switch
                              checked={slot.isActive}
                              onCheckedChange={(checked) => updateTimeSlot(index, { isActive: checked })}
                            />
                            <Button variant="ghost" size="sm" onClick={() => removeTimeSlot(index)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Disabled Dates & Days */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-base font-medium">Booking Restrictions</Label>
                      </div>

                      {/* Disabled Date Ranges (e.g., Exam Periods) */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Disable for Specific Time Periods</Label>
                        <p className="text-xs text-muted-foreground">
                          Add date ranges when this utility should not be available (e.g., examination periods)
                        </p>
                        {formData.disabledDateRanges.map((range, index) => (
                          <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Start Date</Label>
                                <Input
                                  type="date"
                                  value={range.startDate}
                                  onChange={(e) => {
                                    const newRanges = [...formData.disabledDateRanges];
                                    newRanges[index] = { ...range, startDate: e.target.value };
                                    setFormData({ ...formData, disabledDateRanges: newRanges });
                                  }}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">End Date</Label>
                                <Input
                                  type="date"
                                  value={range.endDate}
                                  onChange={(e) => {
                                    const newRanges = [...formData.disabledDateRanges];
                                    newRanges[index] = { ...range, endDate: e.target.value };
                                    setFormData({ ...formData, disabledDateRanges: newRanges });
                                  }}
                                />
                              </div>
                            </div>
                            <div className="flex-1 space-y-1">
                              <Label className="text-xs">Reason (optional)</Label>
                              <Input
                                placeholder="e.g., Examination Period"
                                value={range.reason || ''}
                                onChange={(e) => {
                                  const newRanges = [...formData.disabledDateRanges];
                                  newRanges[index] = { ...range, reason: e.target.value };
                                  setFormData({ ...formData, disabledDateRanges: newRanges });
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  disabledDateRanges: formData.disabledDateRanges.filter((_, i) => i !== index),
                                });
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date().toISOString().split('T')[0];
                            setFormData({
                              ...formData,
                              disabledDateRanges: [
                                ...formData.disabledDateRanges,
                                { startDate: today, endDate: today },
                              ],
                            });
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Date Range
                        </Button>
                      </div>

                      {/* Disabled Days of Week (Recurring) */}
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500">Disable on Specific Days of Week</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 0, label: 'Sun' },
                            { value: 1, label: 'Mon' },
                            { value: 2, label: 'Tue' },
                            { value: 3, label: 'Wed' },
                            { value: 4, label: 'Thu' },
                            { value: 5, label: 'Fri' },
                            { value: 6, label: 'Sat' },
                          ].map((day) => {
                            const isSelected = formData.disabledDaysOfWeek.includes(day.value);
                            return (
                              <Button
                                key={day.value}
                                type="button"
                                variant={isSelected ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => {
                                  const newDays = isSelected
                                    ? formData.disabledDaysOfWeek.filter(d => d !== day.value)
                                    : [...formData.disabledDaysOfWeek, day.value];
                                  setFormData({ ...formData, disabledDaysOfWeek: newDays });
                                }}
                                className={`text-xs h-7 rounded-lg px-2.5 ${
                                  isSelected 
                                    ? 'bg-[#123458] text-white hover:bg-[#123458]/90 font-bold shadow-2xs' 
                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {day.label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Approval Flow Preview */}
                    {selectedCategory && (
                      <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl">
                        <Label className="text-xs font-bold text-[#123458] uppercase tracking-wider">Approval Stage Flow</Label>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {selectedCategory.approvalFlow.steps.map((step, index) => (
                            <React.Fragment key={step.id || `step-${index}-${step.role}`}>
                              <Badge variant="outline" className="text-[10px] font-semibold uppercase px-2 py-0.5 border-slate-200 text-slate-500 bg-white">
                                {step.label}
                              </Badge>
                              {index < selectedCategory.approvalFlow.steps.length - 1 && (
                                <span className="text-slate-300 text-xs font-bold">→</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4 mt-6">
                <Button variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingUtility(null);
                  resetForm();
                }} className="rounded-xl text-xs h-9 border-slate-200 hover:bg-slate-50 font-bold px-4">
                  Cancel
                </Button>
                <Button onClick={handleSaveUtility} className="bg-[#123458] hover:bg-[#123458]/90 text-white font-bold text-xs h-9 rounded-xl px-4 shadow-xs transition duration-200">
                  {editingUtility ? 'Update Utility' : 'Create Utility'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Utilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUtilities.map((utility) => {
          const category = categories.find(c => c.id === utility.categoryId);
          const IconComponent = category ? getIconComponent(category.icon) : Building2;
          
          return (
            <Card key={utility.id} className="group border-slate-100/80 shadow-[0_4px_20px_-4px_rgba(18,52,88,0.03)] hover:shadow-[0_12px_30px_-6px_rgba(18,52,88,0.08)] bg-white rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
              <div>
                {utility.images && utility.images.length > 0 ? (
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-50">
                    <img 
                      src={utility.images[0]} 
                      alt={utility.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border-0 shadow-xs ${
                        utility.isActive 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-500 text-white'
                      }`}>
                        {utility.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    {utility.images.length > 1 && (
                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs backdrop-blur-xs">
                        <ImageIcon className="w-3 h-3 text-white/90" />
                        <span>1 of {utility.images.length}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative aspect-video w-full bg-slate-50 border-b border-slate-100/50 flex items-center justify-center text-slate-300 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/20 opacity-50" />
                    <IconComponent className="w-10 h-10 text-slate-300 group-hover:scale-110 transition-transform duration-200" />
                    <div className="absolute top-3 right-3">
                      <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border-0 shadow-xs ${
                        utility.isActive 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-slate-500 text-white'
                      }`}>
                        {utility.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <CardHeader className="pb-2 pt-4 px-5">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base font-bold text-slate-800 tracking-tight truncate group-hover:text-[#123458] transition-colors">{utility.name}</CardTitle>
                      <Badge variant="outline" className="text-[9px] font-bold tracking-wide uppercase px-2 py-0.5 border-slate-200 text-[#123458] bg-blue-50/20 shrink-0">
                        {utility.categoryName}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 px-5">
                  <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 min-h-[32px]">{utility.description || 'No description provided for this resource.'}</p>
                  
                  {/* Custom Field Values Display */}
                  {category && category.customFields.filter(f => f.showInCard && utility.customFieldValues[f.name] !== undefined).length > 0 && (
                    <div className="space-y-2 border-t border-slate-100/80 pt-3.5">
                      <div className="grid grid-cols-2 gap-2">
                        {category.customFields
                          .filter(f => f.showInCard && utility.customFieldValues[f.name] !== undefined)
                          .slice(0, 4)
                          .map(field => (
                            <div key={field.id || (field as any)._id || field.name} className="bg-slate-50/70 border border-slate-100/60 rounded-xl p-2 flex flex-col min-w-0">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">{field.label}</span>
                              <span className="font-extrabold text-[11px] text-slate-700 mt-0.5 truncate">
                                {typeof utility.customFieldValues[field.name] === 'boolean'
                                  ? (utility.customFieldValues[field.name] ? 'Yes' : 'No')
                                  : String(utility.customFieldValues[field.name])}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100/80 mt-2">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{utility.timeSlots.length} booking slots</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-slate-500">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{utility.coordinatorIds.length} assignees</span>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="px-5 pb-5 pt-3">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 font-bold text-xs h-9 border-slate-200 rounded-xl hover:bg-blue-50/20 hover:text-[#123458] hover:border-blue-200 transition-all" 
                    onClick={() => handleEditUtility(utility)}
                  >
                    <Edit className="w-3.5 h-3.5 mr-1.5 opacity-70" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50/20 hover:border-rose-200 border-slate-200 w-9 h-9 p-0 rounded-xl transition-all"
                    onClick={() => onUtilityDelete(utility.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredUtilities.length === 0 && (
        <Card className="border border-slate-200/70 p-12 rounded-2xl bg-white shadow-2xs">
          <div className="text-center">
            <Settings className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No Utilities Yet</h3>
            <p className="text-xs text-slate-500 mb-5 font-semibold">
              {categories.length === 0 
                ? 'Create a category first, then add utilities'
                : 'Add your first utility to start accepting bookings'}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} disabled={categories.length === 0} className="bg-[#123458] hover:bg-[#123458]/90 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition duration-200">
              <Plus className="w-4 h-4 mr-1.5" /> Add Utility
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UtilityManagement;
