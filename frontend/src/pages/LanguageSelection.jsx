import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'de', label: 'German' },
];

function LanguageSelection() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    // Prefer server-side value from authenticated user; fallback to localStorage
    const fromUser = user?.preferredLanguages;
    if (Array.isArray(fromUser) && fromUser.length) {
      setSelected(fromUser);
      return;
    }
    const saved = JSON.parse(localStorage.getItem('preferredLanguages') || '[]');
    setSelected(saved);
  }, []);

  const toggle = (code) => {
    setSelected((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      return [...prev, code];
    });
  };

  const save = async () => {
    // Try to update backend profile first (if logged in)
    if (user) {
      try {
        const res = await updateProfile({ preferredLanguages: selected });
        if (res.success) {
          localStorage.setItem('preferredLanguages', JSON.stringify(selected));
          toast.success('Language preferences saved');
          navigate('/dashboard');
          return;
        }
        toast.error(res.error || 'Failed to save preferences');
        return;
      } catch (err) {
        console.error('Failed to update preferences:', err);
        toast.error('Failed to save preferences');
        return;
      }
    }

    // If not logged in, fallback to localStorage
    localStorage.setItem('preferredLanguages', JSON.stringify(selected));
    toast.success('Language preferences saved locally');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-app text-app">
      <Navbar />
      <div className="p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-6 border border-brand-border">
          <h1 className="text-2xl font-bold mb-4">Select preferred languages</h1>
          <p className="text-sm text-gray-500 mb-6">You can choose multiple languages — we'll surface content for all selected languages.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => toggle(lang.code)}
                className={`p-4 border rounded-lg text-left hover:shadow-md transition flex items-center justify-between ${selected.includes(lang.code) ? 'border-brand-purple bg-brand-purple/10' : ''}`}
              >
                <div>
                  <div className="font-semibold">{lang.label}</div>
                  <div className="text-xs text-gray-500">{lang.code}</div>
                </div>
                <div className="text-sm text-brand-purple">{selected.includes(lang.code) ? 'Selected' : 'Select'}</div>
              </button>
            ))}
          </div>

          <div className="flex justify-end space-x-3">
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button onClick={save} className="px-4 py-2 rounded-lg border">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LanguageSelection;
