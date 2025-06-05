import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, enableIndexedDbPersistence, FirestoreError } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import firebaseConfig from '../firebase-config';

interface GameStats {
  gamesPlayed: number;
  totalPlayTime: number;
  deathsByAnvil: number;
  itemsCaught: {
    [key: string]: number;
  };
  timeUnderSlowEffect: number;
  highScore: number;
}

interface LoyaltyCard {
  number: string;
  // Добавьте другие поля, если они есть
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  activeImage: string;
  inactiveImage: string;
}

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Ошибка инициализации Firebase:', error);
  throw error;
}

// Включаем офлайн-режим только один раз при инициализации
let persistenceEnabled = false;

const enablePersistence = async () => {
  if (!persistenceEnabled) {
    try {
      await enableIndexedDbPersistence(db);
      persistenceEnabled = true;
    } catch (err) {
      if (err instanceof FirestoreError) {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
          console.warn('The current browser does not support persistence.');
        }
      }
    }
  }
};

// Вызываем enablePersistence при инициализации
enablePersistence();

// Функция для повторных попыток
async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
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
export async function saveStats(cardNumber: string, stats: GameStats): Promise<void> {
  if (!db) {
    console.error('Firestore не инициализирован');
    throw new Error('Firestore не инициализирован');
  }
  
  try {
    await retryOperation(async () => {
      await setDoc(doc(db, 'stats', cardNumber), stats);
    });
  } catch (error) {
    console.error('Критическая ошибка при сохранении статистики:', error);
    throw error;
  }
}

// Функция верификации сохранения
export async function verifySave(cardNumber: string, expectedStats: GameStats): Promise<boolean> {
  try {
    const savedStats = await loadStats(cardNumber);
    if (!savedStats || savedStats.highScore !== expectedStats.highScore) {
      console.error('Ошибка верификации сохранения:', {
        expected: expectedStats,
        actual: savedStats
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error('Ошибка при верификации сохранения:', error);
    return false;
  }
}

// Загрузить статистику игрока
export async function loadStats(cardNumber: string): Promise<GameStats | null> {
  if (!db) throw new Error('Firestore не инициализирован');
  return retryOperation(async () => {
    const ref = doc(db, 'stats', cardNumber);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as GameStats : null;
  });
}

// Сохранить loyaltyCard
export async function saveLoyaltyCard(cardNumber: string, cardData: LoyaltyCard): Promise<void> {
  if (!db) throw new Error('Firestore не инициализирован');
  return retryOperation(async () => {
    await setDoc(doc(db, 'loyaltyCards', cardNumber), cardData);
  });
}

// Загрузить loyaltyCard
export async function loadLoyaltyCard(cardNumber: string): Promise<LoyaltyCard | null> {
  if (!db) throw new Error('Firestore не инициализирован');
  return retryOperation(async () => {
    const ref = doc(db, 'loyaltyCards', cardNumber);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() as LoyaltyCard : null;
  });
}

// Сохранить достижения
export async function saveAchievements(cardNumber: string, achievements: Achievement[]): Promise<void> {
  if (!db) throw new Error('Firestore не инициализирован');
  return retryOperation(async () => {
    await setDoc(doc(db, 'achievements', cardNumber), { achievements });
  });
}

// Загрузить достижения
export async function loadAchievements(cardNumber: string): Promise<Achievement[] | null> {
  if (!db) throw new Error('Firestore не инициализирован');
  return retryOperation(async () => {
    const ref = doc(db, 'achievements', cardNumber);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().achievements as Achievement[] : null;
  });
}

export { db, auth }; 