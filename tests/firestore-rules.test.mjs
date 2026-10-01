import { after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc
} from 'firebase/firestore';

const projectId = 'demo-raqeeb-rules';
const testEnvironment = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8')
  }
});

beforeEach(async () => {
  await testEnvironment.clearFirestore();
});

after(async () => {
  await testEnvironment.cleanup();
});

function sessionData(userId, expiresAt = Timestamp.fromDate(new Date(Date.now() + 60_000))) {
  return {
    userId,
    pairingCode: 'RQ-123456',
    expiresAt
  };
}

const deviceId = 'android-device-1';
const devicePath = `users/owner-a/phonelinkDevices/${deviceId}`;

function deviceData(ownerUid = 'owner-a', id = deviceId) {
  return {
    ownerUid,
    deviceId: id,
    deviceName: 'Android phone',
    platform: 'android',
    createdAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    appVersion: '1.0.0'
  };
}

function commandData(commandId, overrides = {}) {
  return {
    ownerUid: 'owner-a',
    deviceId,
    commandId,
    action: 'ring',
    payload: { durationSeconds: 15 },
    status: 'pending',
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 60_000)),
    createdByUid: 'owner-a',
    ...overrides
  };
}

test('an authenticated owner can create, read, update, and revoke an active session', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const sessionRef = doc(ownerDb, 'pairingSessions/RQ-123456');

  await assertSucceeds(setDoc(sessionRef, sessionData('owner-a')));
  await assertSucceeds(getDoc(sessionRef));
  await assertSucceeds(updateDoc(sessionRef, { lastSyncTime: 'now' }));
  await assertSucceeds(deleteDoc(sessionRef));
});

test('another authenticated account cannot read, write, or delete an owned session', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const otherDb = testEnvironment.authenticatedContext('owner-b').firestore();
  const ownerRef = doc(ownerDb, 'pairingSessions/RQ-123456');
  const otherRef = doc(otherDb, 'pairingSessions/RQ-123456');

  await assertSucceeds(setDoc(ownerRef, sessionData('owner-a')));
  await assertFails(getDoc(otherRef));
  await assertFails(setDoc(otherRef, sessionData('owner-b'), { merge: true }));
  await assertFails(deleteDoc(otherRef));
  await assertSucceeds(getDoc(ownerRef));
});

test('unauthenticated and guessed non-existent session reads are denied', async () => {
  const unauthenticatedDb = testEnvironment.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(unauthenticatedDb, 'pairingSessions/RQ-999999')));
  await assertFails(setDoc(
    doc(unauthenticatedDb, 'pairingSessions/RQ-999999'),
    sessionData('owner-a')
  ));
});

test('ownership cannot be changed and sessions cannot be extended beyond 30 days', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const sessionRef = doc(ownerDb, 'pairingSessions/RQ-123456');
  await assertSucceeds(setDoc(sessionRef, sessionData('owner-a')));
  await assertFails(updateDoc(sessionRef, { userId: 'owner-b' }));
  await assertSucceeds(updateDoc(sessionRef, {
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  }));
  await assertFails(updateDoc(sessionRef, {
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 31 * 24 * 60 * 60 * 1000))
  }));
  await assertFails(setDoc(
    doc(ownerDb, 'pairingSessions/not-a-pairing-code'),
    sessionData('owner-a')
  ));
  await assertFails(setDoc(
    doc(ownerDb, 'pairingSessions/RQ-654321'),
    sessionData('owner-a', Timestamp.fromDate(new Date(Date.now() - 1_000)))
  ));
});

test('an owner can revoke an expired session but cannot read or update it', async () => {
  const sessionPath = 'pairingSessions/RQ-123456';
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), sessionPath), sessionData(
      'owner-a',
      Timestamp.fromDate(new Date(Date.now() - 1_000))
    ));
  });

  const ownerRef = doc(testEnvironment.authenticatedContext('owner-a').firestore(), sessionPath);
  await assertFails(getDoc(ownerRef));
  await assertFails(updateDoc(ownerRef, { lastSyncTime: 'now' }));
  await assertSucceeds(deleteDoc(ownerRef));
});

test('an owner can register and read an owner-bound Android device', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const deviceRef = doc(ownerDb, devicePath);

  await assertSucceeds(setDoc(deviceRef, deviceData()));
  await assertSucceeds(getDoc(deviceRef));
  await assertFails(deleteDoc(deviceRef));
});

test('device registration schema is strict and the owner UID cannot be changed', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const deviceRef = doc(ownerDb, devicePath);

  await assertFails(setDoc(deviceRef, { ...deviceData(), extra: 'not allowed' }));
  await assertSucceeds(setDoc(deviceRef, deviceData()));
  await assertFails(updateDoc(deviceRef, { ownerUid: 'owner-b' }));
  await assertFails(updateDoc(deviceRef, { platform: 'windows' }));
});

test('another account cannot read or write an owner device or its command', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const otherDb = testEnvironment.authenticatedContext('owner-b').firestore();
  const deviceRef = doc(ownerDb, devicePath);
  const otherDeviceRef = doc(otherDb, devicePath);
  const commandRef = doc(ownerDb, `${devicePath}/commands/cross-user-command`);

  await assertSucceeds(setDoc(deviceRef, deviceData()));
  await assertFails(getDoc(otherDeviceRef));
  await assertFails(setDoc(otherDeviceRef, deviceData('owner-b')));
  await assertSucceeds(setDoc(commandRef, commandData('cross-user-command')));
  await assertFails(getDoc(doc(otherDb, `${devicePath}/commands/cross-user-command`)));
  await assertFails(updateDoc(
    doc(otherDb, `${devicePath}/commands/cross-user-command`),
    { status: 'acknowledged', ackAt: serverTimestamp(), result: 'accepted' }
  ));
});

test('an owner can create a well-formed command with a bounded expiry', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const deviceRef = doc(ownerDb, devicePath);
  const commandRef = doc(ownerDb, `${devicePath}/commands/valid-command`);

  await assertSucceeds(setDoc(deviceRef, deviceData()));
  await assertSucceeds(setDoc(commandRef, commandData('valid-command')));
});

test('commands cannot be created without a registered owner device', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const commandRef = doc(ownerDb, `${devicePath}/commands/no-device`);
  await assertFails(setDoc(commandRef, commandData('no-device')));
});

test('commands with malformed fields, mismatched IDs, or expired deadlines are denied', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  await assertSucceeds(setDoc(doc(ownerDb, devicePath), deviceData()));
  const commands = collection(ownerDb, `${devicePath}/commands`);

  await assertFails(setDoc(doc(commands, 'expired-command'), commandData('expired-command', {
    expiresAt: Timestamp.fromDate(new Date(Date.now() - 1_000))
  })));
  await assertFails(setDoc(doc(commands, 'mismatched-command'), commandData('different-id')));
  await assertFails(setDoc(doc(commands, 'extra-field-command'), commandData('extra-field-command', {
    unexpected: true
  })));
  await assertFails(setDoc(doc(commands, 'bad-payload-command'), commandData('bad-payload-command', {
    payload: { durationSeconds: 999 }
  })));
});

test('a command can be acknowledged once and the ACK cannot be replayed', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const deviceRef = doc(ownerDb, devicePath);
  const commandRef = doc(ownerDb, `${devicePath}/commands/ack-once`);

  await assertSucceeds(setDoc(deviceRef, deviceData()));
  await assertSucceeds(setDoc(commandRef, commandData('ack-once')));
  await assertSucceeds(updateDoc(commandRef, {
    status: 'acknowledged',
    ackAt: serverTimestamp(),
    result: 'accepted'
  }));
  await assertFails(updateDoc(commandRef, {
    status: 'acknowledged',
    ackAt: serverTimestamp(),
    result: 'accepted'
  }));
  await assertFails(updateDoc(commandRef, { ownerUid: 'owner-b' }));
});

test('expired commands cannot be acknowledged', async () => {
  const ownerDb = testEnvironment.authenticatedContext('owner-a').firestore();
  const commandPath = `${devicePath}/commands/expired-before-ack`;
  await assertSucceeds(setDoc(doc(ownerDb, devicePath), deviceData()));
  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), commandPath), {
      ...commandData('expired-before-ack'),
      createdAt: Timestamp.fromDate(new Date(Date.now() - 120_000)),
      expiresAt: Timestamp.fromDate(new Date(Date.now() - 60_000))
    });
  });

  await assertFails(updateDoc(doc(ownerDb, commandPath), {
    status: 'acknowledged',
    ackAt: serverTimestamp(),
    result: 'accepted'
  }));
});
