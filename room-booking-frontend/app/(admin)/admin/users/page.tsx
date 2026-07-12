"use client";

import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

interface Role {
  id: number;
  name: string; 
}

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  roles: Role[]; 
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "", 
    role_name: "user", 
  });

  const API_BASE_URL = "http://localhost:8000/api"; 

 const fetchUsers = async () => {
  setIsLoading(true);
  try {
    const token = localStorage.getItem("token"); 
    
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Failed to fetch users");
    const result = await res.json();
    
    if (Array.isArray(result)) {
      setUsers(result);
    } else if (result && Array.isArray(result.data)) {
      setUsers(result.data);
    } else {
      setUsers([]);
    }
  } catch (err: any) {
    setError(err.message || "Something went wrong");
  } finally {
    setIsLoading(false);
  }
};

  useEffect(() => {
    fetchUsers();
  }, []);

  // Calculate Users & Roles 
 const isUserArray = Array.isArray(users);
const totalUsers = isUserArray ? users.length : 0;

const adminCount = isUserArray 
  ? users.filter((u) => u.roles && Array.isArray(u.roles) && u.roles.some((r) => r.name === "admin")).length 
  : 0;

const userCount = isUserArray 
  ? users.filter((u) => u.roles && Array.isArray(u.roles) && u.roles.some((r) => r.name === "user")).length 
  : 0;
  
  // Create or update submit 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      let url = `${API_BASE_URL}/users`;
      let method = "POST";
      let bodyData:any = { ...formData };
      
      if (isEditing && selectedUserId) {
      url = `${API_BASE_URL}/users/${selectedUserId}`;
      method = "POST"; 
      bodyData = {
        ...bodyData,
        _method: "PUT" as any
      };
    }
    
    const res = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(bodyData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.log("Laravel Errors:", errorData);

      if (errorData.errors) {
        const errorMessages = Object.entries(errorData.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join("\n");
        throw new Error(errorMessages);
      }
      
      throw new Error(errorData.message || "Operation failed");
    }

    fetchUsers();
    closeModal();
  } catch (err: any) {
    alert(err.message); 
  }
};

  //Delete User
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to delete user");
      
      // List Update
      setUsers(users.filter((user) => user.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setIsEditing(true);
      setSelectedUserId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        password: "", 
        role_name: user.roles[0]?.name || "user",
      });
    } else {
      setIsEditing(false);
      setSelectedUserId(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role_name: "user",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm text-gray-400">Manage and track your platform users.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg transition"
        >
          + Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1e1b4b]/40 border border-purple-900/40 p-5 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Users</p>
          <p className="text-3xl font-bold mt-1 text-purple-400">{totalUsers}</p>
        </div>
        <div className="bg-[#1e1b4b]/40 border border-purple-900/40 p-5 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Administrators</p>
          <p className="text-3xl font-bold mt-1 text-pink-400">{adminCount}</p>
        </div>
        <div className="bg-[#1e1b4b]/40 border border-purple-900/40 p-5 rounded-xl">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Regular Users</p>
          <p className="text-3xl font-bold mt-1 text-emerald-400">{userCount}</p>
        </div>
      </div>

      <div className="bg-[#111026] border border-purple-950 rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading users data...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-purple-950 bg-[#171533] text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Roles</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/40 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#1c1a3f]/40 transition">
                    <td className="p-4 font-medium text-gray-200">{user.name}</td>
                    <td className="p-4 text-gray-400">{user.email}</td>
                    <td className="p-4 text-gray-400">{user.phone || "-"}</td>
                    <td className="p-4">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-1 uppercase tracking-wide ${
                            role.name === "admin"
                              ? "bg-pink-500/10 text-pink-400 border border-pink-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          }`}
                        >
                          {role.name}
                        </span>
                      ))}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button
                        onClick={() => openModal(user)}
                        className="text-purple-400 hover:text-purple-300 font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-pink-400 hover:text-pink-300 font-medium transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#171533] border border-purple-900 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-100">
              {isEditing ? "Modify User Account" : "Register New User"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Name</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-[#111026] border border-purple-900 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 bg-[#111026] border border-purple-900 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-[#111026] border border-purple-900 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

             {(!isEditing || isEditing) && (
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
              {isEditing ? "New Password (Optional)" : "Password"}
            </label>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!isEditing}
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 pr-10 bg-[#111026] border border-purple-900 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder={isEditing ? "new password" : "Enter password"}
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-purple-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {isEditing && (
              <p className="text-[11px] text-gray-500 mt-1">
                * Can skip this field if you don't want to change the password
              </p>
            )}
          </div>
        )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Assign Role</label>
                <select
                  value={formData.role_name}
                  onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                  className="w-full p-2.5 bg-[#111026] border border-purple-900 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button" onClick={closeModal}
                  className="px-4 py-2 bg-purple-950/40 border border-purple-900 rounded-lg text-gray-300 hover:bg-purple-900/30 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  {isEditing ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}