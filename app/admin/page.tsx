"use client";
import { useState, useEffect } from "react";
import { 
    onAuthStateChanged, 
    User, 
    signInWithEmailAndPassword, 
    signOut,
    createUserWithEmailAndPassword, 
} from "firebase/auth"; 
import { auth } from "../../util/firebaseConfig"; 

import AddQuiz from "../../components/AddQuiz";
import AdminActionPanel from "../../components/AdminActionPanel";
import AdminControl from "../../components/AdminControl";
import UserManagement from "../../components/UserManagement"; 

const ADMIN_EMAIL = "admin@edly.com"; 

const RegisterUserForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registerStatus, setRegisterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setRegisterStatus('loading');
        setErrorMessage(null);

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            setRegisterStatus('error');
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setRegisterStatus('success');
            setEmail('');
            setPassword('');
        } catch (error: any) {
            console.error("Registration error:", error);
            if (error.code === 'auth/email-already-in-use') {
                setErrorMessage('The email address is already in use by another account.');
            } else if (error.code === 'auth/invalid-email') {
                setErrorMessage('The email address is not valid.');
            } else {
                setErrorMessage('Registration failed: ' + error.message);
            }
            setRegisterStatus('error');
        }
    };

    return (
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white text-xl font-bold">
                    +
                </div>
                <h3 className="text-xl font-bold text-emerald-900">Register New User</h3>
            </div>
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                    <input
                        type="email"
                        placeholder="New User Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border-2 border-emerald-200 p-3 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                        required
                        disabled={registerStatus === 'loading'}
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border-2 border-emerald-200 p-3 rounded-xl text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none"
                        required
                        disabled={registerStatus === 'loading'}
                    />
                </div>
                <button
                    type="submit"
                    className={`px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                        registerStatus === 'loading' 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg'
                    }`}
                    disabled={registerStatus === 'loading' || !email || !password}
                >
                    {registerStatus === 'loading' ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating...
                        </span>
                    ) : 'Register User'}
                </button>
            </form>
            
            {registerStatus === 'success' && (
                <div className="mt-4 p-3 bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-2">
                    <span className="text-emerald-600 text-xl">✓</span>
                    <p className="text-emerald-700 font-medium text-sm">User created successfully! Refresh the list to see them.</p>
                </div>
            )}
            {errorMessage && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-xl flex items-center gap-2">
                    <span className="text-red-600 text-xl">⚠</span>
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                </div>
            )}
        </div>
    );
};


export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsAdmin(currentUser.email === ADMIN_EMAIL);
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(null);
        setIsLoggingIn(true);
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            if (userCredential.user.email === ADMIN_EMAIL) {
                setIsAdmin(true);
            } else {
                alert("Login successful, but this account is not authorized for Admin access. Logging out.");
                await signOut(auth);
            }
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                setLoginError('Invalid email or password.');
            } else {
                setLoginError('An unknown error occurred during login.');
            }
        } finally {
            setIsLoggingIn(false);
        }
    };
    
    const handleLogout = async () => {
        await signOut(auth);
        alert("Logged out successfully.");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-xl text-slate-600 font-medium">Loading authentication...</p>
                </div>
            </div>
        );
    }
    
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iLjA1IiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-20"></div>
                
                <div className="relative backdrop-blur-xl bg-white/10 p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20">
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-white mb-2 text-center mt-8">
                        Admin Portal
                    </h1>
                    <p className="text-blue-200 text-center mb-8 text-sm">Secure access for administrators only</p>
                    
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">Email Address</label>
                            <input 
                                type="email"
                                placeholder="admin@edly.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoggingIn}
                                className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 p-3 rounded-xl text-white placeholder-blue-200/50 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 transition-all outline-none"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">Password</label>
                            <input 
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoggingIn}
                                className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 p-3 rounded-xl text-white placeholder-blue-200/50 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-400 transition-all outline-none"
                            />
                        </div>
                        
                        {loginError && (
                            <div className="p-3 bg-red-500/20 border border-red-400/50 rounded-xl">
                                <p className="text-red-200 text-sm text-center">{loginError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn || !email || !password}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {isLoggingIn ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Authenticating...
                                </span>
                            ) : "Sign In"}
                        </button>
                    </form>
                    
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-xs text-center text-blue-200/70">
                            🔒 Protected by enterprise-grade security
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    Admin Dashboard
                                </h1>
                                <p className="text-sm text-slate-500">Manage your quiz platform</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Logged in as</p>
                                <p className="text-sm font-semibold text-slate-700">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Management Section */}
                <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    <RegisterUserForm />
                    <UserManagement /> 
                </div>

                {/* Admin Controls */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <AdminControl/>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <AddQuiz/>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                        <AdminActionPanel/>
                    </div>
                </div>
            </div>
        </div>
    );
}