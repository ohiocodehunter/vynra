import React from 'react';
import styles from './page.module.css';
import HomeFeed from './HomeFeed';

export default function Home() {
  return (
    <div className={styles.homeContainer}>
      <HomeFeed />
    </div>
  );
}
