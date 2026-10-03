import React from 'react';
import { SupportedLanguage } from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { Globe, Check, X } from 'lucide-react';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onSelect: (lang: SupportedLanguage) => void;
  onClose?: () => void;
  currentLanguage: SupportedLanguage;
  isDark?: boolean;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({
  isOpen,
  onSelect,
  onClose,
  currentLanguage,
  isDark = true,
}) => {
  if (!isOpen) return null;

  const languages: Array<{ code: SupportedLanguage; label: string; native: string; description: string }> = [
    {
      code: 'en',
      label: 'English',
      native: 'English',
      description: 'Interact with Nova in fluent, professional English.',
    },
    {
      code: 'hi',
      label: 'Hindi',
      native: 'हिंदी',
      description: 'नोवा के साथ स्पष्ट एवं सहज हिंदी में बातचीत करें।',
    },
    {
      code: 'mr',
      label: 'Marathi',
      native: 'मराठी',
      description: 'नोव्हा सोबत सोप्या आणि अस्खलित मराठीत संवाद साधा.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all relative ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 border border-indigo-500/40">
            <Globe className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Select Preferred Language / भाषा चुनें / भाषा निवडा
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please choose how you would like Nova to communicate with you.
            </p>
          </div>
        </div>

        <div className="space-y-2.5 mb-5">
          {languages.map((lang) => {
            const isSelected = currentLanguage === lang.code;

            return (
              <button
                key={lang.code}
                onClick={() => onSelect(lang.code)}
                className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-indigo-950/50 border-indigo-500 text-white shadow-md ring-2 ring-indigo-500/30'
                      : 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-md ring-2 ring-indigo-500/30'
                    : isDark
                      ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-200'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{lang.native}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">({lang.label})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{lang.description}</p>
                </div>

                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : isDark
                        ? 'border-slate-600'
                        : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          You can switch languages at any time from the top navigation bar.
        </div>
      </div>
    </div>
  );
};
