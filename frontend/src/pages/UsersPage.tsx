import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { userAPI, roleAPI } from "@/lib/api";
import type { User, Role } from "@/types";
import { toast } from "react-toastify";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);

  // Add user form
  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role_id: 0,
  });

  // Edit user
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role_id: 0,
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userAPI.getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await roleAPI.getRoles();
      setRoles(res.data);
      if (res.data.length > 0) {
        setAddForm(prev => ({ ...prev, role_id: res.data[0].id }));
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userAPI.createUser(addForm);
      setAddForm({
        username: "", email: "", full_name: "", password: "", role_id: roles[0]?.id || 0 });
      setShowAddUser(false);
      fetchUsers();
      toast.success("User created successfully!");
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      full_name: user.full_name || "",
      password: "",
      role_id: user.role_id,
    });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    try {
      // Only send password if it's not empty
      const data = { ...editForm };
      if (!data.password) {
        delete (data as any).password;
      }
      await userAPI.updateUser(editingUser.id, data);
      setEditingUser(null);
      fetchUsers();
      toast.success("User updated successfully!");
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userAPI.deleteUser(id);
        fetchUsers();
        toast.success("User deleted successfully!");
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <Button onClick={() => setShowAddUser(!showAddUser)}>
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
        <p className="text-gray-600">Manage system users and their roles.</p>
      </div>

      {/* Add User Form */}
      {showAddUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="addUsername">Username</Label>
                <Input
                  id="addUsername"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="addEmail">Email</Label>
                <Input
                  id="addEmail"
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="addFullName">Full Name</Label>
                <Input
                  id="addFullName"
                  value={addForm.full_name}
                  onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="addPassword">Password</Label>
                <Input
                  id="addPassword"
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="addRole">Role</Label>
                <Select
                  value={addForm.role_id.toString()}
                  onValueChange={(val) => setAddForm({ ...addForm, role_id: parseInt(val)})}
                >
                  <SelectTrigger id="addRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create User"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddUser(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit User Form */}
      {editingUser && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Edit User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editUsername">Username</Label>
                <Input
                  id="editUsername"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editPassword">Password (leave blank to keep current)</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="editRole">Role</Label>
                <Select
                  value={editForm.role_id.toString()}
                  onValueChange={(val) => setEditForm({ ...editForm, role_id: parseInt(val)})}
                >
                  <SelectTrigger id="editRole">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Updating..." : "Update User"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Full Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {user.username}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {user.full_name || "-"}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {user.role.name}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
