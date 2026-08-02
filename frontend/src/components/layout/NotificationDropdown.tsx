import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './DropdownPanel.module.css';
import { Bell, Settings, Check, Circle, Film, MessageCircle } from 'lucide-react';
import { notificationService, Notification } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification._id);
      } catch (err) {
        console.error('Failed to mark as read', err);
      }
    }
    
    onClose();
    
    if (notification.type === 'NEW_VIDEO' && notification.video) {
      router.push(`/watch?v=${notification.video._id}`);
    } else if (notification.type === 'COMMENT_REPLY' && notification.video) {
      router.push(`/watch?v=${notification.video._id}`); // Ideally jump to comment, but video for now
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.dropdown}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>
            Notifications {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadCount}</span>}
          </h3>
          <div className={styles.headerActions}>
            <button className={styles.headerAction} title="Mark all as read" onClick={handleMarkAllRead}>
              <Check size={18} />
            </button>
            <button className={styles.headerAction} title="Settings">
              <Settings size={18} />
            </button>
          </div>
        </div>
        
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
            </div>
          ) : notifications.length === 0 ? (
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
          ) : (
            <div className={styles.notificationList}>
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={styles.notificationAvatar}>
                    {notification.sender?.avatarUrl ? (
                      <img src={notification.sender.avatarUrl} alt={notification.sender.username} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>{notification.sender?.username?.charAt(0).toUpperCase()}</div>
                    )}
                    <div className={styles.notificationIconBadge}>
                      {notification.type === 'NEW_VIDEO' ? <Film size={10} /> : <MessageCircle size={10} />}
                    </div>
                  </div>
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationText}>
                      <span className={styles.senderName}>{notification.sender?.channelName || notification.sender?.username}</span>
                      {notification.type === 'NEW_VIDEO' 
                        ? ` uploaded a new video: ${notification.video?.title}`
                        : ` replied to your comment: "${notification.comment?.text}"`
                      }
                    </p>
                    <span className={styles.timeAgo}>
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className={styles.unreadDot}><Circle size={10} fill="currentColor" /></div>
                  )}
                  {notification.type === 'NEW_VIDEO' && notification.video?.thumbnailUrl && (
                    <img src={notification.video.thumbnailUrl} alt="Thumbnail" className={styles.notificationThumb} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
