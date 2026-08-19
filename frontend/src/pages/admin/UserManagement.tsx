import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Edit, Trash2, Filter } from 'lucide-react';
import { UserApi, RequisitionApi, getApiErrorMessage } from '@/lib/api';
import { getAuthUser } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  phone?: string;
  organizationId: string;
}

const DEFAULT_DEPARTMENTS = [
  'Computer Science',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Electronics',
  'Information Technology',
  'Administration',
  'Other',
];

const UserManagement = () => {
  const { orgId } = useParams();
  const { toast } = useToast();
  const authUser = getAuthUser();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: '',
    phone: '',
  });

  const [departments, setDepartments] = useState<string[]>(DEFAULT_DEPARTMENTS);
  const [isSaving, setIsSaving] = useState(false);

  const roles = [
    { value: 'org_admin', label: 'Organization Admin' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'hod', label: 'HOD' },
    { value: 'workshop_hod', label: 'Workshop HOD' },
    { value: 'registrar', label: 'Registrar' },
    { value: 'director', label: 'Director' },
    { value: 'faculty', label: 'Faculty' },
    { value: 'assistant', label: 'Assistant' },
    { value: 'worker', label: 'Worker' },
    { value: 'canteen_owner', label: 'Canteen Owner' },
  ];

  const user = {
    email: authUser.email || 'admin@org.com',
    role: authUser.role || 'org_admin',
    organization: orgId || authUser.organizationId,
    orgName: authUser.orgName || 'Organization',
  };

  useEffect(() => {
    if (orgId) {
      loadUsers();
      loadDepartments();
    }
  }, [orgId]);

  useEffect(() => {
    // Always filter when users change, but don't clear if we're loading
    filterUsers();
  }, [users, searchTerm, roleFilter, departmentFilter]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await UserApi.list(orgId!);
      const usersData = Array.isArray(response.data) ? response.data : [];
      setUsers(usersData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      const status = error?.response?.status;
      if (status !== 401) {
        toast({
          title: 'Error',
          description: getApiErrorMessage(error, 'Failed to load users'),
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadDepartments = async () => {
    if (!orgId) return;
    try {
      const res = await RequisitionApi.listDepartments(orgId);
      const apiDepartments = (res.data || []).filter((d: string) => !!d);
      const merged = Array.from(new Set([...DEFAULT_DEPARTMENTS, ...apiDepartments])).sort();
      setDepartments(merged);
    } catch {
      setDepartments(DEFAULT_DEPARTMENTS);
    }
  };

  const filterUsers = () => {
    // Don't filter if users array is empty and we're still loading
    if (users.length === 0 && isLoading) {
      setFilteredUsers([]);
      return;
    }

    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }

    console.log('Filtering users:', { total: users.length, filtered: filtered.length, searchTerm, roleFilter, departmentFilter, isLoading });
    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    // Validation
    if (!userFormData.name || !userFormData.email || !userFormData.role) {
      toast({
        title: 'Error',
        description: 'Name, email, and role are required',
        variant: 'destructive',
      });
      return;
    }

    // Password required only for new users
    if (!editingUser && !userFormData.password) {
      toast({
        title: 'Error',
        description: 'Password is required for new users',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      if (editingUser) {
        const updatePayload: {
          name: string;
          email: string;
          role: string;
          department?: string;
          phone?: string;
          password?: string;
        } = {
          name: userFormData.name,
          email: userFormData.email,
          role: userFormData.role,
          department: userFormData.department || undefined,
          phone: userFormData.phone || undefined,
        };
        const trimmedPassword = userFormData.password.trim();
        if (trimmedPassword) {
          updatePayload.password = trimmedPassword;
        }
        await UserApi.update(orgId!, editingUser._id, updatePayload);
        toast({ title: 'Success', description: 'User updated successfully' });
      } else {
        await UserApi.create(orgId!, userFormData);
        toast({ title: 'Success', description: 'User created successfully' });
      }

      setIsUserDialogOpen(false);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      const status = error?.response?.status;
      toast({
        title: status === 401 ? 'Please sign in' : 'Error',
        description:
          status === 401
            ? 'Your session is missing or expired. Sign in as organization admin, then try again.'
            : getApiErrorMessage(error, 'Failed to save user'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditUser = (userToEdit: User) => {
    console.log('Editing user:', userToEdit);
    // Clear search term before opening edit dialog to prevent filtering issues
    setSearchTerm('');
    setEditingUser(userToEdit);
    setUserFormData({
      name: userToEdit.name,
      email: userToEdit.email,
      password: '', // Don't pre-fill password
      role: userToEdit.role,
      department: userToEdit.department || '',
      phone: userToEdit.phone || '',
    });
    // Don't reload users when editing - just open the dialog
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await UserApi.delete(orgId!, userId);
      toast({ title: 'Success', description: 'User deleted successfully' });
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to delete user'),
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'faculty',
      department: '',
      phone: '',
    });
    setEditingUser(null);
  };

  const handleDialogClose = () => {
    setIsUserDialogOpen(false);
    resetForm();
  };

  const handleAddUserClick = () => {
    // Clear search term when adding new user to prevent filtering issues
    setSearchTerm('');
    resetForm();
    setIsUserDialogOpen(true);
  };

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Users</h1>
            <p className="text-muted-foreground">Create and manage users for your organization</p>
          </div>
          <Button onClick={handleAddUserClick}>
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
          <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
            setIsUserDialogOpen(open);
            if (!open) {
              resetForm();
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
              </DialogHeader>
              <form autoComplete="off" data-form-type="other">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    id="user-name-input"
                    name="user-name"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    placeholder="Full name"
                    autoComplete="name"
                    data-form-type="other"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    id="user-email-input"
                    name="user-email"
                    value={userFormData.email}
                    onChange={(e) => {
                      e.stopPropagation();
                      setUserFormData({ ...userFormData, email: e.target.value });
                    }}
                    placeholder="user@org.com"
                    disabled={!!editingUser}
                    autoComplete="email"
                    data-form-type="other"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password {editingUser ? '(leave empty to keep current)' : '*'}</Label>
                  <Input
                    type="password"
                    id="user-password-input"
                    name="user-password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    placeholder={editingUser ? 'Leave empty to keep current' : 'Password'}
                    autoComplete="off"
                    readOnly={!!editingUser}
                    onFocus={(e) => {
                      if (editingUser) e.target.removeAttribute('readonly');
                    }}
                    data-form-type="other"
                    data-lpignore="true"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select value={userFormData.role} onValueChange={(value) => setUserFormData({ ...userFormData, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Select
                      value={userFormData.department}
                      onValueChange={(value) => setUserFormData({ ...userFormData, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    id="user-phone-input"
                    name="user-phone"
                    type="tel"
                    value={userFormData.phone}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    placeholder="+91 1234567890"
                    autoComplete="tel"
                    data-form-type="other"
                  />
                </div>
              </div>
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={handleDialogClose}>Cancel</Button>
                <Button type="button" onClick={handleCreateUser} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  {/* Hidden dummy fields to prevent browser autofill */}
                  <input type="text" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} autoComplete="off" />
                  <input type="password" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} tabIndex={-1} autoComplete="off" />
                  <Input
                    id="user-search-input"
                    name="user-search"
                    type="search"
                    placeholder="Search by name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSearchTerm(e.target.value);
                    }}
                    className="pl-10"
                    autoComplete="off"
                    data-form-type="other"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    readOnly={false}
                    onFocus={(e) => {
                      // Prevent autofill on focus
                      e.target.removeAttribute('readonly');
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Filter by Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Filter by Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {users.length === 0 ? 'No users found. Create your first user!' : 'No users match the current filters.'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="capitalize text-xs">
                              {user.role.replace('_', ' ')}
                            </Badge>
                            {user.department && (
                              <span className="text-xs text-muted-foreground">{user.department}</span>
                            )}
                            {user.phone && (
                              <span className="text-xs text-muted-foreground">• {user.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;

