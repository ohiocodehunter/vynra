'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { studioService } from '@/lib/api';

export default function StudioFeedback() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      await studioService.sendFeedback({ subject, message });
      setSuccess(true);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Send Feedback</h1>
      
      <div className={styles.content}>
        <div className={styles.headerInfo}>
          <div className={styles.iconWrapper}>
            <Send size={32} color="var(--accent-primary)" />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>We want to hear from you</h2>
            <p className={styles.subtitle}>
              Your feedback goes directly to our admin team. Let us know how we can improve Vynra Studio for you.
            </p>
          </div>
        </div>

        {success ? (
          <div className={styles.successMessage}>
            <CheckCircle2 size={48} color="#10B981" className={styles.successIcon} />
            <h3 className={styles.successTitle}>Feedback Sent!</h3>
            <p className={styles.successDesc}>Thank you for helping us improve Vynra. Our team will review your message shortly.</p>
            <button className={styles.resetBtn} onClick={() => setSuccess(false)}>
              Send another message
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            {error && (
              <div className={styles.errorAlert}>
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="subject" className={styles.label}>Subject</label>
              <input
                id="subject"
                type="text"
                className={styles.input}
                placeholder="What is your feedback about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
                disabled={loading}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="message" className={styles.label}>Message</label>
              <textarea
                id="message"
                className={styles.textarea}
                placeholder="Please provide as much detail as possible..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                disabled={loading}
              ></textarea>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={loading || !subject.trim() || !message.trim()}
              >
                {loading ? 'Sending...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
