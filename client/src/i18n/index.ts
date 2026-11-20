import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import { DEFAULT_LANGUAGE } from '../config';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// <html lang> follows the interface language (screen readers, hyphenation).
const syncHtmlLang = (lng: string) => document.documentElement.setAttribute('lang', lng);
if (i18n.language) syncHtmlLang(i18n.language);
i18n.on('languageChanged', syncHtmlLang);

export default i18n;
