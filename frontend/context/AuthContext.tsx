'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, getToken, setToken, clearToken } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string; email: string; full_name: string; role: string;
  tenant_id: string; tenants: any; avatar_url?: string;
}
interface AuthCtx {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean; isSuperAdmin: boolean;
}
const Ctx = createContext<AuthCtx | null>(null);

const PUBLIC = ['/login'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      if (!PUBLIC.includes(pathname)) router.replace('/login');
      return;
    }
    auth.me().then(u => {
      setUser(u);
      setLoading(false);
      if (PUBLIC.includes(pathname)) router.replace('/dashboard');
    }).catch(() => {
      clearToken(); setLoading(false);
      router.replace('/login');
    });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await auth.login(email, password);
    setToken(data.access_token, data.refresh_token);
    setUser(data.user);
    localStorage.setItem('autoflow_user', JSON.stringify(data.user));
    if (data.user.role === 'superadmin') router.push('/admin');
    else router.push('/dashboard');
  };

  const logout = () => {
    clearToken();
    setUser(null);
    router.replace('/login');
  };

  return (
    <Ctx.Provider value={{
      user, loading, login, logout,
      isAdmin: user?.role === 'superadmin' || user?.role === 'owner',
      isSuperAdmin: user?.role === 'superadmin',
    }}>
      {loading ? (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f3ff', flexDirection:'column', gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#4f46e5,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontWeight:700, color:'#fff' }}>A</div>
          <div style={{ width:28, height:28, border:'3px solid #e0e7ff', borderTop:'3px solid #4f46e5', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : children}
    </Ctx.Provider>
  );
}
export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth outside AuthProvider');
  return c;
}
