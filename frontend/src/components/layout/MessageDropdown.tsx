import React from 'react';
import styles from './DropdownPanel.module.css';
import { MessageSquare, Plus } from 'lucide-react';

interface MessageDropdownProps {
  onClose: () => void;
}

export default function MessageDropdown({ onClose }: MessageDropdownProps) {
  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Messages</h3>
          <button className={styles.headerAction} title="New message">
            <Plus size={18} />
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <MessageSquare size={32} />
            </div>
            <div>
              <h4 className={styles.emptyTitle}>No messages yet</h4>
              <p className={styles.emptyDesc}>
                Connect with other creators or your favorite channels. Direct messages will appear here.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.footerLink}>View Message Requests</button>
        </div>
      </div>
    </>
  );
}
