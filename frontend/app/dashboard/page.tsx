'use client';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { dashboard } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Users, CheckCircle, Layers, RefreshCw, Clock, Smile } from 'lucide-react';
import Link from 'next/link';

const COLORS = ['var(--primary)', '#10b981', '#f59e0b'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try { setData(await dashboard.get()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);

  const tenant = user?.tenants;
  const stats = data?.stats || {};
  const channels = data?.channels || {};
  const channelData = Object.entries(channels).map(([k, v]) => ({ name: k, value: v as number }));

  const statCards = [
    { label:'Total Conversations', value: stats.total_conversations ?? 0, icon:Layers, color:'var(--primary)', bg:'var(--primary-light)' },
    { label:'Open Now', value: stats.open_conversations ?? 0, icon:MessageSquare, color:'var(--blue)', bg:'#eff6ff' },
    { label:'Total Messages', value: stats.total_messages ?? 0, icon:Clock, color:'var(--amber)', bg:'#fffbeb' },
    { label:'Contacts', value: stats.total_contacts ?? 0, icon:Users, color:'var(--green)', bg:'#ecfdf5' },
  ];

  if (loading) return (
    <AppLayout>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', minHeight:400 }}>
        <div style={{ width:32, height:32, border:'3px solid var(--primary-light)', borderTop:'3px solid var(--primary)', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div style={{ padding:'24px 28px' }}>
        {/* Header */}
        <div style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:500, letterSpacing:'0.07em', textTransform:'uppercase', color:'var(--text-tertiary)', marginBottom:4 }}>Welcome back</div>
            <h1 style={{ fontSize:24, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.5px' }}>
              {tenant?.name || 'Your Business'} {tenant?.niche ? `· ${tenant.niche}` : ''}
            </h1>
            <p style={{ fontSize:13.5, color:'var(--text-secondary)', marginTop:3 }}>Omnichannel overview across all messaging channels</p>
          </div>
          <button onClick={() => { setRefreshing(true); load(); }} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', fontSize:13, fontWeight:500, background:'#fff', border:'1px solid var(--border)', borderRadius:9, cursor:'pointer', color:'var(--primary)' }}>
            <RefreshCw size={13} style={refreshing ? { animation:'spin 0.8s linear infinite' } : {}} /> Refresh
          </button>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          {statCards.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} style={{ background:'#fff', borderRadius:14, padding:'18px 20px', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={17} color={s.color} />
                  </div>
                </div>
                <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-tertiary)', marginBottom:6 }}>{s.label}</div>
                <div style={{ fontSize:30, fontWeight:700, color:'var(--text-primary)', letterSpacing:'-1px', lineHeight:1 }}>{s.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
          {/* Recent conversations */}
          <div style={{ background:'#fff', borderRadius:14, padding:'20px', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)' }}>Recent Conversations</div>
              <Link href="/conversations" style={{ fontSize:12.5, color:'var(--primary)', textDecoration:'none', fontWeight:500 }}>View all →</Link>
            </div>
            {!data?.recent_conversations?.length ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-tertiary)', fontSize:13 }}>
                <MessageSquare size={28} style={{ margin:'0 auto 10px', display:'block', opacity:0.3 }} />
                No conversations yet. Connect WhatsApp to get started.
              </div>
            ) : data.recent_conversations.map((c: any) => (
              <Link key={c.id} href={`/conversations?id=${c.id}`} style={{ textDecoration:'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {(c.contacts?.name || '?').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:500, color:'var(--text-primary)' }}>{c.contacts?.name || c.contacts?.phone || 'Unknown'}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.last_message_preview || 'No messages yet'}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:10.5, color:'var(--text-tertiary)' }}>{c.channel}</div>
                    <span style={{ fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:10, background: c.status==='open' ? 'var(--primary-light)' : '#d1fae5', color: c.status==='open' ? 'var(--primary)' : '#065f46' }}>{c.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Channel breakdown */}
          <div style={{ background:'#fff', borderRadius:14, padding:'20px', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>Source Breakdown</div>
            {channelData.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-tertiary)', fontSize:13 }}>No data yet</div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                  <PieChart width={150} height={150}>
                    <Pie data={channelData} cx={70} cy={70} innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                      {channelData.map((_,i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                  </PieChart>
                </div>
                {channelData.map((c,i) => {
                  const total = channelData.reduce((s,x) => s + x.value, 0);
                  return (
                    <div key={c.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:3, background:COLORS[i] }} />
                        <span style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)', textTransform:'capitalize' }}>{c.name}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>
                        {total > 0 ? Math.round((c.value/total)*100) : 0}%
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Setup checklist if no data */}
        {stats.total_conversations === 0 && (
          <div style={{ background:'#fff', borderRadius:14, padding:'20px 24px', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:16 }}>🚀 Setup Checklist</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[
                { step:1, title:'Configure AI Agent', desc:'Set up your WhatsApp bot with your business info', href:'/agents', done:false },
                { step:2, title:'Connect WhatsApp', desc:'Link your WhatsApp Business number via Meta API', href:'/integrations', done:false },
                { step:3, title:'Test a message', desc:'Send yourself a WhatsApp message to test the flow', href:'/conversations', done:false },
              ].map(s => (
                <Link key={s.step} href={s.href} style={{ textDecoration:'none' }}>
                  <div style={{ background:'var(--primary-light)', borderRadius:12, padding:'16px', border:'1px solid var(--border)', cursor:'pointer', transition:'all 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor='var(--primary-mid)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor='var(--border)'}
                  >
                    <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', marginBottom:10 }}>{s.step}</div>
                    <div style={{ fontSize:13.5, fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', lineHeight:1.5 }}>{s.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
