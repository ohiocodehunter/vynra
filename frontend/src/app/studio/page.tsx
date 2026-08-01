import React from 'react';
import styles from './page.module.css';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function StudioDashboard() {
  return (
    <div className={styles.studioDashboard}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.dateRange}>
          <span className={styles.dateText}>May 12 - Jun 12, 2024</span>
          <span className={styles.dateSubtext}>Last 30 days</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Views</div>
          <div className={styles.statValue}>1.2M</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUp size={16} /> +18.4%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Watch Time (hours)</div>
          <div className={styles.statValue}>45.6K</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUp size={16} /> +12.4%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Subscribers</div>
          <div className={styles.statValue}>+8.3K</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUp size={16} /> +33.9%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Revenue</div>
          <div className={styles.statValue}>$12.4K</div>
          <div className={`${styles.statChange} ${styles.negative}`}>
            <ArrowDown size={16} /> -5.2%
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Main Chart Panel */}
        <div className={styles.chartPanel}>
          <div className={styles.chartHeader}>
            <div className={styles.chartMetric}>
              <div className={styles.metricLabel}>Views</div>
              <div className={styles.metricValue}>1,234,567</div>
            </div>
          </div>
          <div className={styles.chartContainer}>
            {/* Simple CSS placeholder for a line chart */}
            <svg viewBox="0 0 500 100" className={styles.lineChart}>
              <path d="M0,80 Q20,90 40,70 T80,50 T120,60 T160,20 T200,40 T240,10 T280,30 T320,60 T360,40 T400,20 T440,50 T480,10 L500,20" 
                    fill="none" stroke="#6C63FF" strokeWidth="3" />
              <circle cx="0" cy="80" r="4" fill="#6C63FF" />
              <circle cx="40" cy="70" r="4" fill="#6C63FF" />
              <circle cx="80" cy="50" r="4" fill="#6C63FF" />
              <circle cx="120" cy="60" r="4" fill="#6C63FF" />
              <circle cx="160" cy="20" r="4" fill="#6C63FF" />
              <circle cx="200" cy="40" r="4" fill="#6C63FF" />
              <circle cx="240" cy="10" r="4" fill="#6C63FF" />
              <circle cx="280" cy="30" r="4" fill="#6C63FF" />
              <circle cx="320" cy="60" r="4" fill="#6C63FF" />
              <circle cx="360" cy="40" r="4" fill="#6C63FF" />
              <circle cx="400" cy="20" r="4" fill="#6C63FF" />
              <circle cx="440" cy="50" r="4" fill="#6C63FF" />
              <circle cx="480" cy="10" r="4" fill="#6C63FF" />
            </svg>
            <div className={styles.chartLabels}>
              <span>May 12</span>
              <span>May 19</span>
              <span>May 26</span>
              <span>Jun 2</span>
              <span>Jun 9</span>
            </div>
          </div>
        </div>

        {/* Top Videos Sidebar */}
        <div className={styles.topVideosPanel}>
          <h3 className={styles.panelTitle}>Top Videos</h3>
          <div className={styles.topVideoList}>
            <div className={styles.topVideoItem}>
              <div className={styles.topVideoThumb} style={{ background: '#4e4376' }}></div>
              <div className={styles.topVideoInfo}>
                <div className={styles.topVideoTitle}>Build a Full Stack App...</div>
                <div className={styles.topVideoViews}>234K</div>
              </div>
            </div>
            <div className={styles.topVideoItem}>
              <div className={styles.topVideoThumb} style={{ background: '#fecfef' }}></div>
              <div className={styles.topVideoInfo}>
                <div className={styles.topVideoTitle}>Advanced Figma Anim...</div>
                <div className={styles.topVideoViews}>182K</div>
              </div>
            </div>
            <div className={styles.topVideoItem}>
              <div className={styles.topVideoThumb} style={{ background: '#84fab0' }}></div>
              <div className={styles.topVideoInfo}>
                <div className={styles.topVideoTitle}>AI Productivity Master...</div>
                <div className={styles.topVideoViews}>125K</div>
              </div>
            </div>
            <div className={styles.topVideoItem}>
              <div className={styles.topVideoThumb} style={{ background: '#182848' }}></div>
              <div className={styles.topVideoInfo}>
                <div className={styles.topVideoTitle}>Cinematic Travel Film</div>
                <div className={styles.topVideoViews}>98K</div>
              </div>
            </div>
            <div className={styles.topVideoItem}>
              <div className={styles.topVideoThumb} style={{ background: '#1e3c72' }}></div>
              <div className={styles.topVideoInfo}>
                <div className={styles.topVideoTitle}>Mastering TypeScript</div>
                <div className={styles.topVideoViews}>87K</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
