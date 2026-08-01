'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Settings, Globe, Video, User, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import styles from './ProfileDropdown.module.css';

interface ProfileDropdownProps {
  onClose: () => void;
  onOpenCreateChannel: () => void;
}

export default function ProfileDropdown({ onClose, onOpenCreateChannel }: ProfileDropdownProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dropdown} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.avatarLarge}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <User size={24} />
            )}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{user?.username || 'User'}</p>
            <p className={styles.userEmail}>{user?.email || ''}</p>
          </div>
        </div>

        <div className={styles.divider} />

        <ul className={styles.menuList}>
          {user ? (
            <>
              <Link href={`/channel/${user.username}`} style={{ textDecoration: 'none', color: 'inherit' }} onClick={onClose}>
                <li className={styles.menuItem}>
                  <User size={18} className={styles.menuIcon} />
                  <span>Your channel</span>
                </li>
              </Link>
              <Link href="/studio" style={{ textDecoration: 'none', color: 'inherit' }} target="_blank" onClick={onClose}>
                <li className={styles.menuItem}>
                  <MonitorPlay size={18} className={styles.menuIcon} />
                  <span>Vynra Studio</span>
                </li>
              </Link>
              <Link href="/studio/settings" style={{ textDecoration: 'none', color: 'inherit' }} target="_blank" onClick={onClose}>
                <li className={styles.menuItem}>
                  <Settings size={18} className={styles.menuIcon} />
                  <span>Settings</span>
                </li>
              </Link>
            </>
          ) : (
            <li className={styles.menuItem} onClick={() => { onClose(); onOpenCreateChannel(); }}>
              <User size={18} className={styles.menuIcon} />
              <span>Create Channel</span>
            </li>
          )}
          <li className={styles.menuItem}>
            <Globe size={18} className={styles.menuIcon} />
            <span>Language: English</span>
          </li>
        </ul>

        <div className={styles.divider} />

        <ul className={styles.menuList}>
          <li className={`${styles.menuItem} ${styles.logoutItem}`} onClick={handleLogout}>
            <LogOut size={18} className={styles.menuIcon} />
            <span>Sign out</span>
          </li>
        </ul>
      </div>
    </>
  );
}
