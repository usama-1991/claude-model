'use client';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { tenant as tenantApi } from '@/lib/api';
import { Check, ExternalLink } from 'lucide-react';

const allIntegrations = [
  { category:'Messaging Channels', items:[
    { id:'whatsapp', name:'WhatsApp Business', icon:'💬', desc:'Connect via Meta Cloud API. Handle all WhatsApp messages in this CRM.', required:true },
    { id:'instagram', name:'Instagram DMs', icon:'📸', desc:'Handle Instagram DMs with your AI agent.' },
    { id:'facebook', name:'Facebook Messenger', icon:'📘', desc:'Handle Facebook Page messages with your AI agent.' },
  ]},
  { category:'Automation', items:[
    { id:'n8n', name:'n8n Workflows', icon:'⚡', desc:'Core automation engine. Triggers on every new message.', required:true },
    { id:'sheets', name:'Google Sheets', icon:'📊', desc:'Export contacts and conversations automatically.' },
  ]},
  { category:'Payments', items:[
    { id:'easypaisa', name:'EasyPaisa', icon:'🏦', desc:'Accept mobile payments from Pakistani customers.' },
    { id:'jazzcash', name:'JazzCash', icon:'🏦', desc:'Accept JazzCash mobile wallet payments.' },
    { id:'stripe', name:'Stripe', icon:'💳', desc:'International card payments.' },
  ]},
  { category:'AI', items:[
    { id:'openai', name:'OpenAI GPT-4o', icon:'🤖', desc:'Default AI model powering your agent.', required:true },
  ]},
];

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<Record<string,boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string|null>(null);

  useEffect(() => {
    tenantApi.integrations().then(data => {
      const c: Record<string,boolean> = {};
      data.forEach((i:any) => { c[i.type] = i.is_connected; });
      setConnected(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    const newVal = !connected[id];
    setSaving(id);
    try {
      await tenantApi.updateIntegration(id, { name: id, is_connected: newVal, config: {} });
      setConnected(p => ({...p, [id]: newVal}));
    } catch(e:any) { alert(e.message); }
    finally { setSaving(null); }
  };

  const connectedCount = Object.values(connected).filter(Boolean).length;
  const total = allIntegrations.flatMap(g => g.items).length;

  return (
    <AppLayout>
      <div style={{ padding:'24px 28px', maxWidth:860 }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#111827', letterSpacing:'-0.5px', marginBottom:4 }}>Integrations</h1>
          <p style={{ fontSize:13.5, color:'#6b7280' }}>Connect messaging channels, automation tools, and payment gateways.</p>
        </div>
        <div style={{ background:'#fff', borderRadius:14, padding:'14px 20px', marginBottom:24, border:'1px solid rgba(99,102,241,0.1)', display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:13, fontWeight:600, color:'#111827' }}>Setup Progress</span>
              <span style={{ fontSize:13, fontWeight:700, color:'#2563eb' }}>{connectedCount}/{total} connected</span>
            </div>
            <div style={{ height:8, background:'#e5e7eb', borderRadius:4, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${total>0?(connectedCount/total)*100:0}%`, background:'linear-gradient(90deg,#4f46e5,#2563eb)', borderRadius:4, transition:'width 0.3s' }}/>
            </div>
          </div>
        </div>
        {loading ? <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>Loading…</div> : (
          allIntegrations.map(group => (
            <div key={group.category} style={{ marginBottom:24 }}>
              <h2 style={{ fontSize:12, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>{group.category}</h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:10 }}>
                {group.items.map(item => {
                  const isConnected = !!connected[item.id];
                  return (
                    <div key={item.id} style={{ background:'#fff', borderRadius:12, padding:'16px', border:isConnected?'1.5px solid #a5b4fc':'1px solid rgba(99,102,241,0.1)', position:'relative', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                      {(item as any).required && <span style={{ position:'absolute', top:10, right:10, fontSize:9.5, fontWeight:600, color:'#4f46e5', background:'#eff6ff', padding:'2px 6px', borderRadius:4 }}>REQUIRED</span>}
                      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:'#f8f9ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, border:'1px solid rgba(99,102,241,0.1)' }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize:13.5, fontWeight:600, color:'#111827' }}>{item.name}</div>
                          {isConnected && <div style={{ fontSize:11, color:'#10b981', fontWeight:500 }}>● Connected</div>}
                        </div>
                      </div>
                      <p style={{ fontSize:12.5, color:'#6b7280', lineHeight:1.5, marginBottom:12 }}>{item.desc}</p>
                      <button onClick={() => toggle(item.id)} disabled={saving===item.id} style={{ width:'100%', padding:'8px', fontSize:12.5, fontWeight:600, borderRadius:8, cursor:'pointer', background:isConnected?'#f0fdf4':'linear-gradient(135deg,#4f46e5,#2563eb)', color:isConnected?'#065f46':'#fff', border:isConnected?'1px solid #bbf7d0':'none', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                        {isConnected?<><Check size={12}/> Connected</>:saving===item.id?'Connecting…':'+ Connect'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
}
