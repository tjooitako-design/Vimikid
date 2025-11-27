import React, { useState } from 'react';
import { User, MALAYSIA_STATES } from '../types';
import { Button } from './Button';

interface AuthProps {
  onLogin: (user: User) => void;
  onAdminLogin: () => void;
}

type AuthMode = 'LOGIN' | 'REGISTER' | 'FORGOT_PIN';

export const Auth: React.FC<AuthProps> = ({ onLogin, onAdminLogin }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [error, setError] = useState('');

  // Forgot PIN State
  const [otpStep, setOtpStep] = useState(false); // false = enter name, true = enter OTP
  const [otpInput, setOtpInput] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [recoveryUser, setRecoveryUser] = useState<User | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Master Login Check
    if (mode === 'LOGIN' && username.toLowerCase() === 'admin' && pin === '8888') {
      onAdminLogin();
      return;
    }

    const storedUsersStr = localStorage.getItem('vimiKid_users');
    const storedUsers: User[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];

    // --- LOGIN LOGIC ---
    if (mode === 'LOGIN') {
        if (!username.trim() || pin.length < 3) {
            setError('Name required & PIN must be 3+ digits');
            return;
        }
        const user = storedUsers.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
        if (user) {
            // Ensure legacy fields exist
            const userWithFields = { 
                ...user, 
                badges: user.badges || [],
                points: user.points || 0,
                redeemedGifts: user.redeemedGifts || []
            };
            onLogin(userWithFields);
        } else {
            setError('Invalid name or PIN');
        }
    } 
    // --- REGISTER LOGIC ---
    else if (mode === 'REGISTER') {
        if (!username || !pin || !yearOfBirth || !selectedState || !whatsapp) {
            setError('Please fill in all fields');
            return;
        }
        if (storedUsers.find(u => u.username.toLowerCase() === username.toLowerCase())) {
            setError('User already exists!');
            return;
        }
        
        const newUser: User = { 
            username, 
            pin, 
            yearOfBirth: parseInt(yearOfBirth),
            state: selectedState,
            whatsappNumber: whatsapp,
            points: 0,
            badges: [],
            redeemedGifts: []
        };
        
        localStorage.setItem('vimiKid_users', JSON.stringify([...storedUsers, newUser]));
        onLogin(newUser);
    }
  };

  const handleForgotPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const storedUsersStr = localStorage.getItem('vimiKid_users');
    const storedUsers: User[] = storedUsersStr ? JSON.parse(storedUsersStr) : [];

    if (!otpStep) {
        // Step 1: Find User
        const user = storedUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) {
            setError('User not found.');
            return;
        }
        if (!user.whatsappNumber) {
            setError('No WhatsApp number linked to this account.');
            return;
        }

        // Generate Simulation OTP
        const simOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(simOtp);
        setRecoveryUser(user);
        setOtpStep(true);

        // Simulate API call
        setTimeout(() => {
            alert(`[SIMULATION]\nWhatsApp sent to ${user.whatsappNumber}.\nYour OTP Code is: ${simOtp}`);
        }, 500);

    } else {
        // Step 2: Verify OTP and Reset
        if (!recoveryUser) return;

        if (otpInput === generatedOtp) {
            if (pin.length < 3) {
                setError('New PIN must be 3+ digits');
                return;
            }

            // Update User
            const updatedUser = { ...recoveryUser, pin: pin };
            const updatedList = storedUsers.map(u => u.username === recoveryUser.username ? updatedUser : u);
            localStorage.setItem('vimiKid_users', JSON.stringify(updatedList));
            
            alert('Password Reset Successful! Please Login.');
            setMode('LOGIN');
            setOtpStep(false);
            setPin('');
            setOtpInput('');
        } else {
            setError('Invalid OTP Code');
        }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-b from-blue-200 to-purple-200">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border-4 border-white/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-blue-600 mb-2 tracking-tight">VimiKid</h1>
          <p className="text-gray-500 font-medium">Math Fun for Everyone!</p>
        </div>

        {mode === 'FORGOT_PIN' ? (
             <form onSubmit={handleForgotPinSubmit} className="space-y-4">
                <h3 className="text-xl font-bold text-center text-gray-700">Reset Password</h3>
                {!otpStep ? (
                    <>
                        <p className="text-sm text-center text-gray-500">Enter your username to receive an OTP via WhatsApp.</p>
                        <div>
                            <label className="block text-gray-700 font-bold mb-1 ml-2">Your Name</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                                placeholder="e.g. Adam"
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full">Send WhatsApp OTP</Button>
                    </>
                ) : (
                    <>
                         <p className="text-sm text-center text-gray-500">OTP sent to {recoveryUser?.whatsappNumber}</p>
                         <div>
                            <label className="block text-gray-700 font-bold mb-1 ml-2">Enter OTP Code</label>
                            <input
                                type="text"
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none text-center tracking-widest text-2xl"
                                placeholder="000000"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 font-bold mb-1 ml-2">New PIN</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none"
                                placeholder="New PIN"
                            />
                        </div>
                        <Button type="submit" size="lg" className="w-full bg-green-500 hover:bg-green-600 border-green-700">Reset & Login</Button>
                    </>
                )}
                 {error && <p className="text-red-500 text-center font-bold bg-red-100 py-2 rounded-xl">{error}</p>}
                 <button type="button" onClick={() => { setMode('LOGIN'); setError(''); }} className="w-full text-center text-gray-400 font-bold mt-4">Cancel</button>
             </form>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-gray-700 font-bold mb-1 ml-2">Your Name</label>
                <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="e.g. Adam"
                />
            </div>
            <div>
                <label className="block text-gray-700 font-bold mb-1 ml-2">Secret PIN</label>
                <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
                placeholder="e.g. 1234"
                />
            </div>

            {mode === 'REGISTER' && (
                <>
                    <div>
                        <label className="block text-gray-700 font-bold mb-1 ml-2">Year of Birth</label>
                        <input
                        type="number"
                        value={yearOfBirth}
                        onChange={(e) => setYearOfBirth(e.target.value)}
                        className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
                        placeholder="e.g. 2015"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-1 ml-2">WhatsApp Number</label>
                        <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors"
                        placeholder="e.g. 0123456789"
                        />
                        <p className="text-xs text-gray-400 ml-2 mt-1">Used to reset your PIN</p>
                    </div>
                    <div>
                        <label className="block text-gray-700 font-bold mb-1 ml-2">State (Malaysia)</label>
                        <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full px-5 py-3 rounded-2xl bg-gray-50 border-2 border-gray-200 focus:border-blue-400 focus:outline-none transition-colors appearance-none"
                        >
                            <option value="">Select State</option>
                            {MALAYSIA_STATES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </>
            )}

            {error && <p className="text-red-500 text-center font-bold bg-red-100 py-2 rounded-xl">{error}</p>}

            <Button type="submit" size="lg" className="w-full text-xl mt-4">
                {mode === 'REGISTER' ? 'Create Account' : 'Let\'s Play!'}
            </Button>
            </form>
        )}

        {mode !== 'FORGOT_PIN' && (
             <div className="mt-6 text-center space-y-2">
                <button
                    onClick={() => { setError(''); setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER'); }}
                    className="text-blue-500 hover:text-blue-700 underline font-semibold block w-full"
                >
                    {mode === 'REGISTER' ? 'Already have an account? Login' : 'New here? Join the fun!'}
                </button>
                {mode === 'LOGIN' && (
                    <button
                        onClick={() => { setError(''); setMode('FORGOT_PIN'); }}
                        className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
                    >
                        Forgot PIN?
                    </button>
                )}
            </div>
        )}
       
      </div>
    </div>
  );
};