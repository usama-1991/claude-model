'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { conversations as convApi } from '@/lib/api';
import { subscribeToMessages, subscribeToConversations } from '@/lib/supabase';
import { Send, Search, Bot, User, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';

const chIcon: Record<string, string> = { whatsapp:'💬', instagram:'📸', facebook:'📘' };
const stStyle: Record<string, any> = {
  open:     { bg:'var(--primary-light)', color:'var(--primary)' },
  resolved: { bg:'#d1fae5', color:'#065f46' },
  pending:  { bg:'#fef3c7', color:'#92400e' },
  bot:      { bg:'var(--primary-light)', color:'var(--primary)' },
};

export default function ConversationsPage() {
  const { user } = useAuth();
  const [convos, setConvos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversations
  const loadConvos = useCallback(async () => {
    try {
      const data = await convApi.list(filter !== 'all' ? { status: filter } : undefined);
      setConvos(data);
      setLoading(false);
    } catch {}
  }, [filter]);

  useEffect(() => { loadConvos(); }, [loadConvos]);

  // Realtime: conversation list updates
  useEffect(() => {
    if (!user?.tenant_id) return;
    const sub = subscribeToConversations(user.tenant_id, (updated) => {
      setConvos(prev => {
        const idx = prev.findIndex(c => c.id === updated.id);
        if (idx >= 0) { const copy = [...prev]; copy[idx] = { ...copy[idx], ...updated }; return copy; }
        return [updated, ...prev];
      });
    });
    return () => { sub.unsubscribe(); };
  }, [user?.tenant_id]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selected) return;
    convApi.get(selected.id).then(data => {
      setMessages(data.messages || []);
      setSelected((s: any) => ({ ...s, ...data }));
    });
  }, [selected?.id]);

  // Realtime: messages in selected conversation
  useEffect(() => {
    if (!selected) return;
    const sub = subscribeToMessages(selected.id, (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { sub.unsubscribe(); };
  }, [selected?.id]);

  // Scroll to bottom on new messages
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    try {
      await convApi.sendMessage(selected.id, reply);
      setReply('');
    } catch (e: any) { alert(e.message); }
    finally { setSending(false); }
  };

  const toggleAI = async () => {
    if (!selected) return;
    const updated = await convApi.update(selected.id, { ai_enabled: !selected.ai_enabled });
    setSelected((s: any) => ({ ...s, ...updated }));
  };

  const resolve = async () => {
    if (!selected) return;
    await convApi.update(selected.id, { status: 'resolved' });
    setSelected((s: any) => ({ ...s, status: 'resolved' }));
    setConvos(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'resolved' } : c));
  };

  const filtered = convos.filter(c =>
    !search || (c.contacts?.name || c.contacts?.phone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div style={{ display:'flex', height:'calc(100vh - 38px)' }}>

        {/* Conversation list */}
        <div style={{ width:300, background:'#fff', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'16px 14px 10px' }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:10 }}>Conversations</h2>
            <div style={{ position:'relative', marginBottom:10 }}>
              <Search size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-tertiary)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
                style={{ width:'100%', padding:'7px 10px 7px 28px', fontSize:12.5, border:'1px solid var(--border)', borderRadius:8, background:'var(--primary-light)', fontFamily:'inherit', color:'#111' }} />
            </div>
            <div style={{ display:'flex', gap:4 }}>
              {['all','open','resolved','pending'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ flex:1, padding:'4px 0', fontSize:11, fontWeight:filter===f?600:400, borderRadius:6, background:filter===f?'var(--primary)':'transparent', color:filter===f?'#fff':'var(--text-secondary)', border:'none', cursor:'pointer', textTransform:'capitalize' }}>{f}</button>
              ))}
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? <div style={{ padding:24, textAlign:'center', color:'var(--text-tertiary)', fontSize:13 }}>Loading…</div>
            : filtered.length === 0 ? (
              <div style={{ padding:24, textAlign:'center', color:'var(--text-tertiary)', fontSize:13 }}>
                <MessageSquare size={24} style={{ margin:'0 auto 8px', display:'block', opacity:0.3 }} />
                No conversations yet
              </div>
            ) : filtered.map(c => (
              <div key={c.id} onClick={() => setSelected(c)}
                style={{ padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)', background: selected?.id===c.id ? 'var(--primary-light)':'transparent', borderLeft: selected?.id===c.id ? '3px solid var(--primary)':'3px solid transparent', transition:'all 0.1s' }}
                onMouseEnter={e => { if(selected?.id!==c.id)(e.currentTarget as HTMLElement).style.background='var(--primary-light)'; }}
                onMouseLeave={e => { if(selected?.id!==c.id)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
                <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff' }}>
                      {(c.contacts?.name||c.contacts?.phone||'?').slice(0,2).toUpperCase()}
                    </div>
                    <span style={{ position:'absolute', bottom:-2, right:-2, fontSize:11 }}>{chIcon[c.channel]||'💬'}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)' }}>{c.contacts?.name||c.contacts?.phone||'Unknown'}</span>
                      <span style={{ fontSize:10.5, color:'var(--text-tertiary)', flexShrink:0, marginLeft:4 }}>{c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : ''}</span>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{c.last_message_preview||'No messages'}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5 }}>
                      <span style={{ fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:10, ...(stStyle[c.status]||{bg:'#f3f4f6',color:'#374151'}) }}>{c.status}</span>
                      {c.ai_enabled && <span style={{ fontSize:10, color:'var(--primary)', display:'flex', alignItems:'center', gap:2 }}><Bot size={10}/> AI</span>}
                      {(c.unread_count||0) > 0 && <span style={{ marginLeft:'auto', width:18, height:18, borderRadius:'50%', background:'var(--primary)', color:'#fff', fontSize:10, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center' }}>{c.unread_count}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        {selected ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
            {/* Chat header */}
            <div style={{ background:'#fff', borderBottom:'1px solid var(--border)', padding:'12px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg, var(--primary), var(--primary-dark))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff' }}>
                  {(selected.contacts?.name||selected.contacts?.phone||'?').slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-primary)' }}>{selected.contacts?.name||selected.contacts?.phone||'Unknown'}</div>
                  <div style={{ fontSize:11.5, color:'var(--text-tertiary)' }}>{chIcon[selected.channel]} via {selected.channel} · {selected.status}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={toggleAI} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', fontSize:12, fontWeight:500, borderRadius:7, border:'1px solid var(--border)', background: selected.ai_enabled?'var(--primary-light)':'#f3f4f6', color: selected.ai_enabled?'var(--primary)':'var(--text-secondary)', cursor:'pointer' }}>
                  <Bot size={13}/> {selected.ai_enabled ? 'AI On' : 'AI Off'}
                </button>
                {selected.status !== 'resolved' && (
                  <button onClick={resolve} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', fontSize:12, fontWeight:500, borderRadius:7, border:'none', background:'var(--green)', color:'#fff', cursor:'pointer' }}>
                    <CheckCircle size={13}/> Resolve
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 18px', display:'flex', flexDirection:'column', gap:14, background:'var(--bg)' }}>
              {messages.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--text-tertiary)', fontSize:13, padding:'40px 0' }}>No messages yet in this conversation</div>
              )}
              {messages.map((m: any) => (
                <div key={m.id} style={{ display:'flex', justifyContent: m.direction==='inbound'?'flex-start':'flex-end', gap:8, alignItems:'flex-end' }}>
                  {m.direction==='inbound' && (
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--primary-light)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <User size={12} color="var(--primary)"/>
                    </div>
                  )}
                  <div style={{ maxWidth:'68%' }}>
                    <div style={{ padding:'11px 14px', borderRadius: m.direction==='inbound'?'12px 12px 12px 2px':'12px 12px 2px 12px', background: m.direction==='inbound'?'#fff':'var(--text-primary)', color: m.direction==='inbound'?'var(--text-primary)':'#fff', fontSize:13.5, lineHeight:1.55, border: m.direction==='inbound'?'1px solid var(--border)':'none', boxShadow:'var(--shadow-sm)' }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize:10.5, color:'var(--text-tertiary)', marginTop:3, textAlign: m.direction==='inbound'?'left':'right' }}>
                      {m.sender_type==='bot'?'🤖 AI · ':''}{new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  {m.direction==='outbound' && m.sender_type==='bot' && (
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--primary-light)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Bot size={12} color="var(--primary)"/>
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Reply bar */}
            <div style={{ padding:'12px 16px', background:'#fff', borderTop:'1px solid var(--border)' }}>
              {selected.status === 'resolved' ? (
                <div style={{ textAlign:'center', fontSize:13, color:'var(--text-tertiary)', padding:'8px 0' }}>This conversation is resolved. <button onClick={() => { convApi.update(selected.id,{status:'open'}); setSelected((s:any)=>({...s,status:'open'})); }} style={{ color:'var(--primary)', background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>Reopen</button></div>
              ) : (
                <div style={{ display:'flex', gap:10 }}>
                  <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key==='Enter' && !e.shiftKey && sendMessage()}
                    placeholder={selected.ai_enabled ? 'AI is handling this — type to override…' : `Reply to ${selected.contacts?.name||'customer'}…`}
                    style={{ flex:1, padding:'10px 14px', fontSize:13.5, border:'1.5px solid var(--border)', borderRadius:24, background:'var(--primary-light)', fontFamily:'inherit', color:'#111', outline:'none' }} />
                  <button onClick={sendMessage} disabled={sending||!reply.trim()} style={{ width:42, height:42, borderRadius:'50%', background: !reply.trim()||sending?'#e5e7eb':'linear-gradient(135deg, var(--primary), var(--primary-dark))', border:'none', cursor: !reply.trim()||sending?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {sending ? <RefreshCw size={14} color="#fff" style={{animation:'spin 0.8s linear infinite'}}/> : <Send size={14} color="#fff"/>}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, background:'var(--bg)' }}>
            <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--primary-light)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <MessageSquare size={26} color="var(--primary)"/>
            </div>
            <div style={{ fontSize:16, fontWeight:600, color:'var(--text-primary)' }}>Select a conversation</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)' }}>Choose from the list to view messages</div>
          </div>
        )}

      </div>
    </AppLayout>
  );
}
