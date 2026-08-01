import React from 'react';
import styles from './page.module.css';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className={styles.adminDashboard}>
      {/* Top Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Users</div>
          <div className={styles.statValue}>125,430</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUp size={16} /> +14.2%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Videos</div>
          <div className={styles.statValue}>8,748</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUp size={16} /> +11.6%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Views</div>
          <div className={styles.statValue}>24.5M</div>
          <div className={`${styles.statChange} ${styles.positive}`}>
            <ArrowUp size={16} /> +16.3%
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Reports</div>
          <div className={styles.statValue}>324</div>
          <div className={`${styles.statChange} ${styles.negative}`}>
            <ArrowDown size={16} /> -2.4%
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Users Table */}
        <div className={styles.usersPanel}>
          <div className={styles.panelHeader}>
            <h3 className={styles.panelTitle}>Users</h3>
            <button className={styles.viewAllBtn}>View All Users &gt;</button>
          </div>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Videos</th>
                <th>Subscribers</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.cellAvatar}></div>
                    Arjun Dev
                  </div>
                </td>
                <td>arjun@example.com</td>
                <td>24</td>
                <td>482K</td>
                <td>May 10, 2023</td>
              </tr>
              <tr>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.cellAvatar}></div>
                    Sarah Johnson
                  </div>
                </td>
                <td>sarah@example.com</td>
                <td>18</td>
                <td>231K</td>
                <td>Jun 15, 2023</td>
              </tr>
              <tr>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.cellAvatar}></div>
                    Mike Chen
                  </div>
                </td>
                <td>mike@example.com</td>
                <td>32</td>
                <td>156K</td>
                <td>Jul 22, 2023</td>
              </tr>
              <tr>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.cellAvatar}></div>
                    Emily Davis
                  </div>
                </td>
                <td>emily@example.com</td>
                <td>15</td>
                <td>98K</td>
                <td>Aug 5, 2023</td>
              </tr>
              <tr>
                <td>
                  <div className={styles.userCell}>
                    <div className={styles.cellAvatar}></div>
                    David Lee
                  </div>
                </td>
                <td>david@example.com</td>
                <td>27</td>
                <td>76K</td>
                <td>Sep 12, 2023</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.sideGrid}>
          {/* Reports Chart */}
          <div className={styles.reportsPanel}>
            <h3 className={styles.panelTitle}>Reports</h3>
            <div className={styles.donutChartContainer}>
              <div className={styles.donutPlaceholder}>
                <div className={styles.donutInner}>
                  <div className={styles.donutValue}>324</div>
                  <div className={styles.donutLabel}>Total</div>
                </div>
              </div>
            </div>
            <div className={styles.legendList}>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#fca5a5' }}></div>
                <div className={styles.legendName}>Pending</div>
                <div className={styles.legendValue}>120</div>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#60a5fa' }}></div>
                <div className={styles.legendName}>Reviewed</div>
                <div className={styles.legendValue}>150</div>
              </div>
              <div className={styles.legendItem}>
                <div className={styles.legendColor} style={{ backgroundColor: '#34d399' }}></div>
                <div className={styles.legendName}>Resolved</div>
                <div className={styles.legendValue}>54</div>
              </div>
            </div>
          </div>

          {/* Storage Panel */}
          <div className={styles.storagePanel}>
            <div className={styles.storageHeader}>
              <h3 className={styles.panelTitle}>Storage</h3>
              <div className={styles.storageValue}>2.45 TB / 5 TB Used</div>
            </div>
            <div className={styles.storageBarContainer}>
              <div className={styles.storageBar} style={{ width: '49%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
