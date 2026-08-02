import React from 'react';
import styles from './DropdownPanel.module.css';
import { Bell, Settings } from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Notifications</h3>
          <button className={styles.headerAction} title="Notification settings">
            <Settings size={18} />
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Bell size={32} />
            </div>
            <div>
              <h4 className={styles.emptyTitle}>You're all caught up!</h4>
              <p className={styles.emptyDesc}>
                When you get notifications about your channel or videos you subscribe to, they'll show up here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
