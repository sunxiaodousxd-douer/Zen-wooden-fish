import React, { useState, useEffect } from 'react';

interface User {
  phone: string;
  nickname: string;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (user: User) => void;
  initialUser: User | null;
  t: any;
}

export const UserModal: React.FC<UserModalProps> = ({ isOpen, onClose, onConfirm, initialUser, t }) => {
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && initialUser) {
      setPhone(initialUser.phone);
      setNickname(initialUser.nickname);
    } else if (isOpen) {
      setPhone('');
      setNickname('');
    }
    setError('');
  }, [isOpen, initialUser]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!phone.trim()) {
      setError(t.phoneError);
      return;
    }
    if (!nickname.trim()) {
      setError(t.nicknameError);
      return;
    }
    onConfirm({ phone: phone.trim(), nickname: nickname.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl p-6 animate-slide-up flex flex-col">
        <h2 className="text-xl text-stone-200 font-serif tracking-widest mb-6 text-center">
          {initialUser ? t.editProfile : t.loginTitle}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-stone-500 uppercase tracking-widest mb-1">{t.phoneLabel}</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.phonePlaceholder}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-xs text-stone-500 uppercase tracking-widest mb-1">{t.nicknameLabel}</label>
            <input 
              type="text" 
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t.nicknamePlaceholder}
              className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2 text-stone-200 focus:outline-none focus:border-amber-600 transition-colors"
            />
          </div>

          {error && <div className="text-red-400 text-xs text-center">{error}</div>}
        </div>

        <div className="flex space-x-3 mt-8">
          <button 
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-stone-800 text-stone-400 hover:bg-stone-700 transition-colors text-sm"
          >
            {t.cancel}
          </button>
          <button 
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-lg bg-amber-700 text-stone-100 hover:bg-amber-600 shadow-lg shadow-amber-900/30 transition-all text-sm font-bold"
          >
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};