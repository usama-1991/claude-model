'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try { await login(email, password); }
    catch (err: any) { setError(err.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  const fillDemo = (role: 'admin' | 'owner') => {
    setEmail(role === 'admin' ? 'admin@autoflow.ai' : 'demo@restaurant.com');
    setPassword(role === 'admin' ? 'AutoFlow@Admin2026!' : 'Demo@1234!');
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'linear-gradient(135deg,#eef2ff 0%,#f0fdf4 60%,#fef3c7 100%)' }}>
      {/* Left brand panel */}
      <div style={{ flex:'0 0 420px', background:'linear-gradient(160deg,#1e1b4b 0%,#1e40af 100%)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 48px', color:'#fff' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:40 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700 }}>A</div>
          <span style={{ fontSize:20, fontWeight:700, letterSpacing:'-0.3px' }}>AutoFlow AI</span>
        </div>
        <h1 style={{ fontSize:32, fontWeight:700, lineHeight:1.2, marginBottom:16, letterSpacing:'-0.5px' }}>
          AI-Powered<br />Omnichannel CRM
        </h1>
        <p style={{ fontSize:15, color:'rgba(255,255,255,0.65)', lineHeight:1.7, marginBottom:40 }}>
          Manage WhatsApp, Instagram, and Facebook conversations with AI automation — all in one dashboard.
        </p>
        {[
          { icon:'💬', text:'WhatsApp + Instagram + Facebook unified inbox' },
          { icon:'🤖', text:'AI agent handles queries automatically 24/7' },
          { icon:'📊', text:'Real-time analytics and conversation insights' },
          { icon:'🔒', text:'Multi-tenant with role-based access control' },
        ].map(f => (
          <div key={f.text} style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
            <span style={{ fontSize:18, marginTop:1 }}>{f.icon}</span>
            <span style={{ fontSize:13.5, color:'rgba(255,255,255,0.75)', lineHeight:1.5 }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Right login form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <h2 style={{ fontSize:26, fontWeight:700, color:'#111827', letterSpacing:'-0.5px', marginBottom:6 }}>Welcome back</h2>
          <p style={{ fontSize:14, color:'#6b7280', marginBottom:28 }}>Sign in to your AutoFlow dashboard</p>

          {/* Demo credentials */}
          <div style={{ background:'#f0f4ff', borderRadius:10, padding:'12px 14px', marginBottom:20, border:'1px solid rgba(99,102,241,0.15)' }}>
            <p style={{ fontSize:12, fontWeight:600, color:'#4f46e5', marginBottom:8 }}>🎯 Demo Credentials</p>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => fillDemo('admin')} style={{ flex:1, padding:'6px', fontSize:12, fontWeight:500, background:'#4f46e5', color:'#fff', border:'none', borderRadius:7, cursor:'pointer' }}>
                Super Admin
              </button>
              <button onClick={() => fillDemo('owner')} style={{ flex:1, padding:'6px', fontSize:12, fontWeight:500, background:'#fff', color:'#4f46e5', border:'1px solid #a5b4fc', borderRadius:7, cursor:'pointer' }}>
                Business Owner
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@business.com"
                style={{ width:'100%', padding:'11px 14px', fontSize:14, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fff', fontFamily:'inherit', color:'#111' }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:13, fontWeight:600, color:'#374151', display:'block', marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  style={{ width:'100%', padding:'11px 40px 11px 14px', fontSize:14, border:'1.5px solid rgba(99,102,241,0.2)', borderRadius:9, background:'#fff', fontFamily:'inherit', color:'#111' }} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', display:'flex', color:'#9ca3af' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'10px 12px', marginBottom:16, fontSize:13, color:'#dc2626' }}>
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'12px', fontSize:14, fontWeight:600,
              background: loading ? '#a5b4fc' : 'linear-gradient(135deg,#4f46e5,#2563eb)',
              color:'#fff', border:'none', borderRadius:9, cursor: loading ? 'wait' : 'pointer',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow:'0 4px 14px rgba(79,70,229,0.3)',
            }}>
              {loading ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:12.5, color:'#9ca3af', marginTop:24 }}>
            New client? Contact <a href="mailto:admin@autoflow.ai" style={{ color:'#4f46e5', textDecoration:'none', fontWeight:500 }}>admin@autoflow.ai</a> for access.
          </p>
        </div>
      </div>
    </div>
  );
}
