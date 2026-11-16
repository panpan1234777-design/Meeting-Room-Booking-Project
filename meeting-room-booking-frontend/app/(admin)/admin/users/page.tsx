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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">User Management</h1>
          <p className="mt-1 text-sm text-slate-400">Manage and track your platform users.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-500"
        >
          + Add New User
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/65 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Users</p>
          <p className="text-3xl font-extrabold mt-2 text-indigo-400">{totalUsers}</p>
        </div>
        <div className="bg-slate-900/65 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Administrators</p>
          <p className="text-3xl font-extrabold mt-2 text-rose-400">{adminCount}</p>
        </div>
        <div className="bg-slate-900/65 border border-slate-800 p-5 rounded-2xl shadow-xl">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Regular Users</p>
          <p className="text-3xl font-extrabold mt-2 text-emerald-400">{userCount}</p>
        </div>
      </div>

      <div className="bg-slate-900/65 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading users data...</div>
        ) : error ? (
          <div className="p-8 text-center text-rose-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Roles</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-semibold text-white">{user.name}</td>
                    <td className="p-4 text-slate-400">{user.email}</td>
                    <td className="p-4 text-slate-400">{user.phone || "-"}</td>
                    <td className="p-4">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mr-1 uppercase tracking-wider border ${
                            role.name === "admin"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {role.name}
                        </span>
                      ))}
                    </td>
                    <td className="p-4 text-right space-x-3">
                      <button
                        onClick={() => openModal(user)}
                        className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-rose-400 hover:text-rose-300 font-semibold transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar">
            <h2 className="text-xl font-bold text-white">
              {isEditing ? "Modify User Account" : "Register New User"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Name</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

             {(!isEditing || isEditing) && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              {isEditing ? "New Password (Optional)" : "Password"}
            </label>
            
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!isEditing}
                value={formData.password || ""}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 pr-10 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder={isEditing ? "new password" : "Enter password"}
              />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-400 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            
            {isEditing && (
              <p className="text-[11px] text-slate-500 mt-1">
                * Can skip this field if you don't want to change the password
              </p>
            )}
          </div>
        )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Assign Role</label>
                <select
                  value={formData.role_name}
                  onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button" onClick={closeModal}
                  className="rounded-xl border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
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