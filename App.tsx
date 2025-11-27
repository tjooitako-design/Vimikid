import React, { useState, useEffect } from 'react';
import { User, Language, AppState } from './types';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Quiz } from './components/Quiz';
import { AdminPanel } from './components/AdminPanel';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.AUTH);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');

  // Load user from session storage
  useEffect(() => {
    const savedUser = sessionStorage.getItem('vimiKid_currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setAppState(AppState.DASHBOARD);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('vimiKid_currentUser', JSON.stringify(user));
    setAppState(AppState.DASHBOARD);
  };

  const handleAdminLogin = () => {
    setAppState(AppState.ADMIN);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('vimiKid_currentUser');
    setAppState(AppState.AUTH);
  };

  const handleStartQuiz = (lang: Language) => {
    setSelectedLanguage(lang);
    setAppState(AppState.PLAYING);
  };

  const handleQuizFinished = () => {
    setAppState(AppState.DASHBOARD);
  };

  const handleUserUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    sessionStorage.setItem('vimiKid_currentUser', JSON.stringify(updatedUser));
  };

  return (
    <div className="font-sans text-gray-800 antialiased">
      {appState === AppState.AUTH && (
        <Auth onLogin={handleLogin} onAdminLogin={handleAdminLogin} />
      )}

      {appState === AppState.ADMIN && (
        <AdminPanel onLogout={() => setAppState(AppState.AUTH)} />
      )}
      
      {appState === AppState.DASHBOARD && currentUser && (
        <Dashboard 
          user={currentUser} 
          onStart={handleStartQuiz} 
          onLogout={handleLogout}
          onUpdateUser={handleUserUpdate}
        />
      )}

      {appState === AppState.PLAYING && currentUser && (
        <Quiz 
          user={currentUser} 
          language={selectedLanguage} 
          onFinish={handleQuizFinished} 
          onUpdateUser={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default App;