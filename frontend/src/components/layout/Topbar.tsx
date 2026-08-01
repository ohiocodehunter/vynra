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
import styles from './Topbar.module.css';

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toggleSidebar } = useSidebar();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/results?q=${encodeURIComponent(searchQuery)}`);
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
            <span className={styles.logoText}>Vynra</span>
          </Link>
        </div>
        
        <div className={styles.center}>
          <form className={styles.searchContainer} onSubmit={handleSearch}>
            <div className={styles.searchBox}>
              <Search size={20} className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search" 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="button" className={styles.micButton}>
              <Mic size={20} />
            </button>
          </form>
        </div>

        <div className={styles.right}>
          <Link href="/studio" className={styles.iconButton} title="Create">
            <Upload size={20} />
          </Link>
          <button className={styles.iconButton}>
            <Bell size={20} />
          </button>
          
          {isAuthenticated ? (
            <div className={styles.profileWrapper}>
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
