import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', label: 'EN' },
    { code: 'sw', name: 'Kiswahili', label: 'SW' },
    { code: 'fr', name: 'Francais', label: 'FR' },
    { code: 'rw', name: 'Kinyarwanda', label: 'RW' },
  ];

  const currentLang = languages.find((language) => language.code === i18n.language) || languages[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 hover:bg-white/10 transition-colors text-sm"
      >
        <span className="text-xs font-bold">{currentLang.label}</span>
        <span className="hidden md:inline">{currentLang.name}</span>
        <i className={`fa-solid fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl py-2 min-w-[160px] z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-3 transition-colors ${
                i18n.language === language.code ? 'bg-gs-cream text-gs-dark font-bold' : 'text-gray-700'
              }`}
            >
              <span className="text-xs font-bold">{language.label}</span>
              <span>{language.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;
