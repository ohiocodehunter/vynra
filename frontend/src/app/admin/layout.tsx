'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    // Desktop Constraint Check
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);

    // Authentication Check
    if (pathname !== '/admin/login') {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        router.push('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(true);
    }

    return () => window.removeEventListener('resize', checkWidth);
  }, [pathname, router]);

  if (!isDesktop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ color: '#ff3333', marginBottom: '1rem' }}>Desktop Access Only</h1>
        <p>The Admin Portal is highly secure and only accessible via Desktop or Laptop devices.</p>
        <p style={{ marginTop: '0.5rem', color: '#888' }}>(Resolution must be 1024px or higher)</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: '#fff' }}>Loading Secure Portal...</div>;
  }

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff' }}>
      {/* Admin Sidebar */}
      <aside style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ padding: '0 1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/icon.svg" alt="Vynra Admin" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Admin Portal</h2>
        </div>
        
        <Link href="/admin" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: pathname === '/admin' ? 'rgba(255,51,51,0.1)' : 'transparent', color: pathname === '/admin' ? '#ff3333' : '#a0a0b0', textDecoration: 'none', fontWeight: 500 }}>
          Overview
        </Link>
        <Link href="/admin/users" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: pathname === '/admin/users' ? 'rgba(255,51,51,0.1)' : 'transparent', color: pathname === '/admin/users' ? '#ff3333' : '#a0a0b0', textDecoration: 'none', fontWeight: 500 }}>
          Users Manager
        </Link>
        <Link href="/admin/videos" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: pathname === '/admin/videos' ? 'rgba(255,51,51,0.1)' : 'transparent', color: pathname === '/admin/videos' ? '#ff3333' : '#a0a0b0', textDecoration: 'none', fontWeight: 500 }}>
          Videos Manager
        </Link>
        <Link href="/admin/storage" style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: pathname === '/admin/storage' ? 'rgba(255,51,51,0.1)' : 'transparent', color: pathname === '/admin/storage' ? '#ff3333' : '#a0a0b0', textDecoration: 'none', fontWeight: 500 }}>
          Storage & System
        </Link>
        <button 
          onClick={() => { localStorage.removeItem('adminToken'); router.push('/admin/login'); }}
          style={{ marginTop: 'auto', padding: '0.75rem 1rem', borderRadius: '8px', background: 'transparent', border: '1px solid rgba(255,51,51,0.3)', color: '#ff4d4d', cursor: 'pointer' }}
        >
          Secure Logout
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
