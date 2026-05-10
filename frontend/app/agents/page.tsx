'use client';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { agents as agentsApi } from '@/lib/api';
import { Bot, Plus, Save, Check, Trash2, ChevronDown, Minus } from 'lucide-react';

const tones = ['Professional','Friendly','Enthusiastic','Empathetic','Direct'];
const langs  = ['English (US)','Urdu','Arabic','Spanish','French','Hindi'];

function Toggle({ checked, onChange }: { checked:boolean; onChange:()=>void }) {
  return (
    <div onClick={onChange} style={{ width:44, height:24, background:checked?'#2563eb':'#e5e7eb', borderRadius:12, position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left:checked?22:2, width:20, height:20, background:'#fff', borderRadius:'50%', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
    </div>
  );
}

export default function AgentsPage() {
  const [agentList, setAgentList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDo, setNewDo] = useState('');
  const [newDont, setNewDont] = useState('');

  useEffect(() => {
    agentsApi.list().then(d => {
      setAgentList(d);
      if (d.length > 0) setSelected(d[0]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const createAgent = async () => {
    const agent = await agentsApi.create({
      name: 'New AI Agent',
      greeting_message: 'Hello! How can I help you today?',
      system_role: 'You are a helpful business assistant.',
      tone: 'Professional',
      dos: ['Always be polite','Respond quickly'],
      donts: ['Never share personal data'],
      channels: ['whatsapp'],
      is_active: true, is_published: false,
    });
    setAgentList(p => [...p, agent]);
    setSelected(agent);
  };

  const saveAgent = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await agentsApi.update(selected.id, selected);
      setAgentList(p => p.map(a => a.id===selected.id ? updated : a));
      setSelected(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent?')) return;
    await agentsApi.delete(id);
    setAgentList(p => p.filter(a => a.id!==id));
    setSelected(null);
  };

  const toggleChannel = (ch: string) => {
    if (!selected) return;
    const channels = selected.channels?.includes(ch)
      ? selected.channels.filter((c:string) => c!==ch)
      : [...(selected.channels||[]), ch];
    setSelected((s:any) => ({...s, channels}));
  };

  const update = (key: string, val: any) => setSelected((s:any) => ({...s, [key]:val}));

  return (
    <AppLayout>
      <div style={{ display:'flex', height:'calc(100vh - 38px)' }}>
        {/* Sidebar */}
        <div style={{ width:280, background:'#fff', borderRight:'1px solid rgba(99,102,241,0.1)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'18px 16px' }}>
            <h2 style={{ fontSize:17, fontWeight:700, color:'#111827', marginBottom:14 }}>AI Agents</h2>
            <button onClick={createAgent} style={{ width:'100%', padding:'10px', fontSize:13.5, fontWeight:600, background:'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, boxShadow:'0 3px 10px rgba(79,70,229,0.25)' }}>
              <Plus size={15}/> Add New Agent
            </button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'0 12px' }}>
            {loading ? <div style={{ textAlign:'center', padding:24, color:'#9ca3af', fontSize:13 }}>Loading…</div>
            : agentList.length===0 ? (
              <div style={{ textAlign:'center', padding:24, color:'#9ca3af', fontSize:13 }}>No agents yet. Create one to get started.</div>
            ) : agentList.map(a => (
              <div key={a.id} onClick={() => setSelected(a)}
                style={{ background:selected?.id===a.id?'#f0f4ff':'transparent', border:selected?.id===a.id?'1.5px solid #a5b4fc':'1.5px solid transparent', borderRadius:12, padding:'12px 14px', marginBottom:8, cursor:'pointer', transition:'all 0.12s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{a.avatar_emoji||'🤖'}</div>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:600, color:'#111827' }}>{a.name}</div>
                    <div style={{ fontSize:11.5, color:'#6b7280' }}>{a.is_published?'Live':'Draft'} · {(a.channels||[]).length} channel(s)</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Config area */}
        {selected ? (
          <div style={{ flex:1, overflowY:'auto', background:'#f8f9ff' }}>
            {/* Top bar */}
            <div style={{ background:'#fff', borderBottom:'1px solid rgba(99,102,241,0.1)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:10 }}>
              <div>
                <div style={{ fontSize:11.5, color:'#9ca3af', marginBottom:1 }}>Agents › {selected.name}</div>
                <h2 style={{ fontSize:17, fontWeight:700, color:'#111827' }}>Agent Configuration</h2>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'#f3f4f6', borderRadius:8, border:'1px solid rgba(0,0,0,0.08)' }}>
                  <span style={{ fontSize:12, fontWeight:500, color:'#9ca3af' }}>LIVE</span>
                  <Toggle checked={!!selected.is_published} onChange={() => update('is_published', !selected.is_published)}/>
                </div>
                <button onClick={() => deleteAgent(selected.id)} style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 12px', fontSize:12.5, fontWeight:600, background:'#fef2f2', color:'#ef4444', border:'1px solid #fecaca', borderRadius:9, cursor:'pointer' }}>
                  <Trash2 size={13}/> Delete
                </button>
                <button onClick={saveAgent} disabled={saving} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px', fontSize:13, fontWeight:600, background: saved?'#10b981':'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:9, cursor:'pointer', boxShadow:'0 3px 10px rgba(79,70,229,0.2)' }}>
                  {saved ? <><Check size={13}/> Saved!</> : saving ? 'Saving…' : <><Save size={13}/> Save & Publish</>}
                </button>
              </div>
            </div>

            <div style={{ padding:'24px', maxWidth:780 }}>
              {/* Identity */}
              <div style={{ background:'#fff', borderRadius:14, padding:'22px', marginBottom:14, border:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
                  <div style={{ width:28, height:28, borderRadius:7, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
                  <span style={{ fontSize:15, fontWeight:600, color:'#111827' }}>Agent Identity</span>
                </div>
                <div style={{ display:'flex', gap:24 }}>
                  {/* Avatar */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                    <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg,#dbeafe,#eff6ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, border:'2px solid #bfdbfe', cursor:'pointer' }}>
                      {selected.avatar_emoji||'🤖'}
                    </div>
                    <span style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'0.06em' }}>Avatar</span>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Agent Name</label>
                      <input value={selected.name||''} onChange={e => update('name', e.target.value)}
                        style={{ width:'100%', padding:'10px 12px', fontSize:14, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', color:'#111' }}/>
                    </div>
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>Greeting Message</label>
                      <textarea value={selected.greeting_message||''} onChange={e => update('greeting_message', e.target.value)} rows={2}
                        style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid #2563eb', borderRadius:9, background:'#fff', fontFamily:'inherit', color:'#111', resize:'vertical', lineHeight:1.6 }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>System Role</label>
                      <textarea value={selected.system_role||''} onChange={e => update('system_role', e.target.value)} rows={4}
                        placeholder="Describe how the agent should behave and its core purpose…"
                        style={{ width:'100%', padding:'10px 12px', fontSize:13, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', color:'#111', resize:'vertical', lineHeight:1.6 }}/>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Channels */}
              <div style={{ background:'#fff', borderRadius:14, padding:'22px', marginBottom:14, border:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize:15, fontWeight:600, color:'#111827', marginBottom:14 }}>📡 Active Channels</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {[{id:'whatsapp',label:'WhatsApp',icon:'💬',color:'#25D366'},{id:'instagram',label:'Instagram',icon:'📸',color:'#E1306C'},{id:'facebook',label:'Facebook',icon:'📘',color:'#1877F2'}].map(ch => {
                    const active = (selected.channels||[]).includes(ch.id);
                    return (
                      <div key={ch.id} onClick={() => toggleChannel(ch.id)}
                        style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, border:`1.5px solid ${active?ch.color:'rgba(99,102,241,0.12)'}`, background:active?`${ch.color}10`:'#fafafa', cursor:'pointer', transition:'all 0.12s' }}>
                        <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${active?ch.color:'#d1d5db'}`, background:active?ch.color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          {active && <Check size={10} color="#fff" strokeWidth={3}/>}
                        </div>
                        <span style={{ fontSize:16 }}>{ch.icon}</span>
                        <span style={{ fontSize:13, fontWeight:500, color:active?'#111827':'#6b7280' }}>{ch.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personality */}
              <div style={{ background:'#fff', borderRadius:14, padding:'22px', marginBottom:14, border:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize:15, fontWeight:600, color:'#111827', marginBottom:14 }}>✨ Personality</div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:8 }}>Tone of Voice</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {tones.map(t => (
                      <button key={t} onClick={() => update('tone', t)} style={{ padding:'7px 16px', fontSize:13, fontWeight:500, borderRadius:20, cursor:'pointer', background:selected.tone===t?'#2563eb':'#fff', color:selected.tone===t?'#fff':'#374151', border:selected.tone===t?'none':'1.5px solid #e5e7eb', transition:'all 0.12s' }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  {/* Dos */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>👍 Do's</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
                      {(selected.dos||[]).map((d:string, i:number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'#f0fdf4', borderRadius:8, border:'1px solid #bbf7d0' }}>
                          <span style={{ fontSize:12.5, color:'#374151', flex:1 }}>{d}</span>
                          <button onClick={() => update('dos', (selected.dos||[]).filter((_:any,j:number)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}><Minus size={11} color="#9ca3af"/></button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <input value={newDo} onChange={e => setNewDo(e.target.value)} placeholder="e.g. Always be polite"
                        onKeyDown={e => { if(e.key==='Enter'&&newDo){update('dos',[...(selected.dos||[]),newDo]);setNewDo('');} }}
                        style={{ flex:1, padding:'7px 10px', fontSize:12.5, border:'1px solid rgba(99,102,241,0.2)', borderRadius:7, background:'#fff', fontFamily:'inherit', color:'#111' }}/>
                      <button onClick={() => { if(newDo){update('dos',[...(selected.dos||[]),newDo]);setNewDo('');} }} style={{ width:30, height:30, borderRadius:'50%', background:'#10b981', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Plus size={14} color="#fff"/>
                      </button>
                    </div>
                  </div>
                  {/* Donts */}
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:8 }}>🚫 Don'ts</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
                      {(selected.donts||[]).map((d:string, i:number) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'#fef2f2', borderRadius:8, border:'1px solid #fecaca' }}>
                          <span style={{ fontSize:12.5, color:'#374151', flex:1 }}>{d}</span>
                          <button onClick={() => update('donts', (selected.donts||[]).filter((_:any,j:number)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex' }}><Minus size={11} color="#9ca3af"/></button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      <input value={newDont} onChange={e => setNewDont(e.target.value)} placeholder="e.g. Never argue"
                        onKeyDown={e => { if(e.key==='Enter'&&newDont){update('donts',[...(selected.donts||[]),newDont]);setNewDont('');} }}
                        style={{ flex:1, padding:'7px 10px', fontSize:12.5, border:'1px solid rgba(99,102,241,0.2)', borderRadius:7, background:'#fff', fontFamily:'inherit', color:'#111' }}/>
                      <button onClick={() => { if(newDont){update('donts',[...(selected.donts||[]),newDont]);setNewDont('');} }} style={{ width:30, height:30, borderRadius:'50%', background:'#ef4444', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Plus size={14} color="#fff"/>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Human handoff */}
              <div style={{ background:'#fff', borderRadius:14, padding:'18px 22px', marginBottom:14, border:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:'#f5f3ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤝</div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600, color:'#111827' }}>Human Handoff</div>
                      <div style={{ fontSize:12, color:'#6b7280' }}>Transfer to human agent when AI cannot resolve</div>
                    </div>
                  </div>
                  <Toggle checked={!!selected.human_handoff_enabled} onChange={() => update('human_handoff_enabled', !selected.human_handoff_enabled)}/>
                </div>
              </div>

              <button onClick={saveAgent} disabled={saving} style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 28px', fontSize:14, fontWeight:600, background:saved?'#10b981':'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:10, cursor:'pointer', boxShadow:'0 4px 14px rgba(79,70,229,0.25)', transition:'background 0.2s' }}>
                {saved?<><Check size={15}/> Saved!</>:saving?'Saving…':<><Save size={15}/> Save Changes</>}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, background:'#f8f9ff' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>🤖</div>
            <div style={{ fontSize:16, fontWeight:600, color:'#111827' }}>Configure AI Agents</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>Select an agent or click <strong>Add New Agent</strong> to get started</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
