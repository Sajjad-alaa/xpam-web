import en from './en.json'
import elementEn from 'element-plus/es/locale/lang/en'

const messages = {
  en: { ...elementEn, ...en }
}

export function getElementLocale(cookieLang) {
  return elementEn
}

export default messages
