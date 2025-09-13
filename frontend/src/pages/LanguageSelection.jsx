import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../config/api.config.js';

function LanguageSelection() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [selected, setSelected] = useState([]);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setError(null);
        const response = await api.get('/content/languages');
        if (response.data.success && response.data.data) {
          setAvailableLanguages(response.data.data);
        } else {
          throw new Error('Failed to fetch languages from server');
        }
      } catch (error) {
        console.error('Failed to fetch languages:', error);
        setError('Unable to load languages. Please check your connection and try again.');
        // Don't set fallback languages - show error instead
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // When availableLanguages or user change, ensure selected reflects DB state
  React.useEffect(() => {
    if (!availableLanguages || !availableLanguages.length) return;

    const availableCodes = new Set(availableLanguages.map((l) => String(l.code).toLowerCase()));

    // If user has values from DB, prefer them (but only keep codes that exist in availableLanguages)
    if (user?.preferredLanguages && Array.isArray(user.preferredLanguages)) {
      const normalized = Array.from(new Set(user.preferredLanguages.map((c) => String(c).toLowerCase())));
      const filtered = normalized.filter((c) => availableCodes.has(c));
      setSelected(filtered);
      return;
    }

    // If not authenticated and localStorage exists, keep intersection with availableLanguages
    try {
      const saved = JSON.parse(localStorage.getItem('preferredLanguages') || '[]');
      if (Array.isArray(saved) && saved.length) {
        const normalized = Array.from(new Set(saved.map((c) => String(c).toLowerCase())));
        const filtered = normalized.filter((c) => availableCodes.has(c));
        setSelected(filtered);
      }
    } catch (e) {
      // ignore
    }
  }, [availableLanguages, user]);

  // Note: selected is initialized/updated in the effect that depends on availableLanguages and user

  const toggle = (codeRaw) => {
    const code = String(codeRaw).toLowerCase();
    setSelected((prev) => {
      const normalizedPrev = prev.map((c) => String(c).toLowerCase());
      if (normalizedPrev.includes(code)) return normalizedPrev.filter((c) => c !== code);
      // add and dedupe
      return Array.from(new Set([...normalizedPrev, code]));
    });
  };

  const save = async () => {
    // Try to update backend profile first (if logged in)
    if (user) {
      try {
        const payload = Array.from(new Set(selected.map((c) => String(c).toLowerCase())));
        const res = await updateProfile({ preferredLanguages: payload });
        if (res.success) {
          // Clear localStorage since we're now using database values
          localStorage.removeItem('preferredLanguages');
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

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading languages...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => toggle(lang.code)}
                  className={`p-4 border rounded-lg text-left hover:shadow-md transition flex items-center justify-between ${selected.includes(lang.code) ? 'border-brand-purple bg-brand-purple/10' : ''}`}
                >
                  <div>
                    <div className="font-semibold">{lang.name}</div>
                    <div className="text-xs text-gray-500">{lang.code}</div>
                  </div>
                  <div className="text-sm text-brand-purple">{selected.includes(lang.code) ? 'Selected' : 'Select'}</div>
                </button>
              ))}
            </div>
          )}

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
