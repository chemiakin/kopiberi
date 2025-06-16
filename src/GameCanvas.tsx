import React, { useRef, useEffect, useState } from 'react';
import { loadStats, saveStats, loadLoyaltyCard, saveLoyaltyCard, loadAchievements, saveAchievements, verifySave } from './services/firebase';
import { collection, getDocs, query, orderBy, limit, getCountFromServer, getDoc, doc, where } from 'firebase/firestore';
import { db } from './services/firebase';

interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'salad' | 'kebab' | 'champignon' | 'cucumber' | 'eggplant' | 'anvil' | 'puffer' | 'sock' | 'drop' | 'magnet' | 'shield' | 'ticket' | 'boot';
  speed: number;
  id: string;
}

type GameStateType = 'playing' | 'menu' | 'result' | 'profile' | 'auth' | 'stats' | 'prizes' | 'howtoplay' | 'prizeinfo' | 'leaderboard' | 'adminStats';

interface LoyaltyCard {
  number: string;
}

interface GameStats {
  gamesPlayed: number;
  totalPlayTime: number;
  deathsByAnvil: number;
  itemsCaught: {
    [key in GameObject['type']]?: number;
  };
  timeUnderSlowEffect: number;
  highScore: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  activeImage: string;
  inactiveImage: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  totalPlayers: number;
}

// --- Компонент PrizeList для призов ---
const PrizeList: React.FC<{ ticketsCount: number, setShowPrize100: (v: boolean) => void }> = ({ ticketsCount, setShowPrize100 }) => {
  const [copied200, setCopied200] = useState(false);
  const [copied500, setCopied500] = useState(false);
  // Всегда три карточки, неактивные если билетов не хватает
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', maxHeight: '100dvh', paddingBottom: 10 }}>
      {/* Приз 1 */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
        padding: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: 110,
        position: 'relative'
      }}>
        {ticketsCount >= 1 ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'left', color: '#111' }}>Скидка 100 руб.</div>
            <div style={{ fontSize: 14, color: '#666', textAlign: 'left' }}>
              Даём скидку 100 рублей на покупки от 1000! Чтобы воспользоваться - покажите QR-код на кассе.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div></div>
              <button
                onClick={() => setShowPrize100(true)}
                style={{
                  padding: '10px',
                  fontSize: '14px',
                  backgroundColor: '#E50046',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Открыть
              </button>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ color: '#888', fontSize: 20 }}>Поймайте билет</span>
          </div>
        )}
      </div>
      {/* Приз 2 */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
        padding: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: 110,
        position: 'relative'
      }}>
        {ticketsCount >= 2 ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'left', color: '#111' }}>Скидка 200 руб.</div>
            <div style={{ fontSize: 14, color: '#666', textAlign: 'left' }}>
              На все интернет-заказы от 1500 рублей. Промокод можно применить в корзине.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#000' }}>Z1JSW1Q</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('Z1JSW1Q');
                  setCopied200(true);
                  setTimeout(() => setCopied200(false), 1500);
                }}
                style={{
                  padding: '10px',
                  fontSize: '14px',
                  backgroundColor: '#E50046',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied200 ? 'Скопировано' : 'Скопировать'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ color: '#888', fontSize: 20 }}>Поймайте билет</span>
          </div>
        )}
      </div>
      {/* Приз 3 */}
      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
        padding: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: 110,
        position: 'relative'
      }}>
        {ticketsCount >= 3 ? (
          <>
            <div style={{ fontSize: 16, fontWeight: 700, textAlign: 'left', color: '#111' }}>Скидка 500 руб.</div>
            <div style={{ fontSize: 14, color: '#666', textAlign: 'left' }}>
              На все интернет заказы от 3000 рублей. Промокод можно применить в корзине.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: '#000' }}>F1ZL88</div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('F1ZL88');
                  setCopied500(true);
                  setTimeout(() => setCopied500(false), 1500);
                }}
                style={{
                  padding: '10px',
                  fontSize: '14px',
                  backgroundColor: '#E50046',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {copied500 ? 'Скопировано' : 'Скопировать'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ color: '#888', fontSize: 20 }}>Поймайте билет</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Добавляем интерфейс для Window
declare global {
  interface Window {
    safeAreaInsets?: {
      top: number;
      bottom: number;
    };
  }
}

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [score, setScore] = useState(0);
  const [basketX, setBasketX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [, setGameObjects] = useState<GameObject[]>([]);
  const [images, setImages] = useState<{ [key: string]: HTMLImageElement }>({});
  const lastPointerX = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);
  const gameObjectsRef = useRef<GameObject[]>([]);
  const [gameState, setGameState] = useState<GameStateType>(() => {
    const savedCard = localStorage.getItem('loyaltyCard');
    return savedCard ? 'menu' : 'auth';
  });
  const [timeLeft, setTimeLeft] = useState(8);
  const [finalScore, setFinalScore] = useState(0);
  const [basketScale, setBasketScale] = useState(1);
  const [slowEffect, setSlowEffect] = useState(false);
  const timeBarWidthRef = useRef(0);
  const effectTimersRef = useRef<{ [key: string]: number }>({});
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard>(() => {
    const savedCard = localStorage.getItem('loyaltyCard');
    return savedCard ? JSON.parse(savedCard) : { number: '' };
  });
  const [cardInput, setCardInput] = useState(['7', '9', '', '', '', '', '', '', '', '', '']);
  const [rainEffect, setRainEffect] = useState(false);
  const [magnetEffect, setMagnetEffect] = useState(false);
  const [shieldEffect, setShieldEffect] = useState(false);
  const [gameStats, setGameStats] = useState<GameStats>(() => {
    const savedStats = localStorage.getItem(`stats_${loyaltyCard.number}`);
    return savedStats ? JSON.parse(savedStats) : {
      gamesPlayed: 0,
      totalPlayTime: 0,
      deathsByAnvil: 0,
      itemsCaught: {},
      timeUnderSlowEffect: 0,
      highScore: 0
    };
  });
  const gameStartTimeRef = useRef<number>(0);
  const slowEffectStartTimeRef = useRef<number>(0);
  const [achievements, setAchievements] = useState<Achievement[]>(() => [
    {
      id: 'anvil_fan',
      title: 'Фанат наковален',
      description: 'Проиграйте из-за наковальни больше 10',
      isUnlocked: false,
      activeImage: 'anvil_active.png',
      inactiveImage: 'anvil_unactive.png'
    },
    {
      id: 'crown_king',
      title: 'Царь во дворца',
      description: 'Сыграйте более 1000 игр',
      isUnlocked: false,
      activeImage: 'crown_active.png',
      inactiveImage: 'crown_unactive.png'
    },
    {
      id: 'legend',
      title: 'Легенда',
      description: 'Наберите в игре более 5000 очков',
      isUnlocked: false,
      activeImage: 'cup_active.png',
      inactiveImage: 'cup_unactive.png'
    },
    {
      id: 'fish_lover',
      title: 'Любитель рыб',
      description: 'Проведите более 10 минут в замедлении',
      isUnlocked: false,
      activeImage: 'puffer_active.png',
      inactiveImage: 'puffer_unactive.png'
    },
    {
      id: 'time_master',
      title: 'Вне времени',
      description: 'Проведите в игре более двух часов',
      isUnlocked: false,
      activeImage: 'stopwatch_active.png',
      inactiveImage: 'stopwatch_unactive.png'
    }
  ]);
  const [screenGlow, setScreenGlow] = useState<{ color: string; intensity: number } | null>(null);
  const [objectRotations, setObjectRotations] = useState<{ [key: string]: number }>({});
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  // Временно отключаем звуки
  /*
  const [sounds, setSounds] = useState<{ [key: string]: HTMLAudioElement }>({});
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const backgroundMusicTimerRef = useRef<number | null>(null);
  */
  const [basketTilt, setBasketTilt] = useState(0);
  const lastBasketX = useRef(basketX);
  const [floatingText, setFloatingText] = useState<{ text: string; x: number; y: number; opacity: number } | null>(null);
  const [showGift, setShowGift] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deathReason, setDeathReason] = useState('');
  const fpsRef = useRef<number>(60);
  const [fps, setFps] = useState(60);
  const lastFpsUpdate = useRef<number>(performance.now());
  const frameCount = useRef<number>(0);
  // useState для загрузки данных
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPlace, setUserPlace] = useState<number | null>(null);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
  // Добавляю состояние для показа страницы приза 100 руб
  const [showPrize100, setShowPrize100] = useState(false);
  // Добавляем новые состояния для админ-статистики
  const [adminStats, setAdminStats] = useState<{
    totalPlayers: number;
    totalGames: number;
    totalStats: GameStats;
    top100: { id: string; score: number }[];
  }>({
    totalPlayers: 0,
    totalGames: 0,
    totalStats: {
      highScore: 0,
      totalPlayTime: 0,
      timeUnderSlowEffect: 0,
      itemsCaught: {} as { [key in GameObject['type']]: number },
      gamesPlayed: 0,
      deathsByAnvil: 0
    },
    top100: []
  });
  const [bootEffect, setBootEffect] = useState(false);

  // --- Причины смерти ---
  const timeDeathReasons = [
    'Счастливые часов не наблюдают?',
    'Часики тикали слишком быстро',
    'Время закончилось'
  ];
  const anvilDeathReasons = [
    'Вас придавило(',
    'Наковальня сделала своё дело',
    'Ваши нервы тоже железные?',
    'Следите за наковальней'
  ];

  // Сброс игры
  const resetGame = () => {
    setScore(0);
    setTimeLeft(8);
    setBasketScale(1);
    setSlowEffect(false);
    setScreenGlow(null);
    setObjectRotations({});
    setBasketX((dimensions.width - 100) / 2);
    gameObjectsRef.current = [];
    setGameObjects([]);
    gameStartTimeRef.current = Date.now();
  };

  // Запуск игры
  const startGame = () => {
    resetGame();
    setGameState('playing');
    setGameStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1
    }));
  };

  // Обновление достижений
  const updateAchievements = (stats: GameStats) => {
    setAchievements(prev => prev.map(achievement => {
      let isUnlocked = false;
      switch (achievement.id) {
        case 'anvil_fan':
          isUnlocked = stats.deathsByAnvil >= 10;
          break;
        case 'crown_king':
          isUnlocked = stats.gamesPlayed >= 1000;
          break;
        case 'legend':
          isUnlocked = stats.highScore >= 5000;
          break;
        case 'fish_lover':
          isUnlocked = stats.timeUnderSlowEffect >= 600000;
          break;
        case 'time_master':
          isUnlocked = stats.totalPlayTime >= 7200000;
          break;
      }
      return { ...achievement, isUnlocked };
    }));
  };

  // Загрузка шрифта
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Play:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  // Загрузка изображений
  useEffect(() => {
    const loadImages = async () => {
      const imageNames = [
        'salad', 'kebab', 'champignon', 'cucumber', 'eggplant',
        'anvil', 'puffer', 'sock', 'basket',
        'drop', 'magnet', 'shield', 'ticket', 'boot'
      ];
      const loadedImages: { [key: string]: HTMLImageElement } = {};
      try {
        // Загружаем фоновое изображение
        const bgImg = new Image();
        bgImg.src = '/assets/background.png';
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
        });
        
        setBackgroundImage(bgImg);
        const rootDiv = document.getElementById('root');
        if (rootDiv) {
          rootDiv.style.backgroundImage = `url(${bgImg.src})`;
          rootDiv.style.backgroundSize = 'cover';
          rootDiv.style.backgroundPosition = 'center';
          rootDiv.style.backgroundAttachment = 'fixed';
          rootDiv.style.backgroundRepeat = 'no-repeat';
          rootDiv.style.minHeight = '100dvh';
          rootDiv.style.margin = '0';
          rootDiv.style.padding = '0';
        }
        for (const name of imageNames) {
          const img = new Image();
          img.src = `/assets/${name}.png`;
          console.log(`Загрузка изображения: ${name}.png`);
          await new Promise((resolve, reject) => {
            img.onload = () => {
              console.log(`Успешно загружено: ${name}.png`);
              resolve(null);
            };
            img.onerror = (error) => {
              console.error(`Ошибка загрузки ${name}.png:`, error);
              reject(error);
            };
          });
          loadedImages[name] = img;
        }
        console.log('Все изображения загружены:', Object.keys(loadedImages));
        setImages(loadedImages);
      } catch (error) {
        console.error('Ошибка загрузки изображений:', error);
      }
    };
    loadImages();
  }, []);

  // Обновляем все обработчики кнопок
  const handleButtonClick = () => {
    // Временно отключаем звук кнопки
    // playSound('button');
  };

  // --- Данные по предметам с шансами и описаниями ---
  const itemsInfo = [
    {
      type: 'champignon',
      name: 'Шампиньон',
      img: '/assets/champignon.png',
      desc: 'Вкусный и легкий. Даёт 10 очков и 1,5 секунды',
      chance: 0.15,
      points: 10,
      time: 1.5,
      floatText: '+10'
    },
    {
      type: 'cucumber',
      name: 'Огурец',
      img: '/assets/cucumber.png',
      desc: 'Полезный и зеленый. Даёт 15 очков и 1,3 секунды',
      chance: 0.10,
      points: 15,
      time: 1.3,
      floatText: '+15'
    },
    {
      type: 'eggplant',
      name: 'Баклажан',
      img: '/assets/eggplant.png',
      desc: 'Подозрительно фиолетовый. Даёт 5 очков и 1,7 секунд',
      chance: 0.10,
      points: 5,
      time: 1.7,
      floatText: '+5'
    },
    {
      type: 'kebab',
      name: 'Шашлык',
      img: '/assets/kebab.png',
      desc: 'Сочный и ароматный. Даёт 20 очков и 2 секунды',
      chance: 0.20,
      points: 20,
      time: 2,
      floatText: '+20'
    },
    {
      type: 'salad',
      name: 'Салат',
      img: '/assets/salad.png',
      desc: 'Просто салат. Даёт 10 очков и 1 секунду',
      chance: 0.10,
      points: 10,
      time: 1,
      floatText: '+10'
    },
    {
      type: 'anvil',
      name: 'Наковальня',
      img: '/assets/anvil.png',
      desc: 'Тяжелый и железный. Прекращает игру',
      chance: 0.09,
      floatText: 'Не успел'
    },
    {
      type: 'puffer',
      name: 'Фуга',
      img: '/assets/puffer.png',
      desc: 'Надувается, замедляет все предметы на 3 секунды',
      chance: 0.07,
      floatText: 'Замедление'
    },
    {
      type: 'sock',
      name: 'Носок',
      img: '/assets/sock.png',
      desc: 'Потерялся в стиралке. Отнимает 2 секунды и делает корзину маленькой',
      chance: 0.05,
      floatText: 'уменьшение!'
    },
    {
      type: 'drop',
      name: 'Дождь',
      img: '/assets/drop.png',
      desc: 'Дождь из предметов',
      chance: 0.02,
      floatText: ''
    },
    {
      type: 'shield',
      name: 'Щит',
      img: '/assets/shield.png',
      desc: 'Железный и надежный, защищает от предметов',
      chance: 0.03,
      floatText: 'неуязвимость'
    },
    {
      type: 'magnet',
      name: 'Магнит',
      img: '/assets/magnet.png',
      desc: 'Так и манит. Примагничивает все предметы на экране. Положительные.',
      chance: 0.03,
      floatText: 'притягивает'
    },
    {
      type: 'ticket',
      name: 'Билетик',
      img: '/assets/ticket.png',
      desc: 'Поймайте билетик и получите шанс на приз!',
      chance: 0.003,
      floatText: '+билет'
    },
    {
      type: 'boot',
      name: 'Сапог',
      img: '/assets/boot.png',
      desc: 'Все предметы превращаются в сапоги!',
      chance: 0.017,
      floatText: 'Сапоги!'
    }
  ];

  // --- Генерация предметов с нормализацией шансов ---
  const generateObject = () => {
    if (rainEffect) {
      // Только позитивные предметы
      const positive = itemsInfo.filter(i => ['champignon','cucumber','eggplant','kebab','salad'].includes(i.type));
      const idx = Math.floor(Math.random() * positive.length);
      const item = positive[idx];
      const id = Math.random().toString(36).substr(2, 9);
      const speed = 150 + Math.random() * 200;
      return {
        id,
        x: Math.random() * (dimensions.width - 50),
        y: -50,
        width: 50,
        height: 50,
        type: item.type as GameObject['type'],
        speed
      };
    }
    // Нормализуем шансы
    const totalChance = itemsInfo.reduce((sum, item) => sum + item.chance, 0);
    const rand = Math.random() * totalChance;
    let sum = 0;
    for (const item of itemsInfo) {
      sum += item.chance;
      if (rand < sum) {
        const id = Math.random().toString(36).substr(2, 9);
        const speed = item.type === 'anvil' ? 450 * 1.5 : 150 + Math.random() * 200;
        return {
          id,
          x: Math.random() * (dimensions.width - 50),
          y: -50,
          width: item.type === 'anvil' ? 72 : 50, // Наковальня 72x72, остальные 50x50
          height: item.type === 'anvil' ? 72 : 50, // Наковальня 72x72, остальные 50x50
          type: item.type as GameObject['type'],
          speed
        };
      }
    }
    // fallback
    return {
      id: Math.random().toString(36).substr(2, 9),
      x: Math.random() * (dimensions.width - 50),
      y: -50,
      width: 60,
      height: 60,
      type: 'salad' as GameObject['type'],
      speed: 150 + Math.random() * 200
    };
  };

  // Генерация предметов
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      if (rainEffect) {
        for (let i = 0; i < 4; i++) {
          const newObject = generateObject();
          setGameObjects(prev => {
            const newObjects = [...prev, newObject];
            gameObjectsRef.current = newObjects;
            return newObjects;
          });
        }
      } else {
        const newObject = generateObject();
        setGameObjects(prev => {
          const newObjects = [...prev, newObject];
          gameObjectsRef.current = newObjects;
          return newObjects;
        });
      }
    }, rainEffect ? 250 : 375);

    return () => clearInterval(interval);
  }, [dimensions.width, gameState, rainEffect]);

  // Сохранение статистики
  useEffect(() => {
    if (loyaltyCard.number) {
      localStorage.setItem(`stats_${loyaltyCard.number}`, JSON.stringify(gameStats));
    }
  }, [gameStats, loyaltyCard.number]);

  // Обновление времени игры
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = setInterval(() => {
        setGameStats(prev => ({
          ...prev,
          totalPlayTime: prev.totalPlayTime + 100
        }));
      }, 100);

      return () => clearInterval(timer);
    }
  }, [gameState]);

  // Обновление позиций предметов
  useEffect(() => {
    if (!canvasRef.current || !images.basket || gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let damageTimeoutId: number | null = null;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastFrameTime.current;
      lastFrameTime.current = timestamp;

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Отрисовка фона с учетом безопасных зон
      if (backgroundImage) {
        const scale = dimensions.height / backgroundImage.height;
        const width = backgroundImage.width * scale;
        const x = (dimensions.width - width) / 2;
        ctx.drawImage(backgroundImage, x, 0, width, dimensions.height);
      }

      // Обновляем позицию таймлайна с учетом безопасных зон
      const topSafeArea = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
      const targetTimeBarWidth = (timeLeft / 8) * dimensions.width;
      timeBarWidthRef.current += (targetTimeBarWidth - timeBarWidthRef.current) * 0.05;
      
      ctx.fillStyle = '#ddd';
      ctx.fillRect(0, topSafeArea, dimensions.width, 10);
      ctx.fillStyle = timeLeft > 2 ? '#4CAF50' : '#f44336';
      ctx.fillRect(0, topSafeArea, timeBarWidthRef.current, 10);

      // Обновляем позиции предметов с учетом безопасных зон
      const updated = gameObjectsRef.current.map(obj => {
        let newX = obj.x;
        let newY = obj.y;
        let rotation = objectRotations[obj.id] || 0;

        if (obj.type !== 'anvil') {
          rotation += deltaTime * 0.001;
          setObjectRotations(prev => ({ ...prev, [obj.id]: rotation }));
        }

        if (magnetEffect && !['anvil', 'puffer', 'sock', 'drop', 'magnet', 'shield', 'boot'].includes(obj.type)) {
          const dx = basketX - obj.x;
          const dy = (dimensions.height - 80 * basketScale) - obj.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 0) {
            newX += (dx / distance) * obj.speed * 2 * deltaTime / 1000;
            newY += (dy / distance) * obj.speed * 2 * deltaTime / 1000;
          }
        } else {
          newY += obj.speed * (slowEffect && !['anvil', 'puffer', 'sock', 'drop', 'magnet', 'shield', 'boot'].includes(obj.type) ? 0.5 : 1) * deltaTime / 1000;
        }

        // Если активен эффект сапога, заменяем тип предмета на сапог
        const finalType = bootEffect ? 'boot' : obj.type;

        return {
          ...obj,
          x: newX,
          y: newY,
          type: finalType
        };
      }).filter(obj => {
        const basketHeight = 80 * basketScale;
        const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
        if (obj.y + obj.height > dimensions.height - basketHeight - safeAreaBottom) {
          if (obj.x + obj.width > basketX && obj.x < basketX + 100 * basketScale) {
            handleCollision(obj);
            return false;
          }
          if (obj.y > dimensions.height) {
            if (!['anvil', 'puffer', 'sock', 'drop', 'magnet', 'shield', 'boot'].includes(obj.type) && !rainEffect) {
              setTimeLeft(prev => Math.max(0, prev - 2));
              if (damageTimeoutId) {
                clearTimeout(damageTimeoutId);
              }
              damageTimeoutId = window.setTimeout(() => {
                damageTimeoutId = null;
              }, 500);
            }
            return false;
          }
        }
        return true;
      });

      // Обновляем состояние
      if (JSON.stringify(updated) !== JSON.stringify(gameObjectsRef.current)) {
        gameObjectsRef.current = updated;
        setGameObjects(updated);
      }

      // Отрисовка предметов
      updated.forEach(obj => {
        const img = images[obj.type];
        if (img) {
          ctx.save();
          const centerX = obj.x + obj.width / 2;
          const centerY = obj.y + obj.height / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate(objectRotations[obj.id] || 0);
          ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
          ctx.restore();
        } else {
          console.warn(`Изображение не найдено для типа: ${obj.type}`);
        }
      });

      // Отрисовка корзины с учетом безопасных зон
      if (images.basket) {
        const basketWidth = 100 * basketScale * (shieldEffect ? 1.5 : 1);
        const basketHeight = 80 * basketScale * (shieldEffect ? 1.5 : 1);
        const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
        ctx.save();
        const basketCenterX = basketX + basketWidth / 2;
        const basketY = dimensions.height - basketHeight - safeAreaBottom;
        ctx.translate(basketCenterX, basketY + basketHeight / 2);
        ctx.rotate(basketTilt);
        ctx.drawImage(
          images.basket,
          -basketWidth / 2,
          -basketHeight / 2,
          basketWidth,
          basketHeight
        );
        ctx.restore();
      }

      // Отрисовка счета с учетом безопасных зон
      ctx.save();
      ctx.font = '20px "Play", Arial, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText('Счёт', dimensions.width / 2, topSafeArea + 45);
      ctx.font = 'bold 38px "Play", Arial, sans-serif';
      ctx.fillText(`${score}`, dimensions.width / 2, topSafeArea + 85);
      ctx.restore();

      // FPS-трекер
      frameCount.current++;
      const now = performance.now();
      if (now - lastFpsUpdate.current >= 1000) {
        fpsRef.current = frameCount.current;
        setFps(frameCount.current);
        frameCount.current = 0;
        lastFpsUpdate.current = now;
      }

      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.font = '4px Arial, sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`FPS: ${fps}`, 4, dimensions.height - 4);
      ctx.restore();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (damageTimeoutId) {
        clearTimeout(damageTimeoutId);
      }
    };
  }, [dimensions, images, basketX, score, gameState, timeLeft, basketScale, slowEffect, magnetEffect, shieldEffect, screenGlow, objectRotations, backgroundImage, basketTilt]);

  // Обновляем useEffect для установки размеров canvas
  useEffect(() => {
    const updateDimensions = () => {
      // Получаем безопасные зоны
      // const topSafeArea = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
      // const bottomSafeArea = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
      
      // Вычисляем доступную высоту с учетом безопасных зон
      const availableHeight = window.innerHeight;
      
      // Устанавливаем размеры canvas
      setDimensions({
        width: window.innerWidth,
        height: availableHeight
      });

      // Обновляем размеры canvas элемента
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = availableHeight;
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Обновляем useEffect для установки CSS-переменных
  useEffect(() => {
    const setSafeAreaVariables = () => {
      const dvh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--dvh', `${dvh}px`);
      
      // Определяем безопасные зоны с учетом браузера
      let topSafeArea = 0;
      let bottomSafeArea = 0;

      // Для iOS Safari
      if (window.safeAreaInsets) {
        topSafeArea = window.safeAreaInsets.top;
        bottomSafeArea = window.safeAreaInsets.bottom;
      } else {
        // Для других браузеров используем фиксированные значения
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isIOS && isSafari) {
          // Для iOS Safari
          topSafeArea = 44; // Стандартная высота статус-бара iOS
          bottomSafeArea = 34; // Стандартная высота нижней панели iOS
        } else {
          // Для Chrome и других браузеров
          topSafeArea = 0;
          bottomSafeArea = 0;
        }
      }

      // Устанавливаем CSS-переменные
      document.documentElement.style.setProperty('--sat', `${topSafeArea}px`);
      document.documentElement.style.setProperty('--sab', `${bottomSafeArea}px`);
    };

    setSafeAreaVariables();
    window.addEventListener('resize', setSafeAreaVariables);
    return () => window.removeEventListener('resize', setSafeAreaVariables);
  }, []);

  // Добавляю универсальные стили и meta viewport
  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"][content*="viewport-fit=cover"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(meta);
    }
    const style = document.createElement('style');
    style.innerHTML = `
      html, body, #root {
        height: 100%;
        min-height: 100dvh;
        width: 100vw;
        margin: 0;
        padding: 0;
        border: 0;
        box-sizing: border-box;
        background: transparent !important;
        overflow: hidden !important;
      }
      #root {
        min-height: 100dvh;
        min-width: 100vw;
        background: url('/assets/background.png') center/cover no-repeat fixed !important;
        position: relative;
      }
      canvas {
        display: block;
        width: 100vw !important;
        height: 100dvh !important;
        max-width: 100vw !important;
        max-height: 100dvh !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        z-index: 2;
        padding-bottom: env(safe-area-inset-bottom, 0px);
        padding-top: env(safe-area-inset-top, 0px);
      }
      body {
        overscroll-behavior-y: contain;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) style.parentNode.removeChild(style);
    };
  }, []);

  // Таймер игры
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setGameState('result');
          setFinalScore(score);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, score]);

  // Обработка управления
  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setIsDragging(true);
    lastPointerX.current = e.clientX;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    if (!isDragging) return;
    
    const deltaX = e.clientX - lastPointerX.current;
    lastPointerX.current = e.clientX;
    
    setBasketX(prev => {
      const newX = prev + deltaX;
      return Math.max(0, Math.min(newX, dimensions.width - 100));
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (gameState !== 'playing') return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleCardInput = (index: number, value: string) => {
    if (index < 2) return; // Первые две цифры нельзя изменить
    if (!/^\d*$/.test(value)) return; // Только цифры
    if (value.length > 1) return; // Только одна цифра

    const newInput = [...cardInput];
    newInput[index] = value;
    setCardInput(newInput);

    // Автоматически переходим к следующему полю
    if (value && index < 10) {
      const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  // useEffect для загрузки данных при монтировании/смене карты
  useEffect(() => {
    async function fetchData() {
      let card = loyaltyCard;
      if (!card.number) {
        const saved = localStorage.getItem('loyaltyCard');
        if (saved) card = JSON.parse(saved);
      }
      
      if (card.number) {
        const loadedCard = await loadLoyaltyCard(card.number);
        if (!loadedCard) {
          await saveLoyaltyCard(card.number, card);
          setLoyaltyCard(card);
        } else {
          setLoyaltyCard(loadedCard);
        }
        
        // Загружаем данные с Firebase
        await loadGameData();
      }
    }
    
    if (loyaltyCard.number) fetchData();
  }, [loyaltyCard.number]);

  // handleAuth теперь не ждёт загрузки/сохранения, а сразу переводит в меню
  const handleAuth = async () => {
    const cardNumber = cardInput.join('');
    const newCard = { number: cardNumber };
    setLoyaltyCard(newCard);
    localStorage.setItem('loyaltyCard', JSON.stringify(newCard));
    setGameState('menu');
    
    // Всё остальное — в фоне
    saveLoyaltyCard(cardNumber, newCard);
    
    const stats = await loadStats(cardNumber);
    if (!stats) {
      const newStats = {
        gamesPlayed: 0,
        totalPlayTime: 0,
        deathsByAnvil: 0,
        itemsCaught: {},
        timeUnderSlowEffect: 0,
        highScore: 0
      };
      await saveStats(cardNumber, newStats);
      setGameStats(newStats);
    } else {
      setGameStats(stats);
    }
    
    const ach = await loadAchievements(cardNumber);
    if (!ach) {
      await saveAchievements(cardNumber, achievements);
      setAchievements(achievements);
    } else {
      setAchievements(ach);
    }
  };

  // handleLogout сбрасывает состояние
  const handleLogout = () => {
    setLoyaltyCard({ number: '' });
    setCardInput(['7', '9', '', '', '', '', '', '', '', '', '']);
    setGameState('auth');
    setGameStats({
      gamesPlayed: 0,
      totalPlayTime: 0,
      deathsByAnvil: 0,
      itemsCaught: {},
      timeUnderSlowEffect: 0,
      highScore: 0
    });
  };

  // --- handleCollision с всплывающим текстом и новой механикой ---
  const handleCollision = (obj: GameObject) => {
    const item = itemsInfo.find(i => i.type === obj.type);
    const basketCenterX = basketX + 50 * basketScale;
    const basketY = dimensions.height - 80 * basketScale - 20;
    if (item) {
      // Обновляем статистику для всех пойманных предметов
      setGameStats(prev => {
        const newStats = {
          ...prev,
          itemsCaught: {
            ...prev.itemsCaught,
            [obj.type]: (prev.itemsCaught[obj.type] || 0) + 1
          }
        };
        updateAchievements(newStats);
        return newStats;
      });

      if (item.floatText) {
        setFloatingText({ text: item.floatText, x: basketCenterX, y: basketY, opacity: 1 });
        setTimeout(() => setFloatingText(null), 700);
      }
      // --- Звук для позитивных предметов ---
      if ([
        'champignon','cucumber','eggplant','kebab','salad'
      ].includes(obj.type)) {
        // playSound('positive');
      }
      // --- Во время rainEffect негативные и эффекты не действуют ---
      if (rainEffect && [
        'anvil','puffer','sock','drop','shield','boot'
      ].includes(obj.type)) {
        return;
      }
      switch (obj.type) {
        case 'champignon':
        case 'cucumber':
        case 'eggplant':
        case 'kebab':
        case 'salad':
          setScore(s => s + (item.points || 0));
          setTimeLeft(prev => Math.min(prev + (item.time || 0), 8));
          break;
        case 'anvil':
          if (!shieldEffect && !rainEffect) {
            // playSound('negative');
            setGameState('result');
            setFinalScore(score);
            setGameStats(prev => {
              const newStats = {
                ...prev,
                deathsByAnvil: prev.deathsByAnvil + 1,
                highScore: Math.max(prev.highScore, score)
              };
              updateAchievements(newStats);
              return newStats;
            });
          }
          break;
        case 'drop':
          if (!effectTimersRef.current.drop) {
            // playSound('effect');
            setRainEffect(true);
            effectTimersRef.current.drop = window.setTimeout(() => {
              setRainEffect(false);
              delete effectTimersRef.current.drop;
            }, 4000);
          }
          break;
        case 'magnet':
          if (!effectTimersRef.current.magnet) {
            // playSound('effect');
            setMagnetEffect(true);
            setScreenGlow({ color: '#2196F3', intensity: 1 });
            effectTimersRef.current.magnet = window.setTimeout(() => {
              setMagnetEffect(false);
              setScreenGlow(null);
              delete effectTimersRef.current.magnet;
            }, 3200);
          }
          break;
        case 'shield':
          if (!effectTimersRef.current.shield) {
            // playSound('effect');
            setShieldEffect(true);
            setScreenGlow({ color: '#FF9800', intensity: 1 });
            effectTimersRef.current.shield = window.setTimeout(() => {
              setShieldEffect(false);
              setScreenGlow(null);
              delete effectTimersRef.current.shield;
            }, 2100);
          }
          break;
        case 'sock':
          if (!effectTimersRef.current.sock && !shieldEffect) {
            // playSound('negative');
            setBasketScale(0.5);
            setTimeLeft(prev => Math.max(0, prev - 2));
            effectTimersRef.current.sock = window.setTimeout(() => {
              setBasketScale(1);
              delete effectTimersRef.current.sock;
            }, 3200);
          }
          break;
        case 'puffer':
          if (!effectTimersRef.current.puffer && !shieldEffect) {
            // playSound('negative');
            setSlowEffect(true);
            setScreenGlow({ color: '#4CAF50', intensity: 1 });
            slowEffectStartTimeRef.current = Date.now();
            effectTimersRef.current.puffer = window.setTimeout(() => {
              setSlowEffect(false);
              setScreenGlow(null);
              const slowEffectDuration = Date.now() - slowEffectStartTimeRef.current;
              setGameStats(prev => ({
                ...prev,
                timeUnderSlowEffect: prev.timeUnderSlowEffect + slowEffectDuration
              }));
              delete effectTimersRef.current.puffer;
            }, 3100);
          }
          break;
        case 'ticket':
          setGameStats(prev => {
            const newStats = {
              ...prev,
              itemsCaught: {
                ...prev.itemsCaught,
                ticket: (prev.itemsCaught.ticket || 0) + 1
              }
            };
            updateAchievements(newStats);
            return newStats;
          });
          break;
        case 'boot':
          if (!effectTimersRef.current.boot && !shieldEffect) {
            // playSound('negative');
            setBootEffect(true);
            setScreenGlow({ color: '#795548', intensity: 1 });
            effectTimersRef.current.boot = window.setTimeout(() => {
              setBootEffect(false);
              setScreenGlow(null);
              delete effectTimersRef.current.boot;
            }, 3000);
          }
          break;
        default:
          break;
      }
    }
  };

  // Компонент анимированного счета
  const AnimatedScore: React.FC<{ score: number; isNewRecord: boolean }> = ({ score, isNewRecord }) => {
    const [displayScore, setDisplayScore] = useState(0);
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
      let startTime: number;
      const duration = 2000;
      
      const animateScore = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentScore = Math.floor(progress * score);
        setDisplayScore(currentScore);
        
        if (progress < 1) {
          requestAnimationFrame(animateScore);
        } else {
          setIsPulsing(true);
        }
      };
      
      requestAnimationFrame(animateScore);
    }, [score]);

    return (
      <div style={{ marginBottom: '10px', position: 'relative', display: 'inline-block' }}>
        <div style={{ fontSize: '22px', color: '#fff', fontWeight: 600 }}>Ваш счёт:</div>
        <div style={{ 
          fontSize: '66px', 
          color: '#fff', 
          fontWeight: 900, 
          lineHeight: 1,
          transform: isPulsing ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.5s ease-in-out',
          animation: isPulsing ? 'pulse 1s infinite' : 'none'
        }}>{displayScore}</div>
        {isNewRecord && (
          <div style={{
            position: 'absolute',
            top: -38,
            right: -120,
            background: '#f44336',
            color: 'white',
            fontWeight: 700,
            fontSize: 18,
            borderRadius: 8,
            padding: '6px 18px',
            boxShadow: '0 2px 8px #0002',
            letterSpacing: 1
          }}>
            Новый рекорд
          </div>
        )}
      </div>
    );
  };

  // --- Страница результатов ---
  useEffect(() => {
    if (gameState === 'result') {
      if (timeLeft <= 0) {
        setDeathReason(timeDeathReasons[Math.floor(Math.random() * timeDeathReasons.length)]);
      } else if (finalScore > 0 && gameStats.deathsByAnvil > 0 && finalScore === score) {
        setDeathReason(anvilDeathReasons[Math.floor(Math.random() * anvilDeathReasons.length)]);
      } else {
        setDeathReason('Игра окончена');
      }
    }
    // eslint-disable-next-line
  }, [gameState]);

  const renderResult = () => {
    const isNewRecord = finalScore > (gameStats.highScore || 0);
    
    return (
      <div style={{
        width: '90%',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        boxSizing: 'border-box',
        padding: '40px 0',
        textAlign: 'center',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        overflowY: 'auto'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px', color: '#fff' }}>Игра окончена!</h2>
        <div style={{ fontSize: '20px', marginBottom: '10px', color: '#fff', fontWeight: 700, textShadow: '0 2px 8px #000' }}>{deathReason}</div>
        <AnimatedScore score={finalScore} isNewRecord={isNewRecord} />
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexDirection: 'column' }}>
          <button
            onClick={() => setShowGift(true)}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#E50046',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Получить подарок
          </button>
          <button
            onClick={() => {
              handleButtonClick();
              startGame();
            }}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#E50046',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Играть снова
          </button>
          <button
            onClick={() => {
              handleButtonClick();
              setGameState('menu');
            }}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#E7799A',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            На главную
          </button>
        </div>
      </div>
    );
  };

  const renderAuth = () => (
    <div style={{
      width: '90%',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      overflowY: 'auto',
      boxSizing: 'border-box',
      padding: '40px 0',
      textAlign: 'center',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <img src="/assets/brandlogo.png" alt="Логотип" style={{ width: 280, margin: '0 auto 0px auto', display: 'block' }} />
      <img src="/assets/icon.png" alt="Иконка" style={{ width: 220, margin: '0 auto 24px auto', display: 'block' }} />
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        marginBottom: 15,
        padding: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <img src="/assets/eggplant.png" alt="Баклажан" style={{ width: 40, height: 40, objectFit: 'contain' }} />
        <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'left', color: '#111' }}>
          Дарим 50.000 баллов самым активным игрокам и раздаем подарки в игре!
        </div>
      </div>
      <h2 style={{
        fontSize: 'clamp(16px, 5vw, 16px)',
        marginBottom: '10px',
        wordBreak: 'break-word',
        width: '100%',
        textAlign: 'center',
        color: '#fff'
      }}>
        Введите номер телефона
      </h2>
      <div style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
        marginBottom: '20px',
        flexWrap: 'nowrap',
        width: '90vw',
        maxWidth: 360,
        minWidth: 240,
        whiteSpace: 'nowrap',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {cardInput.map((digit, index) => (
          <input
            key={index}
            data-index={index}
            type="tel"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleCardInput(index, e.target.value)}
            style={{
              width: '9%',
              minWidth: 24,
              maxWidth: 32,
              height: 36,
              fontSize: 16,
              textAlign: 'center',
              border: '2px solid #ccc',
              borderRadius: '5px',
              backgroundColor: index < 2 ? '#eee' : 'white',
              cursor: index < 2 ? 'not-allowed' : 'text',
              color: '#000',
              padding: '0',
              boxSizing: 'border-box'
            }}
            disabled={index < 2}
            maxLength={1}
          />
        ))}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 15,
        padding: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'left', color: '#111' }}>
          Введите номер телефона в формате 79XXXXXXXXX
        </div>
      </div>
      <button
        onClick={() => {
          handleButtonClick();
          handleAuth();
        }}
        disabled={cardInput.some(digit => !digit)}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: cardInput.some(digit => !digit) ? '#ccc' : '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: cardInput.some(digit => !digit) ? 'not-allowed' : 'pointer',
          width: 'auto',
          minWidth: '200px',
          margin: '0 auto',
          display: 'block'
        }}
      >
        войти
      </button>
    </div>
  );

  // --- Страница 'Как играть' ---
  const renderHowToPlay = () => (
    <div style={{
      width: '90%',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      boxSizing: 'border-box',
      padding: '40px 0',
      textAlign: 'center',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#fff' }}>Как играть</h2>
      <p style={{ fontSize: '14px', marginBottom: '20px', color: '#fff' }}>
        Ловите предметы, двигая корзину влево и вправо, избегайте негативные предметы.
      </p>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '20px',
        padding: '0 0 10px 0',
        borderRadius: '10px',
        background: 'rgba(0, 0, 0, 0.5)',
        maxHeight: 'calc(100dvh - 200px)'
      }}>
        {itemsInfo.map(item => (
          <div key={item.type} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            borderBottom: '1px solid #eee',
            minHeight: 70
          }}>
            <img src={item.img} alt={item.name} style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ textAlign: 'left', flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{item.name}</div>
              <div style={{ fontSize: 14, color: '#d1d1d1' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          handleButtonClick();
          setGameState('menu');
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: 'auto'
        }}
      >
        На главную
      </button>
    </div>
  );

  // --- Страница 'Какие призы' ---
  const renderPrizeInfo = () => (
    <div style={{
      width: '90%',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      overflowY: 'auto',
      boxSizing: 'border-box',
      padding: '40px 0',
      textAlign: 'center',
      zIndex: 1
    }}>
      <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#fff' }}>Дарим 50.000 баллов!</h2>
      <div style={{ fontSize: '22px', marginBottom: '10px', color: '#fff', fontWeight: 700 }}>и другие подарки</div>
      <div style={{ fontSize: '16px', marginBottom: '30px', color: '#fff' }}>
        Соревнуйтесь среди всех игроков, бейте рекорды, собирайте купоны и получайте подарки!
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: 10,
          fontSize: 20,
          fontWeight: 700,
          color: '#d4af37',
          border: '2px solid #d4af37'
        }}>
          1-е место — 10.000 Б.
        </div>
        <div style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: 10,
          fontSize: 18,
          fontWeight: 700,
          color: '#bdbdbd',
          border: '2px solid #bdbdbd'
        }}>
          2-4 место — 5.000 Б.
        </div>
        <div style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: 10,
          fontSize: 18,
          fontWeight: 700,
          color: '#bdbdbd',
          border: '2px solid #bdbdbd'
        }}>
          5-14 место — 1.000 Б.
        </div>
        <div style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: 10,
          fontSize: 18,
          fontWeight: 700,
          color: '#bdbdbd',
          border: '2px solid #bdbdbd'
        }}>
          15-34 место — 500 Б.
        </div>
        <div style={{
          background: '#fff',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          padding: 10,
          fontSize: 18,
          fontWeight: 700,
          color: '#bdbdbd',
          border: '2px solid #bdbdbd'
        }}>
          35-84 место — 100 Б.
        </div>
      </div>
      <button
        onClick={() => {
          handleButtonClick();
          setGameState('menu');
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: 30
        }}
      >
        На главную
      </button>
    </div>
  );

  // --- ГЛАВНОЕ МЕНЮ ---
  const renderMenu = () => (
    <div style={{
      width: '90%',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      overflowY: 'auto',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      textAlign: 'center',
      zIndex: 1,
      padding: '40px 0'
    }}>
      <img src="/assets/brandlogo.png" alt="Логотип" style={{ width: 280, margin: '0 auto 0px auto', display: 'block' }} />
      <img src="/assets/icon.png" alt="Иконка" style={{ width: 220, margin: '0 auto 24px auto', display: 'block' }} />
      <div style={{ marginBottom: '20px' }}>
        {gameStats.highScore > 0 ? (
          <>
            <div style={{ fontSize: '22px', color: '#fff', fontWeight: 600 }}>Ваш рекорд:</div>
            <div style={{ fontSize: '66px', color: '#fff', fontWeight: 900, lineHeight: 1 }}>{gameStats.highScore}</div>
          </>
        ) : (
          <div style={{ fontSize: '22px', color: '#fff', fontWeight: 600, marginTop: 12 }}>У вас пока нет рекорда!</div>
        )}
      </div>
      <button
        onClick={() => {
          handleButtonClick();
          startGame();
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Начать игру
      </button>
      <button
        onClick={() => {
          handleButtonClick();
          setGameState('profile');
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E7799A',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Профиль
      </button>
      <button
        onClick={() => {
          handleButtonClick();
          setGameState('howtoplay');
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E7799A',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Как играть
      </button>
      <button
        onClick={() => {
          handleButtonClick();
          setGameState('prizeinfo');
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E7799A',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Какие призы
      </button>
    </div>
  );

  // --- ПРОФИЛЬ (без логотипа) ---
  const renderProfile = () => (
    <div style={{
      width: '90%',
      maxWidth: '800px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      overflowY: 'auto',
      boxSizing: 'border-box',
      padding: '40px 0',
      textAlign: 'center',
      zIndex: 1
    }}>
      <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#fff' }}>
        Профиль
      </h2>
      <p style={{ fontSize: '12px', marginBottom: '20px', color: '#fff' }}>
        Номер карты лояльности: {loyaltyCard.number}
      </p>
      <div style={{
        marginBottom: '30px',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '10px',
        boxShadow: '0 0 10px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#111' }}>Достижения</h3>
        <div 
          style={{
            display: 'flex',
            gap: '15px',
            overflowX: 'auto',
            padding: '10px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab',
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            const div = e.currentTarget;
            const startX = e.pageX - div.offsetLeft;
            const scrollLeft = div.scrollLeft;
            const handleMouseMove = (e: MouseEvent) => {
              const x = e.pageX - div.offsetLeft;
              const walk = (x - startX) * 2;
              div.scrollLeft = scrollLeft - walk;
            };
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          {achievements.map(achievement => (
            <div key={achievement.id} style={{
              flex: '0 0 auto',
              width: '200px',
              padding: '15px',
              backgroundColor: achievement.isUnlocked ? '#e8f5e9' : '#f5f5f5',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#111'
            }}>
              <img
                src={`/assets/${achievement.isUnlocked ? achievement.activeImage : achievement.inactiveImage}`}
                alt={achievement.title}
                style={{ width: '50px', height: '50px', marginBottom: '10px' }}
              />
              <h4 style={{ 
                margin: '0 0 5px 0',
                color: achievement.isUnlocked ? '#2e7d32' : '#757575'
              }}>
                {achievement.title}
              </h4>
              <p style={{ 
                margin: 0,
                fontSize: '14px',
                color: '#111'
              }}>
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '10px',
        justifyContent: 'center',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: 120 }}>
          <button
            onClick={() => {
              handleButtonClick();
              setGameState('prizes');
            }}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#E50046',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Мои призы
          </button>
          <button
            onClick={() => {
              handleButtonClick();
              setGameState('stats');
            }}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#E7799A',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Статистика
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minWidth: 120 }}>
          <button
            onClick={() => {
              handleButtonClick();
              setGameState('leaderboard');
            }}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#E50046',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Рейтинг
          </button>
          <button
            onClick={() => {
              handleButtonClick();
              handleLogout();
            }}
            style={{
              padding: '10px',
              fontSize: '14px',
              backgroundColor: '#E7799A',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Сменить аккаунт
          </button>
        </div>
      </div>
      <button
        onClick={() => {
          handleButtonClick();
          setGameState('menu');
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: 10
        }}
      >
        На главную
      </button>
    </div>
  );

  // --- Для отображения всех типов предметов ---
  const allTypes: GameObject['type'][] = [
    'salad', 'kebab', 'champignon', 'cucumber', 'eggplant', 'anvil', 'puffer', 'sock', 'drop', 'magnet', 'shield', 'ticket'
  ];

  const renderStats = () => (
    <div style={{
      width: '90%',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      boxSizing: 'border-box',
      padding: '40px 0 0 0',
      textAlign: 'center',
      zIndex: 1,
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: 'none'
    }}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          maxHeight: 'calc(100dvh - 80px - env(safe-area-inset-bottom, 0px))',
          paddingBottom: 24,
          boxSizing: 'border-box'
        }}
      >
        <h2 style={{ fontSize: 'clamp(24px, 5vw, 32px)', marginBottom: '20px' }}>
          Статистика игрока
        </h2>
        <div style={{ textAlign: 'left', marginBottom: '20px' }}>
          <p>Количество игр: {gameStats.gamesPlayed}</p>
          <p>Время в игре: {Math.floor(gameStats.totalPlayTime / 1000)} сек</p>
          <p>Смертей от наковальни: {gameStats.deathsByAnvil}</p>
          <p>Время под замедлением: {Math.floor(gameStats.timeUnderSlowEffect / 1000)} сек</p>
          <p>Рекорд: {gameStats.highScore}</p>
          <p>Поймано билетов: {gameStats.itemsCaught.ticket || 0}</p>
          <h3 style={{ marginTop: '20px' }}>Пойманные предметы:</h3>
          {allTypes.map(type => (
            <p key={type}>{type}: {gameStats.itemsCaught[type] || 0}</p>
          ))}
        </div>
      </div>
      <button
        onClick={() => {
          handleButtonClick();
          setGameState('profile');
        }}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          position: 'sticky',
          bottom: 0,
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: 10,
          boxShadow: '0 -2px 8px #0002',
          backgroundClip: 'padding-box',
          minHeight: 48
        }}
      >
        Назад
      </button>
    </div>
  );

  const renderPrizes = () => {
    if (showPrize100) return renderPrize100();
    return (
      <div style={{
        width: '90%',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        boxSizing: 'border-box',
        padding: '40px 0',
        textAlign: 'center',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: 30,
          padding: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          flexShrink: 0
        }}>
          <img src="/assets/ticket.png" alt="Билетик" style={{ width: 40, height: 40, objectFit: 'contain', flexShrink: 0 }} />
          <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'left', color: '#111' }}>
            Ловите билетики и получайте приятные подарки!
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100dvh - 200px)' }}>
          <PrizeList ticketsCount={gameStats.itemsCaught.ticket || 0} setShowPrize100={setShowPrize100} />
        </div>
        <button
          onClick={() => {
            handleButtonClick();
            setGameState('profile');
          }}
          style={{
            padding: '10px',
            fontSize: '14px',
            backgroundColor: '#E50046',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: 20,
            flexShrink: 0
          }}
        >
          Назад
        </button>
      </div>
    );
  };

  const renderPrize100 = () => (
    <div style={{
      width: '90%',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      boxSizing: 'border-box',
      padding: '40px 0',
      textAlign: 'center',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      color: '#fff'
    }}>
      <h2 style={{ fontSize: '20px', marginBottom: '5px', color: '#fff' }}>Скидка 100 рублей</h2>
      <div style={{ fontSize: '18px', marginBottom: '5px', color: '#fff' }}>На покупки от 1000 рублей</div>
      <div style={{ fontSize: '18px', marginBottom: '5px', color: '#fff' }}>Покажите QR-код в магазине</div>
      <img src="/assets/coupon.svg" alt="QR" style={{ width: 180, marginBottom: 5 }} />
      <button
        onClick={() => setShowPrize100(false)}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          marginTop: 10
        }}
      >
        Назад
      </button>
    </div>
  );

  const renderGift = () => (
    <div style={{
      width: '90%',
      maxWidth: '600px',
      margin: '0 auto',
      minHeight: '100dvh',
      maxHeight: '100dvh',
      boxSizing: 'border-box',
      padding: '40px 0',
      textAlign: 'center',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      color: '#fff'
    }}>
      <h2 style={{ fontSize: '16px', marginBottom: '5px', color: '#fff' }}>Ваш тройной кешбэк!</h2>
      <div style={{ fontSize: '22px', marginBottom: '5px', color: '#fff' }}>На покупки от 1500 рублей</div>
      <div style={{ fontSize: '18px', marginBottom: '5px', color: '#fff' }}>Покажите QR-код в магазине</div>
      <img src="/assets/coupon1.svg" alt="QR" style={{ width: 180, marginBottom: 5 }} />
      <div style={{ fontSize: '18px', marginBottom: '5px', color: '#fff' }}>или примените промокод в приложении</div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        marginBottom: 10,
        background: '#f5f5f5',
        padding: '10px 15px',
        borderRadius: 8,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, color: '#000' }}>QS8Y3R</div>
        <button
          onClick={() => {
            navigator.clipboard.writeText('QS8Y3R');
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={{
            padding: '10px',
            fontSize: '14px',
            backgroundColor: '#E50046',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            minWidth: 100
          }}
        >
          {copied ? 'Скопировано' : 'Скопировать'}
        </button>
      </div>
      <button
        onClick={() => setShowGift(false)}
        style={{
          padding: '10px',
          fontSize: '14px',
          backgroundColor: '#E50046',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Назад
      </button>
    </div>
  );

  // --- Рендер всплывающего текста ---
  const renderFloatingText = () => floatingText && (
    <div
      style={{
        position: 'fixed',
        left: floatingText.x,
        top: floatingText.y - 40,
        transform: 'translate(-50%, 0)',
        color: '#fff',
        fontSize: 16,
        fontWeight: 700,
        pointerEvents: 'none',
        opacity: floatingText.opacity,
        textShadow: '0 2px 8px #000',
        transition: 'opacity 0.5s',
        zIndex: 1000
      }}
    >
      {floatingText.text}
    </div>
  );

  // --- useEffect для обновления достижений при загрузке статистики ---
  useEffect(() => {
    updateAchievements(gameStats);
    // eslint-disable-next-line
  }, [gameStats]);

  // --- Анимация покачивания корзины ---
  useEffect(() => {
    if (gameState !== 'playing') return;
    const handle = setInterval(() => {
      const dx = basketX - lastBasketX.current;
      // Ограничиваем угол наклона
      const tilt = Math.max(-0.3, Math.min(0.3, dx * 0.07));
      setBasketTilt(tilt);
      lastBasketX.current = basketX;
    }, 16);
    return () => clearInterval(handle);
  }, [basketX, gameState]);

  // --- Исправление highScore и сохранение статистики ---
  useEffect(() => {
    if (gameState === 'result') {
      // Сначала обновляем highScore
      setGameStats(prev => {
        const newStats = score > prev.highScore 
          ? { ...prev, highScore: score }
          : prev;
          
        if (score > prev.highScore) {
          updateAchievements(newStats);
          // Сохраняем данные
          saveGameDataSync();
        }
        
        return newStats;
      });
    }
  }, [gameState, score, loyaltyCard.number, achievements]);

  // --- Страница рейтинга ---
  // Функция для маскирования номера
  const maskNumber = (number: string) => {
    if (number.length < 5) return number; // Если номер слишком короткий, возвращаем как есть
    return `${number.slice(0, 2)}${'*'.repeat(number.length - 5)}${number.slice(-3)}`;
  };

  const renderLeaderboard = () => {
    return (
      <div style={{
        width: '90%',
        maxWidth: '600px',
        margin: '0 auto',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        boxSizing: 'border-box',
        padding: '40px 0',
        textAlign: 'center',
        zIndex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#fff' }}>Лучшая десятка игроков</h2>
        <div style={{ fontSize: '18px', marginBottom: '20px', color: '#fff' }}>
          Ваше место {userPlace || '-'} из {leaderboard.length > 0 ? leaderboard[0].totalPlayers : 0}
        </div>
        <div style={{ 
          flex: 1,
          display: 'flex', 
          flexDirection: 'column', 
          gap: 10, 
          marginBottom: 30, 
          maxHeight: 'calc(100dvh - 200px)',
          overflowY: 'auto'
        }}>
          {isLeaderboardLoading ? (
            Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)',
                borderRadius: 10,
                height: 38,
                width: '100%',
                animation: 'skeleton-loading 1.2s infinite linear',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '2px solid #eee',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <span style={{ width: 120, height: 18, background: '#e0e0e0', borderRadius: 4, marginLeft: 16 }}></span>
                <span style={{ width: 80, height: 18, background: '#e0e0e0', borderRadius: 4, marginRight: 16 }}></span>
              </div>
            ))
          ) : (
            leaderboard.map((item, idx) => (
              <div key={item.id} style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: 10,
                fontSize: 16,
                fontWeight: 700,
                color: idx === 0 ? '#d4af37' : '#222',
                border: idx === 0 ? '2px solid #d4af37' : '2px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>#{idx + 1} {maskNumber(item.id)}</span>
                <span>Рекорд: {item.score}</span>
              </div>
            ))
          )}
        </div>
        <style>{`
          @keyframes skeleton-loading {
            0% { background-position: -200px 0; }
            100% { background-position: calc(200px + 100%) 0; }
          }
        `}</style>
        <button
          onClick={() => setGameState('profile')}
          style={{
            padding: '10px',
            fontSize: '14px',
            backgroundColor: '#E50046',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Назад
        </button>
      </div>
    );
  };

  useEffect(() => {
    if (gameState === 'leaderboard') {
      setIsLeaderboardLoading(true);
      fetchLeaderboard().then((data) => {
        setLeaderboard(data);
        setIsLeaderboardLoading(false);
      });
      if (loyaltyCard.number) {
        fetchUserPlace(loyaltyCard.number).then((place) => {
          setUserPlace(place);
        });
      }
    }
  }, [gameState, loyaltyCard.number]);

  const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    try {
      if (!db) {
        console.error('Firestore не инициализирован');
        return [];
      }

      const statsRef = collection(db, 'stats');
      const q = query(statsRef, orderBy('highScore', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const totalPlayers = (await getCountFromServer(statsRef)).data().count;
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name || 'Аноним',
        score: doc.data().highScore || 0,
        totalPlayers
      }));
    } catch (error) {
      console.error('Ошибка при загрузке таблицы лидеров:', error);
      return [];
    }
  };

  const fetchUserPlace = async (userId: string): Promise<number> => {
    try {
      if (!db) {
        console.error('Firestore не инициализирован');
        return 0;
      }

      const userDoc = await getDoc(doc(db, 'stats', userId));
      if (!userDoc.exists()) {
        console.warn('Документ пользователя не найден');
        return 0;
      }

      const userScore = userDoc.data().highScore || 0;
      const statsRef = collection(db, 'stats');
      const q = query(statsRef, where('highScore', '>', userScore));
      const snapshot = await getDocs(q);
      return snapshot.size + 1;
    } catch (error) {
      console.error('Ошибка при определении места пользователя:', error);
      return 0;
    }
  };

  // Добавляю useEffect для отправки данных только при завершении игры
  useEffect(() => {
    if (gameState === 'result' && loyaltyCard.number) {
      saveStats(loyaltyCard.number, gameStats);
      saveAchievements(loyaltyCard.number, achievements);
    }
  }, [gameState]);

  // При загрузке компонента пробую взять карту из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('loyaltyCard');
    if (saved) {
      const card = JSON.parse(saved);
      if (card && card.number) {
        setLoyaltyCard(card);
      }
    }
  }, []);

  // Добавляем функцию для загрузки админ-статистики
  const loadAdminStats = async () => {
    try {
      const loyaltyCardsSnapshot = await getDocs(collection(db, 'loyaltyCards'));
      const loyaltyCards = loyaltyCardsSnapshot.docs.map(doc => doc.data());
      
      const statsSnapshot = await getDocs(collection(db, 'stats'));
      const stats = statsSnapshot.docs.map(doc => doc.data());
      
      const totalStats: GameStats = {
        highScore: 0,
        totalPlayTime: 0,
        timeUnderSlowEffect: 0,
        itemsCaught: {} as { [key in GameObject['type']]: number },
        gamesPlayed: 0,
        deathsByAnvil: 0
      };
      
      stats.forEach(stat => {
        totalStats.totalPlayTime += stat.totalPlayTime || 0;
        totalStats.timeUnderSlowEffect += stat.timeUnderSlowEffect || 0;
        totalStats.gamesPlayed += stat.gamesPlayed || 0;
        totalStats.deathsByAnvil += stat.deathsByAnvil || 0;
        
        // Объединяем статистику пойманных предметов
        if (stat.itemsCaught) {
          Object.entries(stat.itemsCaught).forEach(([item, count]) => {
            const key = item as GameObject['type'];
            if (key in totalStats.itemsCaught && typeof count === 'number') {
              totalStats.itemsCaught[key] = (totalStats.itemsCaught[key] || 0) + count;
            }
          });
        }
      });
      
      // Формируем top100 с id документа
      const top100 = statsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          score: doc.data().highScore || 0
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);
      
      setAdminStats({
        totalPlayers: loyaltyCards.length,
        totalGames: totalStats.gamesPlayed,
        totalStats,
        top100
      });
    } catch (error) {
      console.error('Ошибка при загрузке админ-статистики:', error);
    }
  };

  // Добавляем рендер страницы админ-статистики
  const renderAdminStats = () => {
    return (
      <div style={{
        width: '90%',
        maxWidth: '800px',
        margin: '0 auto',
        minHeight: '100dvh',
        boxSizing: 'border-box',
        padding: '40px 0',
        textAlign: 'center',
        zIndex: 1,
        color: '#fff'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Общая статистика</h2>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>Общая статистика</h3>
          <p>Всего игроков: {adminStats.totalPlayers}</p>
          <p>Всего сыграно игр: {adminStats.totalGames}</p>
          <p>Общее время в игре: {Math.floor(adminStats.totalStats.totalPlayTime / 1000)} сек</p>
          <p>Общее время под замедлением: {Math.floor(adminStats.totalStats.timeUnderSlowEffect / 1000)} сек</p>
          
          <h4 style={{ fontSize: '18px', marginTop: '15px', marginBottom: '10px' }}>Поймано предметов:</h4>
          {Object.entries(adminStats.totalStats.itemsCaught).map(([item, count]) => (
            <p key={item}>{item}: {count}</p>
          ))}
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '20px',
          borderRadius: '10px',
          maxHeight: '500px',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px' }}>Топ-100 игроков</h3>
          {adminStats.top100.map((player, index) => (
            <div key={player.id} style={{
              padding: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>#{index + 1} ID: {player.id}</span>
              <span>Рекорд: {player.score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Добавляем обработку URL для админ-статистики
  useEffect(() => {
    if (window.location.pathname === '/stats') {
      setGameState('adminStats');
      loadAdminStats(); // Загружаем данные сразу
    }
  }, []);

  // Добавляем useEffect для загрузки общей статистики
  useEffect(() => {
    const loadTotalStats = async () => {
      try {
        if (!db) {
          console.error('Firestore не инициализирован');
          return;
        }

        // Получаем все статистики
        const statsSnapshot = await getDocs(collection(db, 'stats'));
        let totalGames = 0;
        const totalStats = {
          itemsCaught: {} as { [key: string]: number },
          timeUnderSlowEffect: 0,
          totalPlayTime: 0
        };
        
        // Создаем промисы для всех операций
        const statsPromises = statsSnapshot.docs.map(async (doc) => {
          const data = await doc.data();
          totalGames += data.gamesPlayed || 0;
          totalStats.timeUnderSlowEffect += data.timeUnderSlowEffect || 0;
          totalStats.totalPlayTime += data.totalPlayTime || 0;
          
          if (data.itemsCaught) {
            Object.entries(data.itemsCaught).forEach(([item, count]) => {
              totalStats.itemsCaught[item] = (totalStats.itemsCaught[item] || 0) + (count as number);
            });
          }
        });

        // Ждем завершения всех операций
        await Promise.all(statsPromises);
        
        // Формируем totalStats с нужными полями
        const fullTotalStats: GameStats = {
          gamesPlayed: totalGames,
          totalPlayTime: totalStats.totalPlayTime,
          deathsByAnvil: 0, // Можно добавить подсчет, если нужно
          itemsCaught: totalStats.itemsCaught,
          timeUnderSlowEffect: totalStats.timeUnderSlowEffect,
          highScore: 0 // Можно добавить подсчет максимального рекорда, если нужно
        };
        setAdminStats(prev => ({
          ...prev,
          totalPlayers: statsSnapshot.size,
          totalGames,
          totalStats: fullTotalStats
        }));
      } catch (error) {
        console.error('Ошибка при загрузке общей статистики:', error);
      }
    };

    if (gameState === 'stats') {
      loadTotalStats();
    }
  }, [gameState]);

  // Функция для синхронного сохранения данных
  const saveGameDataSync = async () => {
    if (!loyaltyCard.number) return;
    
    try {
      // Сначала сохраняем в Firebase
      await saveStats(loyaltyCard.number, gameStats);
      await saveAchievements(loyaltyCard.number, achievements);
      
      // Проверяем корректность сохранения
      const isVerified = await verifySave(loyaltyCard.number, gameStats);
      if (!isVerified) {
        console.error('Ошибка верификации сохранения, пробуем еще раз...');
        // Повторная попытка сохранения
        await saveStats(loyaltyCard.number, gameStats);
        const secondVerification = await verifySave(loyaltyCard.number, gameStats);
        if (!secondVerification) {
          throw new Error('Не удалось сохранить данные после повторной попытки');
        }
      }
      
      // После успешного сохранения в Firebase, обновляем localStorage
      localStorage.setItem(`stats_${loyaltyCard.number}`, JSON.stringify(gameStats));
      console.log('Данные успешно сохранены и верифицированы');
    } catch (error) {
      console.error('Ошибка при сохранении данных:', error);
      throw error; // Пробрасываем ошибку дальше для обработки
    }
  };

  // Обновляем useEffect для сохранения статистики
  useEffect(() => {
    if (gameState === 'result') {
      setGameStats(prev => {
        if (score > prev.highScore) {
          const newStats = { ...prev, highScore: score };
          // Немедленно сохраняем при обновлении рекорда
          saveGameDataSync();
          return newStats;
        }
        return prev;
      });
    }
  }, [gameState, score]);

  // Обновляем useEffect для периодического обновления данных
  useEffect(() => {
    if (loyaltyCard.number) {
      // Загружаем данные при монтировании
      loadGameData();
      
      // Устанавливаем интервал обновления каждые 30 секунд
      const interval = setInterval(() => {
        loadGameData();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [loyaltyCard.number]);

  // Обновляем обработчик перед уходом со страницы
  useEffect(() => {
    const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
      if (gameState === 'result' && loyaltyCard.number) {
        // Пытаемся синхронно сохранить перед уходом
        try {
          await saveGameDataSync();
        } catch (error) {
          console.error('Ошибка при сохранении перед уходом:', error);
          // Показываем предупреждение пользователю
          e.preventDefault();
          e.returnValue = '';
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameState, loyaltyCard.number, gameStats, achievements]);

  // Добавляем сохранение при переходе между страницами
  useEffect(() => {
    if (gameState === 'result') {
      const handleStateChange = async () => {
        try {
          await saveGameDataSync();
        } catch (error) {
          console.error('Ошибка при сохранении при смене состояния:', error);
        }
      };

      return () => {
        handleStateChange();
      };
    }
  }, [gameState]);

  // Функция для загрузки данных с Firebase
  const loadGameData = async () => {
    if (!loyaltyCard.number) return;
    
    try {
      const stats = await loadStats(loyaltyCard.number);
      if (stats) {
        setGameStats(stats);
        localStorage.setItem(`stats_${loyaltyCard.number}`, JSON.stringify(stats));
      }
      
      const ach = await loadAchievements(loyaltyCard.number);
      if (ach) {
        setAchievements(ach);
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
    }
  };

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      height: 'calc(var(--dvh, 1dvh) * 100)',
      fontFamily: '"Play", Arial, sans-serif',
      background: 'transparent',
      zIndex: 1,
      overflow: 'hidden'
    }}>
      {gameState === 'playing' && (
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          style={{ 
            display: 'block',
            width: '100%',
            height: '100%',
            background: 'transparent',
            touchAction: 'none',
            zIndex: 2,
            position: 'relative',
            marginTop: 0,
            marginBottom: 0
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      )}
      {gameState === 'menu' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderMenu()}</div>
      )}
      {gameState === 'result' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{showGift ? renderGift() : renderResult()}</div>
      )}
      {gameState === 'profile' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderProfile()}</div>
      )}
      {gameState === 'auth' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderAuth()}</div>
      )}
      {gameState === 'stats' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderStats()}</div>
      )}
      {gameState === 'prizes' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderPrizes()}</div>
      )}
      {gameState === 'howtoplay' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderHowToPlay()}</div>
      )}
      {gameState === 'prizeinfo' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderPrizeInfo()}</div>
      )}
      {gameState === 'leaderboard' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderLeaderboard()}</div>
      )}
      {gameState === 'adminStats' && (
        <div style={{
          zIndex: 3,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>{renderAdminStats()}</div>
      )}
      {renderFloatingText()}
      {showPrize100 && renderPrize100()}
    </div>
  );
};

export default GameCanvas; 