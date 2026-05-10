'use client';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { tenant as tenantApi } from '@/lib/api';
import { Check } from 'lucide-react';

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{ width:44, height:24, background:checked?'#2563eb':'#e5e7eb', borderRadius:12, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left:checked?22:2, width:20, height:20, background:'#fff', borderRadius:'50%', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
    </div>
  );
}

const tabs = ['Business', 'API Keys', 'Notifications', 'Billing'] as const;
type Tab = typeof tabs[number];
const notifDefaults = [
  { id:'new_conv',  label:'New conversation',  desc:'Alert when a customer message arrives', on:true },
  { id:'ai_off',   label:'AI agent offline',   desc:'Notify if AI agent stops responding',   on:true },
  { id:'handoff',  label:'Human handoff',      desc:'When AI escalates to human agent',      on:true },
  { id:'daily',    label:'Daily summary',      desc:'Daily performance report at 9 AM',      on:true },
  { id:'weekly',   label:'Weekly analytics',   desc:'Weekly summary every Monday',           on:false },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('Business');
  const [tenantData, setTenantData] = useState<any>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifs, setNotifs] = useState<Record<string,boolean>>(
    Object.fromEntries(notifDefaults.map(n => [n.id, n.on]))
  );

  useEffect(() => {
    tenantApi.me().then(setTenantData).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await tenantApi.update({
        name: tenantData?.name,
        whatsapp_number: tenantData?.whatsapp_number,
        whatsapp_phone_id: tenantData?.whatsapp_phone_id,
        whatsapp_token: tenantData?.whatsapp_token,
        instagram_page_id: tenantData?.instagram_page_id,
        facebook_page_id: tenantData?.facebook_page_id,
        n8n_webhook_url: tenantData?.n8n_webhook_url,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const upd = (k: string, v: string) => setTenantData((p: any) => ({ ...p, [k]: v }));

  const businessFields = [
    { l:'Business Name',          k:'name',               p:'e.g. Spice Garden Restaurant' },
    { l:'WhatsApp Number',        k:'whatsapp_number',    p:'+92 300 0000000' },
    { l:'WhatsApp Phone ID',      k:'whatsapp_phone_id',  p:'From Meta Developer Console' },
    { l:'Meta Access Token',      k:'whatsapp_token',     p:'Permanent token from Meta' },
    { l:'Instagram Page ID',      k:'instagram_page_id',  p:'From Meta Developer Console' },
    { l:'Facebook Page ID',       k:'facebook_page_id',   p:'From Meta Developer Console' },
    { l:'n8n Webhook URL',        k:'n8n_webhook_url',    p:'https://your-n8n.railway.app/webhook/...' },
  ];

  const apiKeyFields = [
    { l:'OpenAI API Key',     v:'sk-proj-••••••5aB2',            h:'Set OPENAI_API_KEY in backend .env' },
    { l:'Supabase URL',       v:process.env.NEXT_PUBLIC_SUPABASE_URL||'Not set', h:'Set SUPABASE_URL in backend .env' },
    { l:'Meta App Secret',    v:'EAAGm••••••3kL',                h:'Set META_APP_SECRET in backend .env' },
    { l:'Meta Verify Token',  v:tenantData?.meta_verify_token||'—', h:'Use this in Meta webhook registration' },
  ];

  const plans = [
    { name:'Starter',    price:'$49/mo · PKR 13,600' },
    { name:'Growth',     price:'$149/mo · PKR 41,300' },
    { name:'Enterprise', price:'$399/mo · PKR 110,700' },
  ];

  return (
    <AppLayout>
      <div style={{ padding:'24px 28px' }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:24, fontWeight:700, color:'#111827', letterSpacing:'-0.5px' }}>Settings</h1>
          <p style={{ fontSize:13.5, color:'#6b7280', marginTop:3 }}>Manage your account, API connections, and preferences</p>
        </div>

        <div style={{ display:'flex', gap:2, borderBottom:'1px solid rgba(99,102,241,0.12)', marginBottom:28 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'9px 18px', fontSize:13, fontWeight:tab===t?600:400, color:tab===t?'#2563eb':'#6b7280', background:'none', border:'none', borderBottom:tab===t?'2px solid #2563eb':'2px solid transparent', marginBottom:-1, cursor:'pointer' }}>{t}</button>
          ))}
        </div>

        <div style={{ maxWidth:580 }}>

          {/* ── Business ── */}
          {tab === 'Business' && (
            <div style={{ background:'#fff', borderRadius:14, padding:'22px', border:'1px solid rgba(99,102,241,0.1)' }}>
              {businessFields.map(f => (
                <div key={f.k} style={{ marginBottom:16 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>{f.l}</label>
                  <input value={tenantData?.[f.k]||''} onChange={e => upd(f.k, e.target.value)} placeholder={f.p}
                    style={{ width:'100%', padding:'10px 12px', fontSize:13.5, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', color:'#111' }}/>
                </div>
              ))}
              <button onClick={handleSave} disabled={saving} style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, padding:'11px 24px', fontSize:14, fontWeight:600, background:saved?'#10b981':'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', boxShadow:'0 4px 14px rgba(79,70,229,0.25)', transition:'background 0.2s' }}>
                {saved ? <><Check size={15}/> Saved!</> : saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* ── API Keys ── */}
          {tab === 'API Keys' && (
            <div style={{ background:'#fff', borderRadius:14, padding:'22px', border:'1px solid rgba(99,102,241,0.1)' }}>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:20, lineHeight:1.6 }}>
                API keys live in your backend <code style={{ background:'#f0f4ff', padding:'2px 6px', borderRadius:4, fontSize:12 }}>.env</code> file. Update them there directly for security.
              </p>
              {apiKeyFields.map(k => (
                <div key={k.l} style={{ marginBottom:16 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>{k.l}</label>
                  <div style={{ display:'flex', gap:8 }}>
                    <input defaultValue={k.v} readOnly style={{ flex:1, padding:'9px 12px', fontSize:13, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'monospace', color:'#374151' }}/>
                    <button onClick={() => navigator.clipboard.writeText(k.v)} style={{ padding:'8px 12px', fontSize:12, border:'1px solid rgba(99,102,241,0.15)', borderRadius:9, background:'#fff', cursor:'pointer', color:'#4f46e5', fontWeight:500 }}>Copy</button>
                  </div>
                  <p style={{ fontSize:11.5, color:'#9ca3af', marginTop:3 }}>{k.h}</p>
                </div>
              ))}
              <div style={{ background:'#fffbeb', borderRadius:10, padding:'12px 14px', border:'1px solid #fde68a', marginTop:8 }}>
                <p style={{ fontSize:12.5, color:'#92400e', lineHeight:1.7 }}>
                  ⚠️ <strong>Meta Verify Token:</strong> <code style={{ fontFamily:'monospace', background:'rgba(0,0,0,0.06)', padding:'1px 5px', borderRadius:3 }}>{tenantData?.meta_verify_token||'loading…'}</code><br/>
                  Enter this in the Meta Developer Console → Webhooks → Verify Token.
                </p>
              </div>
            </div>
          )}

          {/* ── Notifications ── */}
          {tab === 'Notifications' && (
            <div style={{ background:'#fff', borderRadius:14, padding:'22px', border:'1px solid rgba(99,102,241,0.1)' }}>
              {notifDefaults.map(n => (
                <div key={n.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid rgba(99,102,241,0.07)' }}>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:500, color:'#111827' }}>{n.label}</div>
                    <div style={{ fontSize:12.5, color:'#6b7280', marginTop:2 }}>{n.desc}</div>
                  </div>
                  <Toggle checked={notifs[n.id]} onChange={() => setNotifs(p => ({ ...p, [n.id]: !p[n.id] }))}/>
                </div>
              ))}
            </div>
          )}

          {/* ── Billing ── */}
          {tab === 'Billing' && (
            <div>
              <div style={{ background:'linear-gradient(135deg,#1e1b4b,#1e40af)', borderRadius:14, padding:'20px 24px', marginBottom:16, color:'#fff' }}>
                <div style={{ fontSize:11, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(255,255,255,0.5)', marginBottom:4 }}>Current Plan</div>
                <div style={{ fontSize:22, fontWeight:700, marginBottom:2 }}>{tenantData?.plans?.display_name || 'Trial'}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)' }}>Contact <a href="mailto:admin@autoflow.ai" style={{ color:'#93c5fd' }}>admin@autoflow.ai</a> to change your plan</div>
              </div>
              {plans.map(plan => (
                <div key={plan.name} style={{ background:'#fff', borderRadius:12, padding:'16px 20px', marginBottom:10, border:'1px solid rgba(99,102,241,0.1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>{plan.name}</div>
                    <div style={{ fontSize:12.5, color:'#6b7280' }}>{plan.price}</div>
                  </div>
                  <a href="mailto:admin@autoflow.ai" style={{ padding:'7px 14px', fontSize:12.5, fontWeight:600, background:'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', borderRadius:8, textDecoration:'none' }}>Request</a>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
