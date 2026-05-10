'use client';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { admin } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Plus, Users, Building2, ShieldCheck, Activity, Check, X, RefreshCw } from 'lucide-react';

const planColors: Record<string, any> = {
  starter:    { bg:'#f3f4f6', color:'#374151' },
  growth:     { bg:'#dbeafe', color:'#1e40af' },
  enterprise: { bg:'#ede9fe', color:'#5b21b6' },
};
const statusColors: Record<string, any> = {
  active:    { bg:'#d1fae5', color:'#065f46' },
  trial:     { bg:'#fef3c7', color:'#92400e' },
  suspended: { bg:'#fef2f2', color:'#991b1b' },
  cancelled: { bg:'#f3f4f6', color:'#6b7280' },
};

export default function AdminPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'tenants'|'users'|'stats'|'audit'>('tenants');
  const [tenants, setTenants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [audit, setAudit] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name:'', niche:'restaurant', plan_name:'starter', owner_email:'' });
  const [actionId, setActionId] = useState<string|null>(null);

  useEffect(() => {
    if (!isSuperAdmin) { router.replace('/dashboard'); return; }
    loadAll();
  }, [isSuperAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [t, u, s, a] = await Promise.all([admin.tenants(), admin.users(), admin.stats(), admin.audit()]);
      setTenants(t); setUsers(u); setStats(s); setAudit(a);
    } finally { setLoading(false); }
  };

  const createTenant = async () => {
    setCreating(true);
    try {
      await admin.createTenant(form);
      setShowCreate(false);
      setForm({ name:'', niche:'restaurant', plan_name:'starter', owner_email:'' });
      await loadAll();
    } catch(e:any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const suspend = async (id: string) => {
    setActionId(id);
    await admin.suspendTenant(id);
    setTenants(prev => prev.map(t => t.id===id ? {...t, status:'suspended'} : t));
    setActionId(null);
  };

  const activate = async (id: string) => {
    setActionId(id);
    await admin.activateTenant(id);
    setTenants(prev => prev.map(t => t.id===id ? {...t, status:'active'} : t));
    setActionId(null);
  };

  const changePlan = async (id: string, plan: string) => {
    await admin.updateTenant(id, { plan_name: plan });
    setTenants(prev => prev.map(t => t.id===id ? {...t, plans:{...t.plans, name:plan}} : t));
  };

  return (
    <AppLayout>
      <div style={{ padding:'24px 28px' }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <ShieldCheck size={18} color="#d97706"/>
              <span style={{ fontSize:12, fontWeight:600, color:'#d97706', textTransform:'uppercase', letterSpacing:'0.06em' }}>Super Admin</span>
            </div>
            <h1 style={{ fontSize:24, fontWeight:700, color:'#111827', letterSpacing:'-0.5px' }}>Admin Panel</h1>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={loadAll} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', fontSize:13, fontWeight:500, border:'1px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fff', cursor:'pointer', color:'#4f46e5' }}>
              <RefreshCw size={13}/> Refresh
            </button>
            <button onClick={() => setShowCreate(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', fontSize:13, fontWeight:600, background:'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:9, cursor:'pointer' }}>
              <Plus size={14}/> New Client
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            {[
              { label:'Total Clients', value: stats.tenants?.total||0, icon:Building2, color:'#4f46e5', bg:'#eff6ff' },
              { label:'Active Clients', value: stats.tenants?.active||0, icon:Check, color:'#10b981', bg:'#ecfdf5' },
              { label:'Total Messages', value: (stats.messages?.total||0).toLocaleString(), icon:Activity, color:'#d97706', bg:'#fffbeb' },
              { label:'Total Users', value: users.length, icon:Users, color:'#7c3aed', bg:'#f5f3ff' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'16px 18px', border:'1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                    <div style={{ width:34, height:34, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon size={16} color={s.color}/>
                    </div>
                  </div>
                  <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color:'#9ca3af', marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:26, fontWeight:700, color:'#111827', letterSpacing:'-0.5px' }}>{s.value}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:2, borderBottom:'1px solid rgba(99,102,241,0.12)', marginBottom:20 }}>
          {(['tenants','users','audit'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'9px 18px', fontSize:13, fontWeight:tab===t?600:400, color:tab===t?'#2563eb':'#6b7280', background:'none', border:'none', borderBottom:tab===t?'2px solid #2563eb':'2px solid transparent', marginBottom:-1, cursor:'pointer', textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading…</div>
        ) : (
          <>
            {/* Tenants table */}
            {tab === 'tenants' && (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid rgba(99,102,241,0.1)', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Client','Niche','Plan','Status','Created','Actions'].map(h => (
                        <th key={h} style={{ textAlign:'left', fontSize:10.5, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'#9ca3af', padding:'12px 16px', borderBottom:'1px solid rgba(99,102,241,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(t => (
                      <tr key={t.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#f8f9ff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                        <td style={{ padding:'13px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <div style={{ fontSize:13.5, fontWeight:600, color:'#111827' }}>{t.name}</div>
                          <div style={{ fontSize:11.5, color:'#9ca3af' }}>{t.slug}</div>
                        </td>
                        <td style={{ padding:'13px 16px', fontSize:13, color:'#6b7280', borderBottom:'1px solid rgba(99,102,241,0.06)', textTransform:'capitalize' }}>{t.niche}</td>
                        <td style={{ padding:'13px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <select value={t.plans?.name||'starter'} onChange={e => changePlan(t.id, e.target.value)}
                            style={{ padding:'4px 8px', fontSize:12, borderRadius:6, border:'1px solid rgba(99,102,241,0.2)', background:'#fff', cursor:'pointer', fontFamily:'inherit' }}>
                            {['starter','growth','enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </td>
                        <td style={{ padding:'13px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <span style={{ fontSize:11.5, fontWeight:500, padding:'3px 9px', borderRadius:10, ...(statusColors[t.status]||{bg:'#f3f4f6',color:'#374151'}) }}>{t.status}</span>
                        </td>
                        <td style={{ padding:'13px 16px', fontSize:12.5, color:'#6b7280', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          {new Date(t.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding:'13px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <div style={{ display:'flex', gap:6 }}>
                            {t.status !== 'active' ? (
                              <button onClick={() => activate(t.id)} disabled={actionId===t.id} style={{ padding:'5px 10px', fontSize:11.5, fontWeight:500, borderRadius:6, background:'#d1fae5', color:'#065f46', border:'none', cursor:'pointer' }}>Activate</button>
                            ) : (
                              <button onClick={() => suspend(t.id)} disabled={actionId===t.id} style={{ padding:'5px 10px', fontSize:11.5, fontWeight:500, borderRadius:6, background:'#fef2f2', color:'#dc2626', border:'none', cursor:'pointer' }}>Suspend</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {tenants.length === 0 && <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'#9ca3af', fontSize:13 }}>No clients yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {/* Users table */}
            {tab === 'users' && (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid rgba(99,102,241,0.1)', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['User','Role','Tenant','Last Seen','Status'].map(h => (
                        <th key={h} style={{ textAlign:'left', fontSize:10.5, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'#9ca3af', padding:'12px 16px', borderBottom:'1px solid rgba(99,102,241,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#f8f9ff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                        <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <div style={{ fontSize:13.5, fontWeight:500, color:'#111827' }}>{u.full_name||'—'}</div>
                          <div style={{ fontSize:11.5, color:'#9ca3af' }}>{u.email}</div>
                        </td>
                        <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <span style={{ fontSize:11.5, fontWeight:500, padding:'3px 8px', borderRadius:8, background: u.role==='superadmin'?'#fef3c7':u.role==='owner'?'#dbeafe':'#f3f4f6', color: u.role==='superadmin'?'#92400e':u.role==='owner'?'#1e40af':'#374151' }}>{u.role}</span>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:12.5, color:'#6b7280', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>{u.tenants?.name||'—'}</td>
                        <td style={{ padding:'12px 16px', fontSize:12.5, color:'#6b7280', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>{u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : 'Never'}</td>
                        <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <span style={{ fontSize:11.5, fontWeight:500, padding:'3px 8px', borderRadius:8, background: u.is_active?'#d1fae5':'#f3f4f6', color: u.is_active?'#065f46':'#6b7280' }}>{u.is_active?'Active':'Inactive'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Audit log */}
            {tab === 'audit' && (
              <div style={{ background:'#fff', borderRadius:14, border:'1px solid rgba(99,102,241,0.1)', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr>
                      {['Action','Performed By','Details','Time'].map(h => (
                        <th key={h} style={{ textAlign:'left', fontSize:10.5, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color:'#9ca3af', padding:'12px 16px', borderBottom:'1px solid rgba(99,102,241,0.08)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map(a => (
                      <tr key={a.id} onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#f8f9ff'} onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
                        <td style={{ padding:'12px 16px', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>
                          <span style={{ fontSize:12, fontWeight:500, padding:'3px 8px', borderRadius:6, background:'#f0f4ff', color:'#4f46e5' }}>{a.action}</span>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:13, color:'#111827', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>{a.users?.email||'System'}</td>
                        <td style={{ padding:'12px 16px', fontSize:12, color:'#6b7280', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>{JSON.stringify(a.details).slice(0,60)}</td>
                        <td style={{ padding:'12px 16px', fontSize:12, color:'#9ca3af', borderBottom:'1px solid rgba(99,102,241,0.06)' }}>{new Date(a.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {audit.length===0 && <tr><td colSpan={4} style={{ textAlign:'center', padding:40, color:'#9ca3af', fontSize:13 }}>No audit logs yet</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create tenant modal */}
      {showCreate && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowCreate(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:'28px 32px', width:440, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:20 }}>Create New Client</h3>
            {[
              { label:'Business Name *', key:'name', placeholder:'e.g. Spice Garden Restaurant' },
              { label:'Owner Email', key:'owner_email', placeholder:'owner@business.com' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))} placeholder={f.placeholder}
                  style={{ width:'100%', padding:'10px 12px', fontSize:13.5, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', color:'#111' }} />
              </div>
            ))}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Niche</label>
                <select value={form.niche} onChange={e => setForm(p=>({...p,niche:e.target.value}))} style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', cursor:'pointer' }}>
                  {['restaurant','realestate','dental','ecommerce','salon','clinic'].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Plan</label>
                <select value={form.plan_name} onChange={e => setForm(p=>({...p,plan_name:e.target.value}))} style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', cursor:'pointer' }}>
                  {['starter','growth','enterprise'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setShowCreate(false)} style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, border:'1px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fff', color:'#6b7280', cursor:'pointer' }}>Cancel</button>
              <button onClick={createTenant} disabled={creating||!form.name} style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, background: creating||!form.name?'#a5b4fc':'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:9, cursor: creating?'wait':'pointer' }}>
                {creating ? 'Creating…' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
