export type Language = 'en' | 'ms' | 'zh';

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string; // ISO date string
}

export interface User {
  username: string;
  pin: string; // Simple password
  yearOfBirth?: number;
  state?: string;
  whatsappNumber?: string; // For password recovery
  points: number; // For redemption
  badges?: Badge[];
  redeemedGifts?: string[]; // IDs of gifts
}

export interface ScoreRecord {
  id: string;
  username: string;
  date: string;
  score: number; // 0-10
  timeSeconds: number;
  language: Language;
  aiMessage?: string;
}

export interface Question {
  num1: number;
  num2: number;
  answer: number;
}

export interface Song {
  id: string;
  name: string;
  language: Language;
  url: string; // URL or DataURI
}

export interface Gift {
  id: string;
  name: string;
  cost: number;
  imageUrl: string;
}

export interface AdminSettings {
  adminWhatsapp: string;
}

export enum AppState {
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
  PLAYING = 'PLAYING',
  ADMIN = 'ADMIN'
}

export const MALAYSIA_STATES = [
  'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 
  'Pahang', 'Perak', 'Perlis', 'Penang', 'Sabah', 'Sarawak', 
  'Selangor', 'Terengganu', 'W.P. Kuala Lumpur', 'W.P. Labuan', 'W.P. Putrajaya'
];

export const BADGE_DEFINITIONS: Omit<Badge, 'unlockedAt'>[] = [
  // Performance Badges (Won during Quiz)
  { id: 'perfect_10', name: 'Perfect 10', icon: '🌟', description: 'Score 10/10 in a quiz' },
  { id: 'speedster', name: 'Speedster', icon: '⚡', description: 'Under 60s & >6 correct answers' },
  { id: 'mandarin_master', name: 'Mandarin Master', icon: '🧧', description: 'Score 10/10 in Mandarin' },
  { id: 'high_five', name: 'High Five', icon: '🖐️', description: 'Perfect score on a quiz with 5x tables' },
  { id: 'math_whiz', name: 'Math Whiz', icon: '🎓', description: 'Complete 5 quizzes' },

  // Achievement Badges (Awarded in Dashboard)
  { id: 'top_3', name: 'Podium Finisher', icon: '🏆', description: 'Reach Top 3 in Leaderboard' },
  { id: 'top_10', name: 'Top Ten', icon: '🏅', description: 'Reach Top 10 in Leaderboard' },
  { id: 'state_champ', name: 'State Hero', icon: '🏙️', description: '#1 Rank in your State' },
  { id: 'coin_master', name: 'Coin Master', icon: '💰', description: 'Earn 1,000 Total Coins' },
  { id: 'veteran', name: 'Veteran', icon: '🛡️', description: 'Play 20 Quizzes' },
];