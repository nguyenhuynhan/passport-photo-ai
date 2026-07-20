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

export const LANGUAGES: { code: Language; name: string; shortName: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', shortName: 'VN', flag: '🇻🇳' },
  { code: 'en', name: 'English', shortName: 'EN', flag: '🇺🇸' },
  { code: 'zh', name: '中文', shortName: 'ZH', flag: '🇨🇳' },
];

export default function LanguageSelector({ currentLang, onLanguageChange }: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shrink-0">
      <Globe className="w-3.5 h-3.5 text-teal-400 ml-1 mr-0.5 hidden sm:block shrink-0" />
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => onLanguageChange(lang.code)}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-all select-none ${
            currentLang === lang.code
              ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={lang.name}
        >
          <span className="text-xs sm:text-sm leading-none">{lang.flag}</span>
          <span className="hidden md:inline text-[11px]">{lang.name}</span>
          <span className="inline md:hidden text-[10px] uppercase font-mono">{lang.shortName}</span>
        </button>
      ))}
    </div>
  );
}
