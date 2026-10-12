import { VueCookieNext as VueCookie } from 'vue-cookie-next'
import { getStore } from '@/store/registry'

const localeAliases = {
  'pt-br': 'pt_br',
  'zh-cn': 'zh',
  'zh-hans': 'zh',
  'zh-hant': 'zh_hant',
  'zh-hk': 'zh_hant',
  'zh-tw': 'zh_hant'
}

export function getLangCode(withInternalCode = false) {
  return 'en'
}

export function getI18nLocale() {
  return 'en'
}
