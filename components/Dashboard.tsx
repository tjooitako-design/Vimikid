import React, { useMemo, useState, useEffect } from 'react';
import { User, ScoreRecord, Language, BADGE_DEFINITIONS, Gift, Badge } from '../types';
import { Button } from './Button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: User;
  onStart: (lang: Language) => void;
  onLogout: () => void;
  onUpdateUser: (u: User) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onStart, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'ranking' | 'shop'>('home');
  const [availableGifts, setAvailableGifts] = useState<Gift[]>([]);
  const [leaderboard, setLeaderboard] = useState<User[]>([]);

  useEffect(() => {
    // Load gifts
    const giftsStr = localStorage.getItem('vimiKid_gifts');
    if (giftsStr) setAvailableGifts(JSON.parse(giftsStr));

    // Load leaderboard users
    const usersStr = localStorage.getItem('vimiKid_users');
    let allUsers: User[] = [];
    if (usersStr) {
        allUsers = JSON.parse(usersStr);
        // Sort by Points (descending)
        const sorted = [...allUsers].sort((a, b) => (b.points || 0) - (a.points || 0));
        setLeaderboard(sorted);

        // --- CALCULATE PASSIVE BADGES (Rank/Accumulation) ---
        // We do this check here so the dashboard always reflects true status
        let badgesChanged = false;
        let myBadges = user.badges || [];
        const hasBadge = (id: string) => myBadges.some(b => b.id === id);
        const addBadge = (id: string) => {
             if (!hasBadge(id)) {
                 const def = BADGE_DEFINITIONS.find(b => b.id === id);
                 if (def) {
                    myBadges = [...myBadges, { ...def, unlockedAt: new Date().toISOString() }];
                    badgesChanged = true;
                 }
             }
        };

        const myRank = sorted.findIndex(u => u.username === user.username) + 1;
        
        // 1. Ranking Badges
        if (myRank > 0 && myRank <= 3) addBadge('top_3');
        if (myRank > 0 && myRank <= 10) addBadge('top_10');

        // 2. State Champion Badge
        if (user.state) {
            const stateUsers = sorted.filter(u => u.state === user.state);
            // If I am the top of my state (index 0 in state filtered list)
            if (stateUsers.length > 0 && stateUsers[0].username === user.username) {
                addBadge('state_champ');
            }
        }

        // 3. Accumulation Badges
        if (user.points >= 1000) addBadge('coin_master');

        // 4. Veteran Badge (Game Count)
        const scoresStr = localStorage.getItem('vimiKid_scores');
        if (scoresStr) {
            const scores: ScoreRecord[] = JSON.parse(scoresStr);
            const myGames = scores.filter(s => s.username === user.username).length;
            if (myGames >= 20) addBadge('veteran');
        }

        if (badgesChanged) {
            const updatedUser = { ...user, badges: myBadges };
            // Save to LS
            const userIndex = allUsers.findIndex(u => u.username === user.username);
            if (userIndex !== -1) {
                allUsers[userIndex] = updatedUser;
                localStorage.setItem('vimiKid_users', JSON.stringify(allUsers));
            }
            onUpdateUser(updatedUser);
        }
    }
  }, [activeTab]); // Reload when tab changes

  const history: ScoreRecord[] = useMemo(() => {
    const allScoresStr = localStorage.getItem('vimiKid_scores');
    if (!allScoresStr) return [];
    const allScores: ScoreRecord[] = JSON.parse(allScoresStr);
    return allScores.filter(s => s.username === user.username).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [user.username]);

  const chartData = useMemo(() => {
    return [...history].slice(0, 10).reverse().map((h, i) => ({
      name: i + 1,
      score: h.score,
    }));
  }, [history]);

  const userBadges = user.badges || [];

  const handleRedeem = (gift: Gift) => {
    if (user.points < gift.cost) {
        alert("Not enough coins!");
        return;
    }
    const confirm = window.confirm(`Redeem ${gift.name} for ${gift.cost} coins?`);
    if (confirm) {
        const updatedUser = { 
            ...user, 
            points: user.points - gift.cost,
            redeemedGifts: [...(user.redeemedGifts || []), gift.id]
        };
        
        // Update LocalStorage
        const usersStr = localStorage.getItem('vimiKid_users');
        if (usersStr) {
            const users: User[] = JSON.parse(usersStr);
            const idx = users.findIndex(u => u.username === user.username);
            if (idx !== -1) {
                users[idx] = updatedUser;
                localStorage.setItem('vimiKid_users', JSON.stringify(users));
            }
        }
        onUpdateUser(updatedUser);
        alert("Gift Redeemed!");
    }
  };

  const renderHome = () => (
    <>
         {/* Badges Section */}
        <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-yellow-100 mb-8">
          <h2 className="text-xl font-bold mb-4 text-yellow-600 flex items-center gap-2">
            <span>🏆</span> Your Trophy Case
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
             {BADGE_DEFINITIONS.map(def => {
               const earned = userBadges.find(b => b.id === def.id);
               return (
                 <div key={def.id} className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${earned ? 'bg-yellow-50 border-yellow-200 opacity-100 scale-100' : 'bg-gray-50 border-gray-100 opacity-50 grayscale'}`}>
                    <div className="text-4xl mb-2">{def.icon}</div>
                    <div className="font-bold text-xs text-center text-gray-700 leading-tight">{def.name}</div>
                    <div className="text-[10px] text-center text-gray-500 mt-1 hidden sm:block">{def.description}</div>
                 </div>
               );
             })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Action Card */}
          <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-blue-100 flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Start New Quiz</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <Button onClick={() => onStart('en')} className="bg-indigo-500 hover:bg-indigo-600 border-indigo-700">
                English
              </Button>
              <Button onClick={() => onStart('ms')} className="bg-orange-500 hover:bg-orange-600 border-orange-700">
                Malay
              </Button>
              <Button onClick={() => onStart('zh')} className="bg-pink-500 hover:bg-pink-600 border-pink-700">
                Mandarin
              </Button>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white p-6 rounded-3xl shadow-lg border-2 border-purple-100">
            <h2 className="text-xl font-bold mb-4 text-purple-800 ml-2">Your Progress</h2>
            {chartData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 10]} hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 font-medium bg-gray-50 rounded-2xl">
                No games played yet!
              </div>
            )}
          </div>
        </div>
    </>
  );

  const renderRanking = () => (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-yellow-200">
        <div className="bg-yellow-400 p-6 text-white text-center">
            <h2 className="text-3xl font-black uppercase tracking-widest">Leaderboard</h2>
            <p className="opacity-90 font-medium">Top Students in Malaysia</p>
        </div>
        <div className="divide-y divide-gray-100">
            {leaderboard.map((u, index) => (
                <div key={u.username + index} className={`p-4 flex items-center justify-between ${user.username === u.username ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-full font-black text-lg ${index === 0 ? 'bg-yellow-500 text-white' : index === 1 ? 'bg-gray-300 text-gray-700' : index === 2 ? 'bg-orange-300 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            {index + 1}
                        </div>
                        <div>
                            <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                {u.username}
                                {index === 0 && <span>👑</span>}
                            </div>
                            <div className="text-xs text-gray-500 font-medium flex gap-2">
                                <span>{u.state || 'Malaysia'}</span>
                                {u.yearOfBirth && <span>• Born {u.yearOfBirth}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="font-black text-2xl text-yellow-600">{u.points || 0}</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Coins</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderShop = () => (
    <div className="space-y-6">
        <div className="bg-purple-600 text-white p-8 rounded-3xl shadow-lg text-center relative overflow-hidden">
             <div className="relative z-10">
                <h2 className="text-3xl font-black mb-2">Gift Shop</h2>
                <p className="text-purple-200">Use your coins to get cool rewards!</p>
                <div className="mt-4 bg-white/20 backdrop-blur-sm inline-block px-6 py-2 rounded-full border border-white/30">
                    Your Balance: <span className="font-bold text-yellow-300 text-xl">{user.points} Coins</span>
                </div>
             </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {availableGifts.length === 0 ? (
                <div className="col-span-full text-center p-12 text-gray-400 bg-white rounded-3xl">
                    Master hasn't added any gifts yet! Check back later.
                </div>
            ) : (
                availableGifts.map(gift => (
                    <div key={gift.id} className="bg-white rounded-3xl shadow-md border-2 border-gray-100 p-4 flex flex-col">
                        <div className="h-40 bg-gray-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                            <img src={gift.imageUrl} alt={gift.name} className="h-full w-full object-contain" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 mb-1">{gift.name}</h3>
                        <div className="text-yellow-600 font-bold mb-4">{gift.cost} Coins</div>
                        <Button 
                            className="mt-auto w-full"
                            variant={user.points >= gift.cost ? 'success' : 'secondary'}
                            disabled={user.points < gift.cost}
                            onClick={() => handleRedeem(gift)}
                        >
                            {user.points >= gift.cost ? 'Redeem' : 'Need more coins'}
                        </Button>
                    </div>
                ))
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-blue-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl shadow-sm gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Hi, {user.username}! 👋</h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
                 <span className="font-bold text-yellow-500">💰 {user.points || 0} Coins</span>
                 <span>•</span>
                 <span>{user.state || 'Unknown State'}</span>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={onLogout}>Logout</Button>
        </header>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8 gap-2 bg-white/50 p-2 rounded-2xl backdrop-blur-sm w-fit mx-auto">
            <button 
                onClick={() => setActiveTab('home')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'home' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:bg-white/50'}`}
            >
                Dashboard
            </button>
            <button 
                onClick={() => setActiveTab('ranking')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'ranking' ? 'bg-yellow-500 text-white shadow-md' : 'text-gray-500 hover:bg-white/50'}`}
            >
                Ranking
            </button>
            <button 
                onClick={() => setActiveTab('shop')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'shop' ? 'bg-purple-500 text-white shadow-md' : 'text-gray-500 hover:bg-white/50'}`}
            >
                Gift Shop
            </button>
        </div>

        {activeTab === 'home' && renderHome()}
        {activeTab === 'ranking' && renderRanking()}
        {activeTab === 'shop' && renderShop()}
      </div>
    </div>
  );
};