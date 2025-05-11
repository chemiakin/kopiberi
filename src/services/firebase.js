import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../firebase-config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Включаем офлайн-режим
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

// Функция для повторных попыток
async function retryOperation(operation, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i + 1} failed:`, error);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

// --- Работа с Firestore ---

// Сохранить статистику игрока
export async function saveStats(cardNumber, stats) {
  return retryOperation(async () => {
    await setDoc(doc(db, 'stats', cardNumber), stats);
  });
}

// Загрузить статистику игрока
export async function loadStats(cardNumber) {
  return retryOperation(async () => {
    const ref = doc(db, 'stats', cardNumber);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  });
}

// Сохранить loyaltyCard
export async function saveLoyaltyCard(cardNumber, cardData) {
  return retryOperation(async () => {
    await setDoc(doc(db, 'loyaltyCards', cardNumber), cardData);
  });
}

// Загрузить loyaltyCard
export async function loadLoyaltyCard(cardNumber) {
  return retryOperation(async () => {
    const ref = doc(db, 'loyaltyCards', cardNumber);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  });
}

// Сохранить достижения
export async function saveAchievements(cardNumber, achievements) {
  return retryOperation(async () => {
    await setDoc(doc(db, 'achievements', cardNumber), { achievements });
  });
}

// Загрузить достижения
export async function loadAchievements(cardNumber) {
  return retryOperation(async () => {
    const ref = doc(db, 'achievements', cardNumber);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().achievements : null;
  });
}

export { db, auth };

// @ts-ignore
// Для корректной работы импорта в TypeScript 