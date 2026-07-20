import React from 'react';
import { Globe, ChevronDown } from 'lucide-react';
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
    <div className="relative flex items-center bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1 text-slate-200 shrink-0 transition">
      <Globe className="w-3.5 h-3.5 text-teal-400 mr-1.5 shrink-0" />
      <select
        id="language_selector_dropdown"
        value={currentLang}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="bg-transparent text-xs font-medium text-slate-200 cursor-pointer focus:outline-none appearance-none pr-4 py-0.5"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-200">
            {lang.flag} {lang.name} ({lang.shortName})
          </option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
    </div>
  );
}
