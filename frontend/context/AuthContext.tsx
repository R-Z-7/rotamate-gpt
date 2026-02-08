"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    login: (token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
            fetchUser();
        } else {
            setIsAuthenticated(false);
            setIsLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data);
        } catch (error) {
            console.error("Failed to fetch user", error);
            localStorage.removeItem('token');
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        // Fetch user to know where to redirect
        try {
            const res = await api.get('/users/me');
            const userData = res.data;
            setUser(userData);

            if (userData.role === 'superadmin') {
                router.push('/superadmin/dashboard');
            } else if (userData.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/employee/schedule');
            }
        } catch (e) {
            console.error(e);
            router.push('/login'); // Fallback to login on error
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
