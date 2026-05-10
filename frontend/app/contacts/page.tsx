'use client';
import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { contacts as contactsApi } from '@/lib/api';
import { Search, Plus, Phone, Mail, Tag, MessageSquare, X, ChevronRight } from 'lucide-react';

const tagColors: Record<string, any> = {
  VIP:      { bg:'#fef3c7', color:'#92400e' },
  Regular:  { bg:'#dbeafe', color:'#1e40af' },
  New:      { bg:'#d1fae5', color:'#065f46' },
};

export default function ContactsPage() {
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name:'', phone:'', email:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    contactsApi.list().then(d => { setList(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = list.filter(c =>
    !search || (c.name||'').toLowerCase().includes(search.toLowerCase()) || (c.phone||'').includes(search)
  );

  const handleAdd = async () => {
    if (!form.name && !form.phone) return;
    setSaving(true);
    try {
      const c = await contactsApi.create({ ...form, tags: ['New'] });
      setList(p => [c, ...p]);
      setSelected(c);
      setShowAdd(false);
      setForm({ name:'', phone:'', email:'' });
    } catch (e:any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const removeTag = async (contactId: string, tag: string) => {
    const c = list.find(x => x.id === contactId);
    if (!c) return;
    const tags = (c.tags||[]).filter((t:string) => t !== tag);
    const updated = await contactsApi.update(contactId, { tags });
    setList(p => p.map(x => x.id===contactId ? {...x, tags} : x));
    setSelected((s:any) => s?.id===contactId ? {...s, tags} : s);
  };

  const addTag = async (contactId: string, tag: string) => {
    const c = list.find(x => x.id === contactId);
    if (!c) return;
    const tags = [...(c.tags||[]), tag];
    await contactsApi.update(contactId, { tags });
    setList(p => p.map(x => x.id===contactId ? {...x, tags} : x));
    setSelected((s:any) => s?.id===contactId ? {...s, tags} : s);
  };

  return (
    <AppLayout>
      <div style={{ display:'flex', height:'calc(100vh - 38px)' }}>
        {/* Left list */}
        <div style={{ width:300, background:'#fff', borderRight:'1px solid rgba(99,102,241,0.1)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'16px 14px 10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <h2 style={{ fontSize:16, fontWeight:700, color:'#111827' }}>Contacts</h2>
              <button onClick={() => setShowAdd(true)} style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#4f46e5,#2563eb)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Plus size={14} color="#fff"/>
              </button>
            </div>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
                style={{ width:'100%', padding:'7px 10px 7px 28px', fontSize:12.5, border:'1px solid rgba(99,102,241,0.15)', borderRadius:8, background:'#f8f9ff', fontFamily:'inherit', color:'#111' }}/>
            </div>
          </div>
          {/* Stats */}
          <div style={{ display:'flex', borderTop:'1px solid rgba(99,102,241,0.08)', borderBottom:'1px solid rgba(99,102,241,0.08)' }}>
            {[{l:'Total',v:list.length},{l:'VIP',v:list.filter(c=>(c.tags||[]).includes('VIP')).length},{l:'New',v:list.filter(c=>(c.tags||[]).includes('New')).length}].map(s => (
              <div key={s.l} style={{ flex:1, padding:'8px 0', textAlign:'center', borderRight:'1px solid rgba(99,102,241,0.08)' }}>
                <div style={{ fontSize:16, fontWeight:700, color:'#111827' }}>{s.v}</div>
                <div style={{ fontSize:10.5, color:'#9ca3af' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? <div style={{ padding:24, textAlign:'center', color:'#9ca3af', fontSize:13 }}>Loading…</div>
            : filtered.length===0 ? (
              <div style={{ padding:24, textAlign:'center', color:'#9ca3af', fontSize:13 }}>
                No contacts yet.<br/>Contacts are created automatically<br/>when customers message you.
              </div>
            ) : filtered.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                style={{ padding:'11px 14px', cursor:'pointer', borderBottom:'1px solid rgba(99,102,241,0.06)', background:selected?.id===c.id?'#f0f4ff':'transparent', borderLeft:selected?.id===c.id?'3px solid #2563eb':'3px solid transparent', transition:'all 0.1s' }}
                onMouseEnter={e => { if(selected?.id!==c.id)(e.currentTarget as HTMLElement).style.background='#f8f9ff'; }}
                onMouseLeave={e => { if(selected?.id!==c.id)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
                    {(c.name||c.phone||'?').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13.5, fontWeight:600, color:'#111827', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name||c.phone||'Unknown'}</div>
                    <div style={{ fontSize:11.5, color:'#9ca3af' }}>{c.phone||c.email||'No contact info'}</div>
                  </div>
                  {(c.tags||[]).slice(0,1).map((tag:string) => (
                    <span key={tag} style={{ fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:10, ...(tagColors[tag]||{bg:'#f3f4f6',color:'#374151'}) }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right detail */}
        {selected ? (
          <div style={{ flex:1, overflowY:'auto', background:'#f8f9ff' }}>
            <div style={{ background:'#fff', borderBottom:'1px solid rgba(99,102,241,0.1)', padding:'20px 28px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16 }}>
                <div style={{ width:58, height:58, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#2563eb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#fff', flexShrink:0 }}>
                  {(selected.name||selected.phone||'?').slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <h2 style={{ fontSize:20, fontWeight:700, color:'#111827', letterSpacing:'-0.3px', marginBottom:4 }}>{selected.name||selected.phone||'Unknown'}</h2>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {(selected.tags||[]).map((tag:string) => (
                      <span key={tag} style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:500, padding:'3px 9px', borderRadius:10, ...(tagColors[tag]||{bg:'#f3f4f6',color:'#374151'}), cursor:'pointer' }}>
                        {tag} <X size={9} onClick={() => removeTag(selected.id, tag)}/>
                      </span>
                    ))}
                    {['VIP','Regular','New'].filter(t => !(selected.tags||[]).includes(t)).map(tag => (
                      <button key={tag} onClick={() => addTag(selected.id, tag)} style={{ fontSize:11, padding:'3px 9px', borderRadius:10, border:'1px dashed rgba(99,102,241,0.3)', background:'transparent', color:'#6b7280', cursor:'pointer' }}>+ {tag}</button>
                    ))}
                  </div>
                </div>
                <button style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', fontSize:12.5, fontWeight:600, background:'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>
                  <MessageSquare size={13}/> Message
                </button>
              </div>
            </div>
            <div style={{ padding:'20px 28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {/* Contact info */}
              <div style={{ background:'#fff', borderRadius:14, padding:'18px', border:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:14 }}>👤 Contact Information</div>
                {[{icon:Phone,label:'Phone',value:selected.phone},{icon:Mail,label:'Email',value:selected.email}].map(({icon:Icon,label,value}) => (
                  <div key={label} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:'1px solid rgba(99,102,241,0.07)' }}>
                    <div style={{ width:30, height:30, borderRadius:8, background:'#f0f4ff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={13} color="#4f46e5"/>
                    </div>
                    <div>
                      <div style={{ fontSize:10.5, color:'#9ca3af', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
                      <div style={{ fontSize:13.5, color: value?'#111827':'#9ca3af', fontWeight:500, marginTop:1 }}>{value||'Not provided'}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Activity */}
              <div style={{ background:'#fff', borderRadius:14, padding:'18px', border:'1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:14 }}>📊 Activity</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[{l:'Total Convos',v:selected.total_conversations||0,i:'💬'},{l:'Last Contact',v:selected.last_contacted_at?new Date(selected.last_contacted_at).toLocaleDateString():'Never',i:'🕐'},{l:'Total Spent',v:selected.total_spent?`$${selected.total_spent}`:'—',i:'💰'},{l:'Channel',v:selected.whatsapp_id?'WhatsApp':selected.instagram_id?'Instagram':'Facebook',i:'📱'}].map(s => (
                    <div key={s.l} style={{ background:'#f8f9ff', borderRadius:10, padding:'12px', border:'1px solid rgba(99,102,241,0.08)' }}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{s.i}</div>
                      <div style={{ fontSize:16, fontWeight:700, color:'#111827' }}>{s.v}</div>
                      <div style={{ fontSize:11, color:'#9ca3af' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Notes */}
              <div style={{ background:'#fff', borderRadius:14, padding:'18px', border:'1px solid rgba(99,102,241,0.1)', gridColumn:'1/-1' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:10 }}>📝 Notes</div>
                <textarea defaultValue={selected.notes||''} placeholder="Add notes about this contact…"
                  onBlur={async (e) => { await contactsApi.update(selected.id, { notes: e.target.value }); }}
                  style={{ width:'100%', minHeight:80, padding:'10px 12px', fontSize:13, border:'1.5px solid rgba(99,102,241,0.15)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', color:'#111', resize:'vertical', lineHeight:1.6 }}/>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:26 }}>👤</div>
            <div style={{ fontSize:15, fontWeight:600, color:'#111827' }}>Select a contact</div>
            <div style={{ fontSize:13, color:'#6b7280' }}>Contacts are auto-created from incoming messages</div>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setShowAdd(false)}>
          <div style={{ background:'#fff', borderRadius:16, padding:'28px 32px', width:400, boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:700, color:'#111827', marginBottom:20 }}>Add Contact</h3>
            {[{l:'Name',k:'name',p:'Sara Ahmed'},{l:'Phone',k:'phone',p:'+92 300 0000000'},{l:'Email',k:'email',p:'email@example.com'}].map(f => (
              <div key={f.k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:5 }}>{f.l}</label>
                <input value={(form as any)[f.k]} onChange={e => setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.p}
                  style={{ width:'100%', padding:'10px 12px', fontSize:13.5, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fafafa', fontFamily:'inherit', color:'#111' }}/>
              </div>
            ))}
            <div style={{ display:'flex', gap:10, marginTop:20 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, border:'1px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fff', color:'#6b7280', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={{ flex:1, padding:'10px', fontSize:13, fontWeight:600, background:'linear-gradient(135deg,#4f46e5,#2563eb)', color:'#fff', border:'none', borderRadius:9, cursor:'pointer' }}>
                {saving ? 'Saving…' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
