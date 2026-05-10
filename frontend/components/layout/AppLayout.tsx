'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, MessageSquare, Users, Bot, Plug, Settings, ShieldCheck, LogOut, Star, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

const nav = [
  { href:'/dashboard', icon:LayoutDashboard, label:'Overview' },
  { href:'/conversations', icon:MessageSquare, label:'Conversations' },
  { href:'/contacts', icon:Users, label:'Contacts' },
  { href:'/agents', icon:Bot, label:'AI Agents' },
  { href:'/integrations', icon:Plug, label:'Integrations' },
  { href:'/settings', icon:Settings, label:'Settings' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin } = useAuth();
  const [banner, setBanner] = useState(true);

  const tenant = user?.tenants;
  const initials = (user?.full_name || user?.email || 'U').slice(0, 2).toUpperCase();
  const planName = tenant?.plans?.display_name || 'Trial';

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
      {/* Trial banner */}
      {banner && (
        <div style={{ background:'linear-gradient(90deg,#1e40af,#4f46e5,#7c3aed)', color:'#fff', height:38, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', fontSize:13, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Star size={13} fill="#fbbf24" color="#fbbf24" />
            <span>Your <strong>{planName}</strong> plan is active. Upgrade anytime for more features.</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {isSuperAdmin && <Link href="/admin" style={{ fontSize:12, color:'rgba(255,255,255,0.8)', textDecoration:'none', fontWeight:500 }}>Admin Panel →</Link>}
            <Link href="/settings" style={{ textDecoration:'none' }}>
              <button style={{ background:'#2563eb', color:'#fff', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:20, padding:'4px 14px', fontSize:12, fontWeight:600, cursor:'pointer' }}>Upgrade</button>
            </Link>
            <button onClick={() => setBanner(false)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', opacity:0.6 }}>
              <X size={14} color="#fff" />
            </button>
          </div>
        </div>
      )}

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{ width:64, background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', borderRight:'1px solid rgba(99,102,241,0.1)', position:'sticky', top:0, height:banner ? 'calc(100vh - 38px)' : '100vh', flexShrink:0 }}>
          {/* Logo */}
          <div style={{ width:64, height:60, display:'flex', alignItems:'center', justifyContent:'center', borderBottom:'1px solid rgba(99,102,241,0.08)' }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#4f46e5,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'#fff' }}>A</div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, padding:'12px 0' }}>
            {nav.map(({ href, icon:Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href);
              return (
                <Link key={href} href={href} title={label} style={{ textDecoration:'none' }}>
                  <div style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: active ? '#eff6ff' : 'transparent', color: active ? '#2563eb' : '#9ca3af', transition:'all 0.13s', cursor:'pointer' }}
                    onMouseEnter={e => { if(!active){(e.currentTarget as HTMLElement).style.background='#f5f3ff';(e.currentTarget as HTMLElement).style.color='#4f46e5';}}}
                    onMouseLeave={e => { if(!active){(e.currentTarget as HTMLElement).style.background='transparent';(e.currentTarget as HTMLElement).style.color='#9ca3af';}}}>
                    <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                  </div>
                </Link>
              );
            })}
            {isSuperAdmin && (
              <Link href="/admin" title="Admin" style={{ textDecoration:'none' }}>
                <div style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background: pathname.startsWith('/admin') ? '#fef3c7' : 'transparent', color: pathname.startsWith('/admin') ? '#d97706' : '#9ca3af', transition:'all 0.13s' }}>
                  <ShieldCheck size={18} />
                </div>
              </Link>
            )}
          </nav>

          {/* User + logout */}
          <div style={{ padding:'10px 0', borderTop:'1px solid rgba(99,102,241,0.08)', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div title={user?.email} style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#10b981)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', cursor:'pointer' }}>
              {initials}
            </div>
            <button onClick={logout} title="Logout" style={{ width:32, height:32, borderRadius:8, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#9ca3af' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='#ef4444'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='#9ca3af'}>
              <LogOut size={14} />
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex:1, background:'#f0f3ff', overflowY:'auto', minHeight: banner ? 'calc(100vh - 38px)' : '100vh' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
