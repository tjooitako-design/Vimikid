import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Song, Gift, Language } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'music' | 'gifts' | 'backup'>('music');
  const [songs, setSongs] = useState<Song[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);

  // Song Form
  const [songName, setSongName] = useState('');
  const [songLang, setSongLang] = useState<Language>('en');
  const [songUrl, setSongUrl] = useState('');

  // Gift Form
  const [giftName, setGiftName] = useState('');
  const [giftCost, setGiftCost] = useState('');
  const [giftImage, setGiftImage] = useState('');

  useEffect(() => {
    const savedSongs = localStorage.getItem('vimiKid_songs');
    if (savedSongs) setSongs(JSON.parse(savedSongs));

    const savedGifts = localStorage.getItem('vimiKid_gifts');
    if (savedGifts) setGifts(JSON.parse(savedGifts));
  }, []);

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songName || !songUrl) return;

    const newSong: Song = {
      id: Date.now().toString(),
      name: songName,
      language: songLang,
      url: songUrl
    };

    const updatedSongs = [...songs, newSong];
    setSongs(updatedSongs);
    localStorage.setItem('vimiKid_songs', JSON.stringify(updatedSongs));
    setSongName('');
    setSongUrl('');
  };

  const handleAddGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftName || !giftCost || !giftImage) return;

    const newGift: Gift = {
      id: Date.now().toString(),
      name: giftName,
      cost: parseInt(giftCost),
      imageUrl: giftImage
    };

    const updatedGifts = [...gifts, newGift];
    setGifts(updatedGifts);
    localStorage.setItem('vimiKid_gifts', JSON.stringify(updatedGifts));
    setGiftName('');
    setGiftCost('');
    setGiftImage('');
  };

  const handleDeleteSong = (id: string) => {
    const updated = songs.filter(s => s.id !== id);
    setSongs(updated);
    localStorage.setItem('vimiKid_songs', JSON.stringify(updated));
  };

  const handleDeleteGift = (id: string) => {
    const updated = gifts.filter(g => g.id !== id);
    setGifts(updated);
    localStorage.setItem('vimiKid_gifts', JSON.stringify(updated));
  };

  const handleExportData = () => {
    const data = {
        users: JSON.parse(localStorage.getItem('vimiKid_users') || '[]'),
        scores: JSON.parse(localStorage.getItem('vimiKid_scores') || '[]'),
        songs: JSON.parse(localStorage.getItem('vimiKid_songs') || '[]'),
        gifts: JSON.parse(localStorage.getItem('vimiKid_gifts') || '[]'),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vimikid_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (json.users) localStorage.setItem('vimiKid_users', JSON.stringify(json.users));
            if (json.scores) localStorage.setItem('vimiKid_scores', JSON.stringify(json.scores));
            if (json.songs) localStorage.setItem('vimiKid_songs', JSON.stringify(json.songs));
            if (json.gifts) localStorage.setItem('vimiKid_gifts', JSON.stringify(json.gifts));
            
            alert('Database Restored Successfully! Reloading...');
            window.location.reload();
        } catch (err) {
            alert('Error parsing JSON file. Please check the format.');
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Master Control Panel 🛠️</h1>
          <Button variant="danger" onClick={onLogout}>Logout</Button>
        </header>

        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button 
              className={`flex-1 p-4 font-bold ${activeTab === 'music' ? 'bg-blue-50 text-blue-600 border-b-4 border-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('music')}
            >
              🎵 Music
            </button>
            <button 
              className={`flex-1 p-4 font-bold ${activeTab === 'gifts' ? 'bg-purple-50 text-purple-600 border-b-4 border-purple-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('gifts')}
            >
              🎁 Gifts
            </button>
            <button 
              className={`flex-1 p-4 font-bold ${activeTab === 'backup' ? 'bg-green-50 text-green-600 border-b-4 border-green-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('backup')}
            >
              💾 Backup
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'music' && (
              <div>
                <form onSubmit={handleAddSong} className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
                  <h3 className="font-bold text-lg mb-4">Add New Music</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                      placeholder="Song Name" 
                      value={songName}
                      onChange={e => setSongName(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 w-full"
                    />
                    <select 
                      value={songLang}
                      onChange={e => setSongLang(e.target.value as Language)}
                      className="p-3 rounded-lg border border-gray-300 w-full"
                    >
                      <option value="en">English</option>
                      <option value="ms">Malay</option>
                      <option value="zh">Mandarin</option>
                    </select>
                  </div>
                  <input 
                    placeholder="MP3 URL (e.g., https://example.com/song.mp3)" 
                    value={songUrl}
                    onChange={e => setSongUrl(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 w-full mb-4"
                  />
                  <Button type="submit">Add Song</Button>
                </form>

                <div className="space-y-4">
                  {songs.map(song => (
                    <div key={song.id} className="flex items-center justify-between p-4 border rounded-xl bg-white hover:bg-gray-50">
                      <div>
                        <div className="font-bold text-lg">{song.name}</div>
                        <div className="text-sm text-gray-500 uppercase">{song.language === 'en' ? 'English' : song.language === 'ms' ? 'Malay' : 'Mandarin'}</div>
                        <div className="text-xs text-gray-400 truncate w-64">{song.url}</div>
                      </div>
                      <div className="flex gap-2">
                        <audio controls src={song.url} className="h-8 w-32" />
                        <Button variant="danger" size="sm" onClick={() => handleDeleteSong(song.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                  {songs.length === 0 && <p className="text-gray-400 text-center">No songs added yet.</p>}
                </div>
              </div>
            )}

            {activeTab === 'gifts' && (
              <div>
                 <form onSubmit={handleAddGift} className="bg-gray-50 p-6 rounded-xl mb-8 border border-gray-200">
                  <h3 className="font-bold text-lg mb-4">Add New Gift</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input 
                      placeholder="Gift Name" 
                      value={giftName}
                      onChange={e => setGiftName(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 w-full"
                    />
                    <input 
                      type="number"
                      placeholder="Cost (Points)" 
                      value={giftCost}
                      onChange={e => setGiftCost(e.target.value)}
                      className="p-3 rounded-lg border border-gray-300 w-full"
                    />
                  </div>
                  <input 
                    placeholder="Image URL" 
                    value={giftImage}
                    onChange={e => setGiftImage(e.target.value)}
                    className="p-3 rounded-lg border border-gray-300 w-full mb-4"
                  />
                  <Button type="submit">Add Gift</Button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {gifts.map(gift => (
                    <div key={gift.id} className="border rounded-xl p-4 flex flex-col items-center text-center">
                        <img src={gift.imageUrl} alt={gift.name} className="w-24 h-24 object-contain mb-4" />
                        <div className="font-bold text-lg">{gift.name}</div>
                        <div className="text-yellow-600 font-bold mb-4">{gift.cost} Coins</div>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteGift(gift.id)}>Delete</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'backup' && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-6">💾</div>
                    <h2 className="text-2xl font-bold mb-4">Database Management</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div className="p-6 bg-blue-50 rounded-2xl border-2 border-blue-100">
                            <h3 className="font-bold text-lg mb-2">Export Data</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Save all records to a file. Keep this file safe!
                            </p>
                            <Button onClick={handleExportData} size="md" className="bg-blue-600 hover:bg-blue-700 border-blue-800">
                                Download JSON
                            </Button>
                        </div>

                        <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-100">
                            <h3 className="font-bold text-lg mb-2">Restore Data</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Upload a JSON file to sync data from another device.
                            </p>
                            <label className="cursor-pointer inline-flex items-center justify-center rounded-full font-bold shadow-md transition-all transform hover:scale-105 bg-yellow-500 hover:bg-yellow-600 text-white border-b-4 border-yellow-700 px-6 py-3 text-base">
                                <span>Upload JSON</span>
                                <input 
                                    type="file" 
                                    accept="application/json" 
                                    onChange={handleImportData}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    <p className="mt-8 text-sm text-gray-400 max-w-lg mx-auto">
                        Note: Since this app does not use a cloud server, you must manually Export data from one device and Import it to another to keep them in sync.
                    </p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};