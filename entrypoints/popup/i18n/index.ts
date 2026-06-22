import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

export const getBrowserLang = (): string => {
  const lang = navigator.language;
  if (lang.startsWith('zh')) return 'zh-CN';
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    en: { translation: en },
  },
  lng: getBrowserLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const changeLanguage = (locale: 'system' | 'zh-CN' | 'en') => {
  const lang = locale === 'system' ? getBrowserLang() : locale;
  i18n.changeLanguage(lang);
};

export default i18n;
