'use client';

import React, { useEffect, useState } from 'react';
import { adminService } from '@/lib/api';
import { Server, HardDrive, Database, LayoutDashboard, RefreshCw } from 'lucide-react';

interface StorageStats {
  mongodb: {
    dbName: string;
    collections: number;
    objects: number;
    dataSize: number;
    storageSize: number;
    indexes: number;
    indexSize: number;
  };
  cloudflareR2: {
    totalFiles: number;
    storageSize: number;
  };
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function StoragePage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getSystemStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load storage stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return <div style={{ color: '#fff', fontSize: '1.1rem' }}>Analyzing system storage...</div>;
  }

  if (error) {
    return <div style={{ color: '#ff4444', fontSize: '1.1rem' }}>{error}</div>;
  }

  if (!stats) return null;

  // Free Tier Limits
  const R2_QUOTA_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
  const MONGO_QUOTA_BYTES = 512 * 1024 * 1024; // 512 MB

  const r2UsedPercent = Math.min((stats.cloudflareR2.storageSize / R2_QUOTA_BYTES) * 100, 100);
  const mongoUsedPercent = Math.min((stats.mongodb.storageSize / MONGO_QUOTA_BYTES) * 100, 100);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Server style={{ color: '#ff3333' }} /> System Storage
          </h1>
          <p style={{ color: '#888', margin: '8px 0 0 0' }}>Real-time memory and storage analytics</p>
        </div>
        <button 
          onClick={fetchStats}
          disabled={loading}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', 
            borderRadius: '8px', background: 'rgba(255,51,51,0.1)', color: '#ff3333', 
            border: '1px solid rgba(255,51,51,0.2)', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, fontWeight: 600
          }}
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* R2 Card */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '24px', border: '1px solid #222', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(51, 153, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3399ff' }}>
              <HardDrive size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>Cloudflare R2</h2>
              <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Video & Image Assets</p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: '#a0a0b0' }}>Usage (Quota: 10 GB)</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{r2UsedPercent.toFixed(2)}%</span>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#222', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${r2UsedPercent}%`, height: '100%', background: 'linear-gradient(90deg, #3399ff, #0055ff)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem', color: '#666' }}>
              <span>{formatBytes(stats.cloudflareR2.storageSize)} used</span>
              <span>10 GB total</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Total Files</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{stats.cloudflareR2.totalFiles}</p>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Data Size</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{formatBytes(stats.cloudflareR2.storageSize)}</p>
            </div>
          </div>
        </div>

        {/* MongoDB Card */}
        <div style={{ background: '#111', borderRadius: '16px', padding: '24px', border: '1px solid #222', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(0, 237, 100, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ed64' }}>
              <Database size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 600 }}>MongoDB Atlas</h2>
              <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Database & Metadata</p>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
              <span style={{ color: '#a0a0b0' }}>Usage (Quota: 512 MB)</span>
              <span style={{ fontWeight: 600, color: '#fff' }}>{mongoUsedPercent.toFixed(2)}%</span>
            </div>
            <div style={{ width: '100%', height: '12px', background: '#222', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${mongoUsedPercent}%`, height: '100%', background: 'linear-gradient(90deg, #00ed64, #00a344)', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem', color: '#666' }}>
              <span>{formatBytes(stats.mongodb.storageSize)} used</span>
              <span>512 MB total</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Collections</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{stats.mongodb.collections}</p>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Total Objects</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{stats.mongodb.objects}</p>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Data Size</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{formatBytes(stats.mongodb.dataSize)}</p>
            </div>
            <div>
              <p style={{ color: '#888', fontSize: '0.85rem', margin: '0 0 4px 0' }}>Index Size</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{formatBytes(stats.mongodb.indexSize)}</p>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}} />
    </div>
  );
}
