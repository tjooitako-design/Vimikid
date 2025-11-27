import React, { useState, useEffect, useRef } from 'react';
import { User, Language, Question, ScoreRecord, Badge, BADGE_DEFINITIONS, Song } from '../types';
import { checkAnswer, getInstructionText, numberToWords } from '../utils/languageUtils';
import { generateEncouragement } from '../services/geminiService';
import { Button } from './Button';

interface QuizProps {
  user: User;
  language: Language;
  onFinish: () => void;
  onUpdateUser: (updatedUser: User) => void;
}

interface Feedback {
  isCorrect: boolean;
  correctAnswerText: string;
  correctAnswerNum: number;
  userAnswer: string;
}

export const Quiz: React.FC<QuizProps> = ({ user, language, onFinish, onUpdateUser }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Feedback state for immediate result display
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [showBadgeCelebration, setShowBadgeCelebration] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  // Refs
  const timerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Start/Stop Music
  useEffect(() => {
    const savedSongsStr = localStorage.getItem('vimiKid_songs');
    if (savedSongsStr) {
        const songs: Song[] = JSON.parse(savedSongsStr);
        // Find a song for this language, or fallback to any song
        const song = songs.find(s => s.language === language) || songs[0];
        
        if (song) {
            const audio = new Audio(song.url);
            audio.loop = true;
            audio.volume = 0.3; // Lower volume for background
            audioRef.current = audio;
            
            audio.play().catch(err => {
                console.log("Auto-play prevented:", err);
            });
        }
    }

    return () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };
  }, [language]);

  useEffect(() => {
    // --- QUESTION GENERATION LOGIC ---
    // 1. Load the Learning Queue (previously wrong answers)
    let queue: Question[] = [];
    try {
        const qData = localStorage.getItem('vimiKid_learningQueue');
        if (qData) {
            const parsed = JSON.parse(qData);
            queue = parsed[user.username] || [];
        }
    } catch (e) { console.error("Error loading queue", e); }

    const newQuestions: Question[] = [];

    // 2. Prioritize Wrong Questions first (up to 10)
    // We clone them to ensure the array has fresh objects
    const priorityQuestions = queue.slice(0, 10);
    newQuestions.push(...priorityQuestions);

    // 3. Fill the rest with random UNIQUE questions
    let attempts = 0;
    while (newQuestions.length < 10 && attempts < 2000) {
      attempts++;
      const num1 = Math.floor(Math.random() * 10) + 1; // 1-10
      const num2 = Math.floor(Math.random() * 10) + 1; // 1-10
      
      // Ensure Uniqueness: Check if {num1, num2} is already in the list
      const exists = newQuestions.some(q => q.num1 === num1 && q.num2 === num2);
      
      if (!exists) {
        newQuestions.push({ num1, num2, answer: num1 * num2 });
      }
    }

    setQuestions(newQuestions);

    timerRef.current = window.setInterval(() => {
        if (!isFinished) {
           setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isFinished, user.username]);

  // Focus input when moving to new question
  useEffect(() => {
    if (!feedback && !isFinished && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedback, isFinished]);

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFinished || isSubmitting || feedback) return;

    const currentQ = questions[currentIndex];
    const isCorrect = checkAnswer(userInput, currentQ.answer, language);
    const correctWord = numberToWords(currentQ.answer, language);

    // --- UPDATE LEARNING QUEUE ---
    try {
        const qData = localStorage.getItem('vimiKid_learningQueue');
        const parsed = qData ? JSON.parse(qData) : {};
        let userQueue: Question[] = parsed[user.username] || [];

        if (isCorrect) {
            // Correct answer: Remove from queue (Mastered)
            userQueue = userQueue.filter(q => !(q.num1 === currentQ.num1 && q.num2 === currentQ.num2));
        } else {
            // Wrong answer: Add to queue if not already there
            const exists = userQueue.some(q => q.num1 === currentQ.num1 && q.num2 === currentQ.num2);
            if (!exists) {
                userQueue.push(currentQ);
            }
        }
        
        parsed[user.username] = userQueue;
        localStorage.setItem('vimiKid_learningQueue', JSON.stringify(parsed));
    } catch (err) {
        console.error("Queue update error", err);
    }
    // -----------------------------

    // Show Feedback
    setFeedback({
      isCorrect,
      correctAnswerText: correctWord,
      correctAnswerNum: currentQ.answer,
      userAnswer: userInput
    });

    if (isCorrect) {
        setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    setFeedback(null);
    setUserInput('');

    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentIndex(nextIndex);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Stop Music
    if (audioRef.current) {
        audioRef.current.pause();
    }
    
    const finalTime = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = score;
    
    // Calculate Coins (10 per point)
    const coins = finalScore * 10;
    setEarnedCoins(coins);
    
    setIsFinished(true);

    // Check Badges
    const earnedBadges: Badge[] = [];
    const currentBadges = user.badges || [];
    const hasBadge = (id: string) => currentBadges.some(b => b.id === id);

    // Badge Logic
    if (finalScore === 10 && !hasBadge('perfect_10')) {
        earnedBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'perfect_10')!, unlockedAt: new Date().toISOString() });
    }
    
    // Rule: Must answer more than 6 questions correctly AND be under 60 seconds
    if (finalTime < 60 && finalScore > 6 && !hasBadge('speedster')) {
        earnedBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'speedster')!, unlockedAt: new Date().toISOString() });
    }
    
    if (finalScore === 10 && language === 'zh' && !hasBadge('mandarin_master')) {
        earnedBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'mandarin_master')!, unlockedAt: new Date().toISOString() });
    }
    // High Five: Perfect score AND quiz had a 5x question
    const hasFive = questions.some(q => q.num1 === 5 || q.num2 === 5);
    if (finalScore === 10 && hasFive && !hasBadge('high_five')) {
        earnedBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'high_five')!, unlockedAt: new Date().toISOString() });
    }
    // Math Whiz: Total games played >= 5
    const existingScoresStr = localStorage.getItem('vimiKid_scores');
    const existingScores: ScoreRecord[] = existingScoresStr ? JSON.parse(existingScoresStr) : [];
    const userGamesCount = existingScores.filter(s => s.username === user.username).length + 1;
    if (userGamesCount >= 5 && !hasBadge('math_whiz')) {
        earnedBadges.push({ ...BADGE_DEFINITIONS.find(b => b.id === 'math_whiz')!, unlockedAt: new Date().toISOString() });
    }

    setNewBadges(earnedBadges);
    if (earnedBadges.length > 0) {
        setShowBadgeCelebration(true);
    }

    // UPDATE USER DATA (Points + Badges)
    const updatedUser = { 
        ...user, 
        badges: [...currentBadges, ...earnedBadges],
        points: (user.points || 0) + coins
    };
    
    const usersStr = localStorage.getItem('vimiKid_users');
    if (usersStr) {
        const users: User[] = JSON.parse(usersStr);
        const userIndex = users.findIndex(u => u.username === user.username);
        if (userIndex !== -1) {
            users[userIndex] = updatedUser;
            localStorage.setItem('vimiKid_users', JSON.stringify(users));
        }
    }
    onUpdateUser(updatedUser);

    // Call AI for feedback
    const feedbackMsg = await generateEncouragement(finalScore, finalTime, language, user.username);
    setAiFeedback(feedbackMsg);

    // Save Record
    const record: ScoreRecord = {
      id: Date.now().toString(),
      username: user.username,
      date: new Date().toISOString(),
      score: finalScore,
      timeSeconds: finalTime,
      language,
      aiMessage: feedbackMsg
    };

    const existingStr = localStorage.getItem('vimiKid_scores');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    localStorage.setItem('vimiKid_scores', JSON.stringify([...existing, record]));
  };

  if (questions.length === 0) return <div className="flex h-screen items-center justify-center text-2xl font-bold text-blue-500">Loading Quiz...</div>;

  // --- BADGE CELEBRATION OVERLAY ---
  if (showBadgeCelebration) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
            <style>{`
                @keyframes spin-slow {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
                @keyframes pop-in {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden shadow-2xl border-4 border-yellow-400">
                {/* Rotating rays background effect */}
                <div 
                    className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-gradient-to-r from-yellow-200 via-orange-200 to-yellow-200 rounded-full opacity-50 z-0" 
                    style={{ 
                        animation: 'spin-slow 10s linear infinite',
                        transformOrigin: 'center'
                    }}
                ></div>
                
                <div className="relative z-10">
                     <h2 className="text-3xl font-black text-yellow-600 mb-2 uppercase tracking-wider drop-shadow-sm">Badge Unlocked!</h2>
                     <p className="text-gray-500 font-bold mb-6">You are amazing!</p>
                     
                     <div className="flex flex-col gap-8 mb-8">
                        {newBadges.map(badge => (
                            <div key={badge.id} style={{ animation: 'pop-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                                <div className="text-9xl mb-4 filter drop-shadow-xl transform hover:scale-110 transition-transform cursor-pointer">{badge.icon}</div>
                                <div className="text-2xl font-bold text-gray-800 leading-tight">{badge.name}</div>
                                <div className="text-yellow-600 font-bold text-sm mt-1">{badge.description}</div>
                            </div>
                        ))}
                     </div>

                     <Button 
                        onClick={() => setShowBadgeCelebration(false)} 
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-700 shadow-yellow-200 text-xl py-4 animate-pulse"
                        size="lg"
                     >
                        Collect Reward!
                     </Button>
                </div>
            </div>
        </div>
    );
  }

  // --- SCORE SUMMARY SCREEN ---
  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-yellow-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full text-center border-4 border-yellow-200">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-extrabold text-gray-800 mb-2">Quiz Complete!</h2>
            
            <div className="bg-yellow-100 p-4 rounded-xl mb-6 border-2 border-yellow-300">
                <span className="text-yellow-700 font-bold uppercase text-xs">Coins Earned</span>
                <div className="text-3xl font-black text-yellow-600">+{earnedCoins} 💰</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-2xl">
                    <p className="text-gray-500 text-sm font-bold uppercase">Score</p>
                    <p className="text-4xl font-black text-blue-600">{score} / 10</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-2xl">
                    <p className="text-gray-500 text-sm font-bold uppercase">Time</p>
                    <p className="text-4xl font-black text-purple-600">{elapsed}s</p>
                </div>
            </div>

            {aiFeedback ? (
                 <div className="bg-green-100 p-6 rounded-2xl mb-8 relative">
                    <div className="absolute -top-3 -left-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">VimiKid AI</div>
                    <p className="text-green-800 text-lg font-medium">"{aiFeedback}"</p>
                 </div>
            ) : (
                <div className="p-6 mb-8 text-gray-400 animate-pulse">Generating your report card...</div>
            )}

            <Button onClick={onFinish} size="lg" className="w-full">
                Back to Dashboard
            </Button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
        {/* Progress Bar */}
        <div className="h-4 bg-gray-200 w-full">
            <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${((currentIndex) / 10) * 100}%` }}
            />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                <div className="flex justify-between items-center mb-6 px-4">
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm font-bold text-gray-600">
                        Question {currentIndex + 1}/10
                    </div>
                    <div className="bg-white px-4 py-2 rounded-full shadow-sm font-bold text-blue-600">
                        ⏱️ {elapsed}s
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-b-8 border-gray-100 relative overflow-hidden">
                     {/* Decorative circles */}
                    <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-yellow-100 rounded-full opacity-50"></div>
                    <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-blue-100 rounded-full opacity-50"></div>

                    <div className="text-center mb-10 relative z-10">
                        <div className="flex flex-col items-center justify-center">
                            <div className="text-7xl md:text-8xl font-black text-gray-800 tracking-wider font-mono mb-4">
                                {currentQ.num1} &times; {currentQ.num2}
                            </div>
                            <div className="text-5xl md:text-6xl font-black text-blue-500 font-mono bg-blue-50 px-8 py-2 rounded-2xl border-2 border-blue-100">
                                = {feedback ? currentQ.answer : '?'}
                            </div>
                        </div>
                    </div>

                    {!feedback ? (
                        <form onSubmit={handleAnswerSubmit} className="relative z-10">
                            <label className="block text-center text-gray-500 mb-3 font-medium">
                                {getInstructionText(language)}
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="w-full text-center text-3xl md:text-4xl font-bold p-4 bg-white text-gray-900 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder-gray-300"
                                placeholder="..."
                                autoComplete="off"
                            />
                            <Button 
                                type="submit" 
                                size="lg" 
                                className="w-full mt-8 text-xl py-5"
                                disabled={!userInput.trim()}
                            >
                                Submit Answer
                            </Button>
                        </form>
                    ) : (
                        <div className="relative z-10 text-center animate-fadeIn">
                             <div className={`text-6xl mb-4 ${feedback.isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                {feedback.isCorrect ? 'Correct!' : 'Oops!'}
                             </div>
                             
                             <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100 flex flex-col items-center gap-4">
                                {!feedback.isCorrect && (
                                    <div className="w-full bg-red-50 p-3 rounded-lg border border-red-100">
                                        <p className="text-red-400 text-xs uppercase font-bold mb-1">You Answered</p>
                                        <div className="text-2xl font-bold text-red-600 line-through decoration-2">
                                            {feedback.userAnswer || '(nothing)'}
                                        </div>
                                    </div>
                                )}
                                <div className="w-full">
                                    <p className="text-green-500 text-xs uppercase font-bold mb-1">Correct Answer</p>
                                    <div className="text-5xl font-black text-gray-800 mb-1">{feedback.correctAnswerNum}</div>
                                    <div className="text-2xl text-blue-600 font-medium capitalize">{feedback.correctAnswerText}</div>
                                </div>
                             </div>

                             <Button 
                                onClick={handleNextQuestion}
                                variant={feedback.isCorrect ? 'success' : 'primary'}
                                size="lg" 
                                className="w-full text-xl py-5"
                                autoFocus
                            >
                                {currentIndex < 9 ? 'Next Question' : 'Finish Quiz'}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};