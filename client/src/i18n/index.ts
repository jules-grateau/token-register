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

export default i18n;
