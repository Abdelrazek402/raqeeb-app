import { useEffect, useState, useRef, useCallback, type Dispatch, type SetStateAction } from 'react';
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, sanitizeForFirestore } from '../utils/firebase';
import { DeviceSyncHubState, PhoneLinkNotification, DeviceInfo, DailyStats, PrayerInfo, BlockedAttempt } from '../types';
import { sounds } from '../utils/audio';
import { getOrCreateDeviceId, detectDevicePlatform, getDeviceFriendlyName, generateDynamicPairingCode } from '../utils/deviceIdentity';

export type ActiveDeviceType = 'windows' | 'android';

export interface FirebaseSyncEngine {
  isCloudConnected: boolean;
  currentDeviceType: ActiveDeviceType;
  setCurrentDeviceType: (type: ActiveDeviceType) => void;
  localDeviceId: string;
  localDeviceName: string;
  isPhoneRinging: boolean;
  incomingClipboard: { text: string; sender: ActiveDeviceType; timestamp: string } | null;
  pushToCloud: (newState: DeviceSyncHubState) => Promise<void>;
  sendCommand: (command: string, payload?: any) => Promise<void>;
  triggerInstantSync: () => Promise<boolean>;
  joinSession: (newCode: string) => Promise<boolean>;
  regeneratePairingCode: () => Promise<string>;
  dismissRing: () => Promise<void>;
  dismissClipboard: () => void;
}

export function useFirebaseSync(
  syncState: DeviceSyncHubState,
  setSyncState: Dispatch<SetStateAction<DeviceSyncHubState>>,
  dailyStats?: DailyStats,
  prayers?: PrayerInfo[],
  blockedAttempts?: BlockedAttempt[],
  onConfirmPrayerSync?: (prayerId: string) => void
): FirebaseSyncEngine {
  const [localDeviceId] = useState<string>(() => getOrCreateDeviceId());
  const [currentDeviceType, setCurrentDeviceType] = useState<ActiveDeviceType>(() => detectDevicePlatform());
  const [localDeviceName] = useState<string>(() => getDeviceFriendlyName(detectDevicePlatform()));

  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [isPhoneRinging, setIsPhoneRinging] = useState<boolean>(false);
  const [incomingClipboard, setIncomingClipboard] = useState<{
    text: string;
    sender: ActiveDeviceType;
    timestamp: string;
  } | null>(null);

  // Anti-loop ref
  const lastWriteFingerprintRef = useRef<string>('');
  const activeCodeRef = useRef<string>(syncState.pairingCode);
  const currentDeviceTypeRef = useRef<ActiveDeviceType>(currentDeviceType);
  const localDeviceIdRef = useRef<string>(localDeviceId);
  const localDeviceNameRef = useRef<string>(localDeviceName);

  useEffect(() => {
    activeCodeRef.current = syncState.pairingCode;
  }, [syncState.pairingCode]);

  useEffect(() => {
    currentDeviceTypeRef.current = currentDeviceType;
  }, [currentDeviceType]);

  // Audio ring player when isPhoneRinging is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPhoneRinging) {
      sounds.playPhoneRingTone();
      interval = setInterval(() => {
        sounds.playPhoneRingTone();
      }, 1400);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPhoneRinging]);

  // Real Web Battery API Integration
  useEffect(() => {
    let batteryInstance: any = null;

    const setupBattery = async () => {
      if (typeof navigator !== 'undefined' && 'getBattery' in (navigator as any) && db) {
        try {
          batteryInstance = await (navigator as any).getBattery();
          const syncBatteryState = async () => {
            const level = Math.round(batteryInstance.level * 100);
            const charging = Boolean(batteryInstance.charging);
            const code = activeCodeRef.current;
            if (!code) return;

            const sessionRef = doc(db, 'pairingSessions', code);
            await setDoc(sessionRef, sanitizeForFirestore({
              phoneLink: {
                phoneBattery: level,
                isCharging: charging
              },
              updatedAt: serverTimestamp()
            }), { merge: true });
          };

          batteryInstance.addEventListener('levelchange', syncBatteryState);
          batteryInstance.addEventListener('chargingchange', syncBatteryState);
          syncBatteryState();
        } catch (e) {
          // Battery API not permitted or unsupported
        }
      }
    };

    setupBattery();

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener?.('levelchange', () => {});
        batteryInstance.removeEventListener?.('chargingchange', () => {});
      }
    };
  }, [syncState.pairingCode]);

  // Main real-time Firestore synchronization subscription
  useEffect(() => {
    if (!db) return;

    // Detect URL parameter override on first mount
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlPairingCode = urlParams?.get('pairing_code') || urlParams?.get('pair') || urlParams?.get('code');
    
    let activeCode = (urlPairingCode || syncState.pairingCode || generateDynamicPairingCode()).trim().toUpperCase();
    if (!activeCode.startsWith('RQ-')) {
      activeCode = `RQ-${activeCode.replace(/[^A-Za-z0-9_-]/g, '')}`;
    }

    const sessionRef = doc(db, 'pairingSessions', activeCode);

    // Initial check & register this device in Firestore
    const initSession = async () => {
      try {
        const platform = currentDeviceTypeRef.current;
        const devId = localDeviceIdRef.current;
        const devName = localDeviceNameRef.current;

        const currentLocalStats = {
          totalTimeMinutes: (dailyStats?.browserTimeMinutes || 0) + (dailyStats?.socialTimeMinutes || 0),
          socialTimeMinutes: dailyStats?.socialTimeMinutes || 0,
          browserTimeMinutes: dailyStats?.browserTimeMinutes || 0,
          blockedAttemptsCount: blockedAttempts?.length || dailyStats?.blockedAttemptsCount || 0,
          remindersShown: dailyStats?.remindersShown || 0,
          istighfarCount: dailyStats?.istighfarCount || 0,
          confirmedPrayers: dailyStats?.confirmedPrayers || prayers?.filter(p => p.id !== 'sunrise' && p.confirmed).length || 0,
          focusMinutesTotal: dailyStats?.focusMinutesTotal || 0
        };

        const expiresAtDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const initialDoc: any = {
          pairingCode: activeCode,
          token: syncState.token || 'rq_sec_token',
          lastSyncTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          updatedAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiresAtDate)
        };

        if (platform === 'android') {
          initialDoc.androidStatus = 'connected';
          initialDoc.devices = {
            android: {
              id: devId,
              name: devName,
              platform: 'android',
              status: 'connected',
              lastSyncTime: 'الآن (متصل مباشرة)',
              version: 'v1.2.4 (Native PWA/APK)',
              ipAddress: 'شبكة الجوال / Wi-Fi',
              stats: currentLocalStats
            }
          };
          initialDoc.phoneLink = {
            isLinked: true,
            pairingCode: activeCode,
            phoneModel: devName,
            wifiName: 'متصل بالشبكة',
            lastPingSecondsAgo: 0
          };
        } else {
          initialDoc.windowsStatus = 'connected';
          initialDoc.devices = {
            windows: {
              id: devId,
              name: devName,
              platform: 'windows',
              status: 'connected',
              lastSyncTime: 'الآن (متصل مباشرة)',
              version: 'v1.2.4 (Desktop)',
              ipAddress: 'شبكة محلية / إنترنت',
              stats: currentLocalStats
            }
          };
        }

        await setDoc(sessionRef, sanitizeForFirestore(initialDoc), { merge: true });
        setIsCloudConnected(true);
      } catch (err) {
        console.warn('Presence init note:', err);
      }
    };

    initSession();

    // Listen to real-time changes
    const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsCloudConnected(true);
        const data = docSnap.data();
        const currentPlatform = currentDeviceTypeRef.current;

        // 1. Phone Link State & Ringing
        if (data.phoneLink) {
          const isLinked = Boolean(
            (data.androidStatus === 'connected' || data.windowsStatus === 'connected') &&
            data.phoneLink.phoneModel && data.phoneLink.phoneModel !== 'غير مقترن'
          );

          // Only ring if we are on android and ringing command was sent
          const shouldRing = Boolean(data.phoneLink.isRinging && currentPlatform === 'android');
          setIsPhoneRinging(shouldRing);

          // Shared Clipboard from OTHER device
          if (
            data.phoneLink.sharedClipboard &&
            data.phoneLink.clipboardSender &&
            data.phoneLink.clipboardSender !== currentPlatform &&
            data.phoneLink.lastClipboardSync
          ) {
            const elapsed = Date.now() - new Date(data.phoneLink.lastClipboardSync).getTime();
            if (elapsed < 15000) {
              setIncomingClipboard({
                text: data.phoneLink.sharedClipboard,
                sender: data.phoneLink.clipboardSender,
                timestamp: data.phoneLink.lastClipboardSync
              });
              sounds.playClipboardTone();
            }
          }
        }

        // 2. Merge snapshot into local state
        setSyncState(prev => {
          const newFingerprint = JSON.stringify({
            code: activeCode,
            winStatus: data.windowsStatus,
            andStatus: data.androidStatus,
            ring: data.phoneLink?.isRinging,
            clip: data.phoneLink?.sharedClipboard,
            focus: data.phoneLink?.focusShieldActive,
            andStats: data.devices?.android?.stats,
            winStats: data.devices?.windows?.stats
          });

          if (lastWriteFingerprintRef.current === newFingerprint) {
            return prev;
          }

          const remoteWin = data.devices?.windows;
          const remoteAnd = data.devices?.android;

          const isAndConnected = data.androidStatus === 'connected' || Boolean(remoteAnd && remoteAnd.status === 'connected');
          const isWinConnected = data.windowsStatus === 'connected' || Boolean(remoteWin && remoteWin.status === 'connected');

          const updatedWin: DeviceInfo = {
            id: remoteWin?.id || prev.devices.windows.id,
            name: remoteWin?.name || prev.devices.windows.name,
            platform: 'windows',
            status: isWinConnected ? 'connected' : 'disconnected',
            lastSyncTime: isWinConnected ? 'الآن (متصل مباشرة)' : (remoteWin?.lastSyncTime || 'غير متصل'),
            version: remoteWin?.version || 'v1.2.4 (Desktop)',
            ipAddress: remoteWin?.ipAddress || 'متصل',
            batteryLevel: remoteWin?.batteryLevel,
            isCharging: remoteWin?.isCharging,
            stats: {
              totalTimeMinutes: remoteWin?.stats?.totalTimeMinutes ?? prev.devices.windows.stats.totalTimeMinutes,
              socialTimeMinutes: remoteWin?.stats?.socialTimeMinutes ?? prev.devices.windows.stats.socialTimeMinutes,
              browserTimeMinutes: remoteWin?.stats?.browserTimeMinutes ?? prev.devices.windows.stats.browserTimeMinutes,
              blockedAttemptsCount: remoteWin?.stats?.blockedAttemptsCount ?? prev.devices.windows.stats.blockedAttemptsCount,
              remindersShown: remoteWin?.stats?.remindersShown ?? prev.devices.windows.stats.remindersShown,
              istighfarCount: remoteWin?.stats?.istighfarCount ?? prev.devices.windows.stats.istighfarCount,
              confirmedPrayers: remoteWin?.stats?.confirmedPrayers ?? prev.devices.windows.stats.confirmedPrayers,
              focusMinutesTotal: remoteWin?.stats?.focusMinutesTotal ?? prev.devices.windows.stats.focusMinutesTotal
            }
          };

          const updatedAnd: DeviceInfo = {
            id: remoteAnd?.id || prev.devices.android.id,
            name: remoteAnd?.name || data.phoneLink?.phoneModel || 'هاتف أندرويد',
            platform: 'android',
            status: isAndConnected ? 'connected' : 'disconnected',
            lastSyncTime: isAndConnected ? 'الآن (متصل مباشرة)' : (remoteAnd?.lastSyncTime || 'غير مربوط بعد'),
            version: remoteAnd?.version || 'v1.2.4 (Native PWA/APK)',
            ipAddress: remoteAnd?.ipAddress || 'شبكة الجوال',
            batteryLevel: data.phoneLink?.phoneBattery ?? remoteAnd?.batteryLevel,
            isCharging: data.phoneLink?.isCharging ?? remoteAnd?.isCharging,
            stats: {
              totalTimeMinutes: remoteAnd?.stats?.totalTimeMinutes ?? prev.devices.android.stats.totalTimeMinutes,
              socialTimeMinutes: remoteAnd?.stats?.socialTimeMinutes ?? prev.devices.android.stats.socialTimeMinutes,
              browserTimeMinutes: remoteAnd?.stats?.browserTimeMinutes ?? prev.devices.android.stats.browserTimeMinutes,
              blockedAttemptsCount: remoteAnd?.stats?.blockedAttemptsCount ?? prev.devices.android.stats.blockedAttemptsCount,
              remindersShown: remoteAnd?.stats?.remindersShown ?? prev.devices.android.stats.remindersShown,
              istighfarCount: remoteAnd?.stats?.istighfarCount ?? prev.devices.android.stats.istighfarCount,
              confirmedPrayers: remoteAnd?.stats?.confirmedPrayers ?? prev.devices.android.stats.confirmedPrayers,
              focusMinutesTotal: remoteAnd?.stats?.focusMinutesTotal ?? prev.devices.android.stats.focusMinutesTotal
            }
          };

          let updatedPhoneLink = { ...prev.phoneLink };
          if (data.phoneLink) {
            updatedPhoneLink = {
              ...updatedPhoneLink,
              ...data.phoneLink,
              isLinked: isAndConnected,
              pairingCode: activeCode,
              phoneModel: remoteAnd?.name || data.phoneLink.phoneModel || 'هاتف أندرويد'
            };
          }

          return {
            ...prev,
            pairingCode: activeCode,
            lastFullSync: 'متزامن سحابياً الآن (Live Cloud Sync)',
            phoneLink: updatedPhoneLink,
            devices: {
              windows: updatedWin,
              android: updatedAnd
            }
          };
        });
      }
    }, (err) => {
      console.warn('Firestore snapshot error:', err);
      setIsCloudConnected(false);
    });

    // Heartbeat & Stats Broadcast every 15 seconds
    const heartbeat = setInterval(async () => {
      try {
        const platform = currentDeviceTypeRef.current;
        const devId = localDeviceIdRef.current;
        const devName = localDeviceNameRef.current;

        const currentLocalStats = {
          totalTimeMinutes: (dailyStats?.browserTimeMinutes || 0) + (dailyStats?.socialTimeMinutes || 0),
          socialTimeMinutes: dailyStats?.socialTimeMinutes || 0,
          browserTimeMinutes: dailyStats?.browserTimeMinutes || 0,
          blockedAttemptsCount: blockedAttempts?.length || dailyStats?.blockedAttemptsCount || 0,
          remindersShown: dailyStats?.remindersShown || 0,
          istighfarCount: dailyStats?.istighfarCount || 0,
          confirmedPrayers: dailyStats?.confirmedPrayers || prayers?.filter(p => p.id !== 'sunrise' && p.confirmed).length || 0,
          focusMinutesTotal: dailyStats?.focusMinutesTotal || 0
        };

        const updatePayload: any = {
          pairingCode: activeCode,
          updatedAt: serverTimestamp(),
          lastSyncTime: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        if (platform === 'android') {
          updatePayload.androidStatus = 'connected';
          updatePayload[`devices.android`] = {
            id: devId,
            name: devName,
            platform: 'android',
            status: 'connected',
            lastSyncTime: 'الآن (متصل مباشرة)',
            version: 'v1.2.4 (Native PWA/APK)',
            stats: currentLocalStats
          };
        } else {
          updatePayload.windowsStatus = 'connected';
          updatePayload[`devices.windows`] = {
            id: devId,
            name: devName,
            platform: 'windows',
            status: 'connected',
            lastSyncTime: 'الآن (متصل مباشرة)',
            version: 'v1.2.4 (Desktop)',
            stats: currentLocalStats
          };
        }

        await setDoc(sessionRef, sanitizeForFirestore(updatePayload), { merge: true });
        setIsCloudConnected(true);
      } catch (err) {
        // network hiccup
      }
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(heartbeat);
    };
  }, [syncState.pairingCode, dailyStats, prayers, blockedAttempts, setSyncState]);

  // Push full sync state to Firestore
  const pushToCloud = useCallback(async (newState: DeviceSyncHubState) => {
    if (!db) return;
    try {
      const code = newState.pairingCode.trim().toUpperCase();
      const sessionRef = doc(db, 'pairingSessions', code);
      const platform = currentDeviceTypeRef.current;
      
      const payload: any = {
        pairingCode: code,
        token: newState.token || 'rq_sec_cloud',
        phoneLink: newState.phoneLink,
        devices: newState.devices,
        lastSyncTime: 'الآن (متزامن سحابياً)',
        updatedAt: serverTimestamp()
      };

      if (platform === 'android') {
        payload.androidStatus = 'connected';
      } else {
        payload.windowsStatus = 'connected';
      }

      lastWriteFingerprintRef.current = JSON.stringify({
        code,
        winStatus: payload.windowsStatus,
        andStatus: payload.androidStatus,
        ring: newState.phoneLink?.isRinging,
        clip: newState.phoneLink?.sharedClipboard,
        focus: newState.phoneLink?.focusShieldActive,
        andStats: newState.devices?.android?.stats,
        winStats: newState.devices?.windows?.stats
      });

      await setDoc(sessionRef, sanitizeForFirestore(payload), { merge: true });
      setIsCloudConnected(true);
    } catch (e) {
      console.error('Failed to push to Firebase:', e);
      setIsCloudConnected(false);
    }
  }, []);

  // Send direct command across devices (Ring, Stop Ring, Clipboard, Prayer, Shield)
  const sendCommand = useCallback(async (command: string, payload?: any) => {
    if (!db) return;
    const code = activeCodeRef.current;
    const sessionRef = doc(db, 'pairingSessions', code);
    const sender = currentDeviceTypeRef.current;

    try {
      let snap;
      try {
        snap = await getDoc(sessionRef);
      } catch (e) {
        console.warn("getDoc fallback", e);
      }
      const currentDocData = (snap && snap.exists()) ? snap.data() : {};
      const currentPhoneLink = currentDocData.phoneLink || syncState.phoneLink;
      const currentNotifs = currentPhoneLink.notifications || [];

      let updatedPhoneLink = { ...currentPhoneLink };

      if (command === 'ring_phone') {
        updatedPhoneLink.isRinging = true;
        const newNotif: PhoneLinkNotification = {
          id: `ring_${Date.now()}`,
          title: '🔔 تنبيه رنين مباشر',
          body: 'طلب الحاسوب رنين الهاتف لمساعدتك في العثور عليه.',
          source: 'windows',
          type: 'ring',
          timestamp: new Date().toISOString(),
          read: false
        };
        updatedPhoneLink.notifications = [newNotif, ...currentNotifs].slice(0, 30);
      } else if (command === 'stop_ring') {
        updatedPhoneLink.isRinging = false;
      } else if (command === 'toggle_focus_shield') {
        updatedPhoneLink.focusShieldActive = Boolean(payload?.active);
        const newNotif: PhoneLinkNotification = {
          id: `focus_${Date.now()}`,
          title: payload?.active ? '🛡️ تفعيل درع التركيز' : '🔓 فك قفل درع التركيز',
          body: payload?.active ? 'تم تفعيل قفل التشتيت على الأجهزة المشتركة.' : 'تم فك حظر تطبيقات التشتيت.',
          source: sender,
          type: 'focus',
          timestamp: new Date().toISOString(),
          read: false
        };
        updatedPhoneLink.notifications = [newNotif, ...currentNotifs].slice(0, 30);
      } else if (command === 'send_clipboard') {
        updatedPhoneLink.sharedClipboard = payload?.text || '';
        updatedPhoneLink.clipboardSender = sender;
        updatedPhoneLink.lastClipboardSync = new Date().toISOString();
        const newNotif: PhoneLinkNotification = {
          id: `clip_${Date.now()}`,
          title: '📋 نص جديد في الحافظة المشتركة',
          body: payload?.text ? `نص مستلم: "${String(payload.text).slice(0, 40)}..."` : 'تمت مشاركة نص جديد.',
          source: sender,
          type: 'clipboard',
          timestamp: new Date().toISOString(),
          read: false
        };
        updatedPhoneLink.notifications = [newNotif, ...currentNotifs].slice(0, 30);
      } else if (command === 'confirm_prayer') {
        const prayerName = payload?.prayerName || 'الصلاة';
        const newNotif: PhoneLinkNotification = {
          id: `pray_${Date.now()}`,
          title: '🕌 تأكيد أداء الفريضة',
          body: `تم تأكيد أداء صلاة ${prayerName} بنجاح من ${sender === 'android' ? 'الهاتف' : 'الحاسوب'}.`,
          source: sender,
          type: 'prayer',
          timestamp: new Date().toISOString(),
          read: false
        };
        updatedPhoneLink.notifications = [newNotif, ...currentNotifs].slice(0, 30);
        if (onConfirmPrayerSync && payload?.prayerId) {
          onConfirmPrayerSync(payload.prayerId);
        }
      } else if (command === 'sync_battery') {
        updatedPhoneLink.phoneBattery = payload?.level ?? currentPhoneLink.phoneBattery;
        updatedPhoneLink.isCharging = payload?.charging ?? currentPhoneLink.isCharging;
      }

      const updateDocPayload: any = {
        pairingCode: code,
        phoneLink: updatedPhoneLink,
        updatedAt: serverTimestamp(),
        lastSyncTime: 'الآن (متزامن)'
      };

      if (sender === 'android') {
        updateDocPayload.androidStatus = 'connected';
      } else {
        updateDocPayload.windowsStatus = 'connected';
      }

      await setDoc(sessionRef, sanitizeForFirestore(updateDocPayload), { merge: true });

      setSyncState(prev => ({
        ...prev,
        phoneLink: updatedPhoneLink
      }));

      setIsCloudConnected(true);
    } catch (err) {
      console.error('Error dispatching sendCommand to Firestore:', err);
    }
  }, [syncState.phoneLink, onConfirmPrayerSync, setSyncState]);

  // Trigger Instant Sync
  const triggerInstantSync = useCallback(async () => {
    if (!db) return false;
    try {
      const code = activeCodeRef.current;
      const sessionRef = doc(db, 'pairingSessions', code);
      let snap;
      try {
        snap = await getDoc(sessionRef);
      } catch (e) {
        console.warn("getDoc offline fallback", e);
      }
      
      const payload: any = {
        pairingCode: code,
        lastSyncTime: 'الآن (تمت المزامنة الفورية بنجاح)',
        updatedAt: serverTimestamp()
      };

      if (currentDeviceTypeRef.current === 'android') {
        payload.androidStatus = 'connected';
      } else {
        payload.windowsStatus = 'connected';
      }

      await setDoc(sessionRef, sanitizeForFirestore(payload), { merge: true });

      if (snap && snap.exists()) {
        const data = snap.data();
        if (data.phoneLink) {
          setSyncState(prev => ({
            ...prev,
            phoneLink: {
              ...prev.phoneLink,
              ...data.phoneLink
            }
          }));
        }
      }
      setIsCloudConnected(true);
      return true;
    } catch (err) {
      console.warn('Instant sync error:', err);
      return false;
    }
  }, [setSyncState]);

  // Join an existing code manually
  const joinSession = useCallback(async (newCode: string) => {
    if (!db) return false;
    const formatted = newCode.trim().toUpperCase();
    if (!/^RQ-[A-Za-z0-9_\-]{4,32}$/.test(formatted)) {
      return false;
    }

    try {
      const sessionRef = doc(db, 'pairingSessions', formatted);
      const platform = currentDeviceTypeRef.current;
      const devId = localDeviceIdRef.current;
      const devName = localDeviceNameRef.current;

      const updateData: any = {
        pairingCode: formatted,
        updatedAt: serverTimestamp(),
        lastSyncTime: 'الآن (تم الارتباط)'
      };

      if (platform === 'android') {
        updateData.androidStatus = 'connected';
        updateData[`devices.android`] = {
          id: devId,
          name: devName,
          platform: 'android',
          status: 'connected',
          lastSyncTime: 'الآن (متصل)',
          version: 'v1.2.4 (Native PWA/APK)'
        };
      } else {
        updateData.windowsStatus = 'connected';
        updateData[`devices.windows`] = {
          id: devId,
          name: devName,
          platform: 'windows',
          status: 'connected',
          lastSyncTime: 'الآن (متصل)',
          version: 'v1.2.4 (Desktop)'
        };
      }

      await setDoc(sessionRef, sanitizeForFirestore(updateData), { merge: true });

      setSyncState(prev => ({
        ...prev,
        pairingCode: formatted,
        lastFullSync: 'متصل سحابياً بالجلسة الجديدة'
      }));

      setIsCloudConnected(true);
      return true;
    } catch (err) {
      console.error('Error joining session:', err);
      return false;
    }
  }, [setSyncState]);

  // Generate a new fresh pairing code dynamically for this device
  const regeneratePairingCode = useCallback(async () => {
    const freshCode = generateDynamicPairingCode();
    if (db) {
      try {
        const sessionRef = doc(db, 'pairingSessions', freshCode);
        const platform = currentDeviceTypeRef.current;
        const devId = localDeviceIdRef.current;
        const devName = localDeviceNameRef.current;

        const initialDoc: any = {
          pairingCode: freshCode,
          token: `rq_sec_${Math.random().toString(36).substring(2, 10)}`,
          lastSyncTime: 'الآن (جلسة جديدة)',
          updatedAt: serverTimestamp()
        };

        if (platform === 'android') {
          initialDoc.androidStatus = 'connected';
          initialDoc.devices = {
            android: {
              id: devId,
              name: devName,
              platform: 'android',
              status: 'connected',
              lastSyncTime: 'الآن (متصل)',
              version: 'v1.2.4 (Native PWA/APK)'
            }
          };
          initialDoc.phoneLink = {
            isLinked: true,
            pairingCode: freshCode,
            phoneModel: devName,
            wifiName: 'متصل بالشبكة'
          };
        } else {
          initialDoc.windowsStatus = 'connected';
          initialDoc.devices = {
            windows: {
              id: devId,
              name: devName,
              platform: 'windows',
              status: 'connected',
              lastSyncTime: 'الآن (متصل)',
              version: 'v1.2.4 (Desktop)'
            }
          };
        }

        await setDoc(sessionRef, sanitizeForFirestore(initialDoc));
      } catch (e) {
        console.warn('Error creating new session doc:', e);
      }
    }

    setSyncState(prev => ({
      ...prev,
      pairingCode: freshCode,
      lastFullSync: 'تم إنشاء رمز اقتران جديد ونشط'
    }));

    return freshCode;
  }, [setSyncState]);

  // Dismiss ringing
  const dismissRing = useCallback(async () => {
    setIsPhoneRinging(false);
    await sendCommand('stop_ring');
  }, [sendCommand]);

  // Dismiss incoming clipboard toast
  const dismissClipboard = useCallback(() => {
    setIncomingClipboard(null);
  }, []);

  return {
    isCloudConnected,
    currentDeviceType,
    setCurrentDeviceType,
    localDeviceId,
    localDeviceName,
    isPhoneRinging,
    incomingClipboard,
    pushToCloud,
    sendCommand,
    triggerInstantSync,
    joinSession,
    regeneratePairingCode,
    dismissRing,
    dismissClipboard
  };
}
