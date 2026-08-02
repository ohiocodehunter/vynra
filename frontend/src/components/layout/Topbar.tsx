'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Search, Bell, Mic, Upload, LogIn, Menu } from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import AuthModal from '@/components/auth/AuthModal';
import ProfileDropdown from './ProfileDropdown';
import CreateChannelModal from '@/components/channel/CreateChannelModal';
import NotificationDropdown from './NotificationDropdown';
import styles from './Topbar.module.css';

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toggleSidebar } = useSidebar();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/results?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleAuthAction = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <header className={styles.topbar}>
        <div className={styles.left}>
          <button className={styles.menuButton} onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <Link href="/" className={styles.logoContainer}>
            <div className={styles.logoIcon}>
              <img src="/favicon.ico" alt="Vynra" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <span className={styles.logoText}>Vynra</span>
          </Link>
        </div>
        
        <div className={styles.center}>
          <form className={styles.searchContainer} onSubmit={handleSearch}>
            <div className={styles.searchBox}>
              <Search size={20} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search videos, creators, playlists..." 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className={styles.cmdKey}>⌘K</span>
            </div>
            <button type="button" className={styles.micButton}>
              <Mic size={20} />
            </button>
          </form>
        </div>

        <div className={styles.right}>
          <Link href="/studio/upload" className={styles.iconButton} title="Create" target="_blank">
            <Upload size={20} />
          </Link>
          
          <div className={styles.dropdownWrapper} style={{ position: 'relative' }}>
            <button 
              className={styles.iconButton} 
              onClick={() => handleAuthAction(() => setShowNotifications(!showNotifications))}
            >
              <Bell size={20} />
            </button>
            {showNotifications && <NotificationDropdown onClose={() => setShowNotifications(false)} />}
          </div>
          
          {isAuthenticated ? (
            <div className={styles.profileWrapper} style={{ position: 'relative' }}>
              <button 
                className={styles.userProfileBtn} 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className={styles.avatarImg} />
                ) : (
                  <div className={styles.userAvatar}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </button>
              {showProfileDropdown && (
                <ProfileDropdown 
                  onClose={() => setShowProfileDropdown(false)} 
                  onOpenCreateChannel={() => setShowCreateChannelModal(true)}
                />
              )}
            </div>
          ) : (
            <button className={styles.signInBtn} onClick={() => setShowAuthModal(true)}>
              <LogIn size={18} />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showCreateChannelModal && <CreateChannelModal onClose={() => setShowCreateChannelModal(false)} />}
    </>
  );
}
