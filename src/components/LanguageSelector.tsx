/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../locales/translations';

interface LanguageSelectorProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

export default function LanguageSelector({ currentLang, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 rounded-lg p-1 backdrop-blur-sm">
      <Globe className="w-4 h-4 text-emerald-400 ml-1.5 mr-0.5" />
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
            currentLang === lang.code
              ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm shadow-emerald-500/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
          title={lang.name}
        >
          <span>{lang.flag}</span>
          <span>{lang.name}</span>
        </button>
      ))}
    </div>
  );
}
