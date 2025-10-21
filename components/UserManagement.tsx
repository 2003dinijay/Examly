"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../util/AuthContext";

interface AppUser {
    uid: string;
    email: string;
    creationTime: string;
    lastSignInTime: string;
    disabled: boolean;
}

const UserManagement = () => {
    const { user: adminUser } = useAuth();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/users', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.statusText}`);
            }

            const data = await response.json();
            
            const filteredUsers = data.users.filter((u: AppUser) => u.uid !== adminUser?.uid);
            setUsers(filteredUsers);

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'An error occurred while fetching users');
        } finally {
            setLoading(false);
        }
    }, [adminUser]);

    useEffect(() => {
        fetchUsers();
    }, [adminUser, fetchUsers]);

    const handleDeleteUser = useCallback(async (uid: string, email: string) => {
        if (!window.confirm(`Are you sure you want to delete user ${email}? This action is permanent and will delete their account and all quiz answers.`)) {
            return;
        }

        try {
            const response = await fetch('/api/admin/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Deletion failed with status: ${response.status}`);
            }

            alert(`User ${email} deleted successfully.`);
            fetchUsers();

        } catch (err) {
            console.error(err);
            setError(`Deletion Error: ${err instanceof Error ? err.message : 'An error occurred while deleting user'}`);
        }
    }, [fetchUsers]);

    if (loading) {
        return (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg">
                <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-blue-600 font-medium">Loading users...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white text-xl">
                        ⚠
                    </div>
                    <h3 className="text-xl font-bold text-red-900">Error</h3>
                </div>
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-blue-900">Registered Users</h3>
                        <p className="text-sm text-blue-600">{users.length} {users.length === 1 ? 'user' : 'users'} registered</p>
                    </div>
                </div>
                
                <button 
                    onClick={fetchUsers}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            <div className="bg-white rounded-xl overflow-hidden shadow-md">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-gradient-to-r from-blue-500 to-indigo-500">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    User Information
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                    Registration Date
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {users.map((user, index) => (
                                <tr key={user.uid} className="hover:bg-blue-50 transition-colors duration-200">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{user.email}</div>
                                                <div className="text-xs text-slate-500 font-mono truncate max-w-xs" title={user.uid}>
                                                    {user.uid}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-700 font-medium">
                                            {new Date(user.creationTime).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {new Date(user.creationTime).toLocaleTimeString('en-US', { 
                                                hour: '2-digit', 
                                                minute: '2-digit' 
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => handleDeleteUser(user.uid, user.email)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                                            disabled={user.disabled}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {users.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <p className="text-slate-500 font-medium">No users registered yet</p>
                        <p className="text-slate-400 text-sm mt-1">Users will appear here once they register</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;