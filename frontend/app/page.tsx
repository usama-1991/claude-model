'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace(getToken() ? '/dashboard' : '/login'); }, [router]);
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#eef2ff,#f0fdf4)' }}>
      <div style={{ width:32, height:32, border:'3px solid #e0e7ff', borderTop:'3px solid #4f46e5', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
