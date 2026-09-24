import { useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../utils/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useCloudSync(
  dailyStats: any,
  setDailyStats: any,
  monitoredApps: any,
  setMonitoredApps: any,
  blockedAttempts: any,
  setBlockedAttempts: any,
  protectionLevel: any,
  setProtectionLevel: any,
  customBlockedDomains: any,
  setCustomBlockedDomains: any,
  prayers: any,
  setPrayers: any
) {
  const { user } = useAuth();

  // Load from cloud on mount
  useEffect(() => {
    if (!user || !db) return;
    
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.dailyStats && data.updatedBy !== 'local') setDailyStats(data.dailyStats);
        if (data.monitoredApps && data.updatedBy !== 'local') setMonitoredApps(data.monitoredApps);
        if (data.blockedAttempts && data.updatedBy !== 'local') setBlockedAttempts(data.blockedAttempts);
        if (data.protectionLevel && data.updatedBy !== 'local') setProtectionLevel(data.protectionLevel);
        if (data.customBlockedDomains && data.updatedBy !== 'local') setCustomBlockedDomains(data.customBlockedDomains);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Save to cloud on change (debounced)
  useEffect(() => {
    if (!user || !db) return;
    
    const timer = setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, sanitizeForFirestore({
          dailyStats,
          monitoredApps,
          blockedAttempts,
          protectionLevel,
          customBlockedDomains,
          updatedBy: 'local',
          lastSync: new Date().toISOString()
        }), { merge: true });
      } catch (err) {
        console.error("Cloud sync save error:", err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, dailyStats, monitoredApps, blockedAttempts, protectionLevel, customBlockedDomains]);
}
