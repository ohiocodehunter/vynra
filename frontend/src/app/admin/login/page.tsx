'use client';

import styles from './page.module.css';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth(); // We can still use AuthContext but store the token

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await adminService.login({ email, password, adminSecret });
      // The backend returns { token, user }
      // Assuming AuthContext handles storing this token and decoding user data:
      localStorage.setItem('adminToken', data.token); // Also store admin token specifically
      login(data.token, data.user); // update the context state
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.brandContainer}>
          <img src="/icon.svg" alt="Vynra Shield" className={styles.logo} />
          <h1>Admin Portal</h1>
          <p>Advanced Security Required</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@vynra.com"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.secretLabel}>
              <span className={styles.lockIcon}>🔒</span> 
              SHA-256 Secret Key
            </label>
            <input 
              type="password" 
              value={adminSecret} 
              onChange={(e) => setAdminSecret(e.target.value)}
              placeholder="Enter Admin Passkey"
              className={styles.secretInput}
              required 
            />
          </div>

          <button type="submit" disabled={loading} className={styles.loginBtn}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
