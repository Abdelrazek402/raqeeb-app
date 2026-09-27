import { after, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';

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
