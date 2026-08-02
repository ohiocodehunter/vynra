'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { userService } from '@/lib/api';

interface SubscribeButtonProps {
  channelId: string;
  initialSubscribersCount?: number;
  className?: string;
  subscribedClassName?: string;
}

export default function SubscribeButton({ 
  channelId, 
  initialSubscribersCount = 0,
  className = 'btn-primary',
  subscribedClassName = ''
}: SubscribeButtonProps) {
  const { user: currentUser } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (currentUser && currentUser.subscriptions) {
        setIsSubscribed(currentUser.subscriptions.includes(channelId));
      } else if (currentUser) {
        try {
          const meRes = await fetch(`${(typeof window !== 'undefined' ? '/api' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'))}/users/me`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            setIsSubscribed(meData.subscriptions?.includes(channelId) || false);
          }
        } catch (error) {
          console.error('Error fetching user data', error);
        }
      }
    };
    if (channelId) checkSubscription();
  }, [currentUser, channelId]);

  const handleSubscribeToggle = async () => {
    if (!currentUser) return; 
    setIsSubscribing(true);
    try {
      if (isSubscribed) {
        await userService.unsubscribeFromChannel(channelId);
        setIsSubscribed(false);
      } else {
        await userService.subscribeToChannel(channelId);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error('Failed to toggle subscription', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!currentUser) {
    return (
      <button 
        className={className} 
        onClick={() => alert("Please sign in to subscribe")}
      >
        Subscribe
      </button>
    );
  }

  // If the user is viewing their own channel, don't show the subscribe button
  if (currentUser.id === channelId) {
    return null;
  }

  return (
    <button 
      className={`${className} ${isSubscribed ? subscribedClassName : ''}`}
      onClick={handleSubscribeToggle}
      disabled={isSubscribing}
      style={isSubscribed ? { backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' } : {}}
    >
      {isSubscribed ? 'Subscribed' : 'Subscribe'}
    </button>
  );
}
