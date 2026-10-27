import {
  changeMenuColor,
  generateColors,
  getSavedThemeMode,
  mix,
  setOnThemeModeChange,
  setRootColors
} from './color'

let currentThemeColorsCache = {}
let systemThemeListenerRegistered = false

export function initSystemThemeListener(getColors) {
  if (systemThemeListenerRegistered || typeof window === 'undefined' || !window.matchMedia) {
    return
  }
  systemThemeListenerRegistered = true
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => {
    const savedMode = getSavedThemeMode()
    if (savedMode === 'auto') {
      const colors = typeof getColors === 'function' ? getColors() : currentThemeColorsCache || {}
      changeMenuColor(colors)
      changeElementColor(colors)
    }
  }
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler)
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handler)
  }
}

setOnThemeModeChange((colors) => {
  changeElementColor(colors || currentThemeColorsCache)
})

export function changeElementColor(themeColors) {
  if (themeColors && Object.keys(themeColors).length > 0) {
    currentThemeColorsCache = themeColors
  }
  let colorsCssText = ''
  let cssText = ''
  const colors = generateColors(themeColors)
  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const darkCandidate =
    themeColors?.['--page-content-background-color'] ||
    (typeof document !== 'undefined'
      ? document.documentElement.style.getPropertyValue('--page-content-background-color')
      : '') ||
    '#0f172a'
  const darkBaseHex = (
    /^#[0-9a-fA-F]{6}$/.test(darkCandidate.trim()) ? darkCandidate.trim() : '#0f172a'
  ).replace(/#/g, '')

  for (const [key, value] of Object.entries(colors)) {
    cssText = cssText.replace(new RegExp('(:|\\s+)' + key, 'g'), '$1' + `${value}`)
    colorsCssText += `
    .color-${key}{color: ${value}!important;}
    .bg-${key}{background-color: ${value}!important;}
    .border-${key}{border-color: ${value}!important;}
    `
    if (['primary', 'success', 'info', 'warning', 'danger'].includes(key)) {
      // Disabled filled buttons should use a clearly lightened theme color in light mode,
      // or mix toward the dark base in dark mode.
      const disabledColor = isDark
        ? mix(darkBaseHex, value.replace(/#/g, ''), 50)
        : mix('ffffff', value.replace(/#/g, ''), 50)
      const darken = mix('000000', value.replace(/#/g, ''), 10)
      const tooLightColor = mix('ffffff', value.replace(/#/g, ''), 90)
      const alertLightBg = isDark ? `rgba(255, 255, 255, 0.06)` : tooLightColor
      colorsCssText =
        colorsCssText +
        `
        .el-button--${key}{
           border-color: ${value};
        }
        .el-button--${key}:not(.is-disabled):focus,
        .el-button--${key}:not(.is-disabled):active,
        .el-button--${key}:not(.is-disabled):hover {
          background-color: ${darken}!important;
          border-color: ${darken}!important;
        }
        .el-button--${key}.is-disabled:not(.is-plain):not(.is-text):not(.is-link):not(.is-dashed),
        .el-button--${key}.is-disabled:not(.is-plain):not(.is-text):not(.is-link):not(.is-dashed):active,
        .el-button--${key}.is-disabled:not(.is-plain):not(.is-text):not(.is-link):not(.is-dashed):focus,
        .el-button--${key}.is-disabled:not(.is-plain):not(.is-text):not(.is-link):not(.is-dashed):hover {
          background-color: ${disabledColor}!important;
          border-color: ${disabledColor}!important;
        }
        .el-link.el-link--${key}{
          color: ${value}!important;
        }
        .el-link.el-link--${key}:hover {
          color: ${darken}!important;
        }
        .el-link.el-link--${key}.is-underline:hover:after,
        .el-link.el-link--${key}:after {
          border-color: ${value}!important;
        }
        .el-tag--dark.el-tag--${key} {
          background-color: ${value} !important;
        }
        .el-alert.el-alert--${key}.is-light {
          background-color: ${alertLightBg};
        }
      `
    }
  }

  colorsCssText = colorsCssText.replaceAll('\n', '')
  let styleTag = document.getElementById('themeStyle')
  if (!styleTag) {
    styleTag = document.createElement('style')
    styleTag.setAttribute('id', 'themeStyle')
    document.head.appendChild(styleTag)
  }
  styleTag.innerText = cssText + colorsCssText
}

export function applyThemeMode(themeColors) {
  changeMenuColor(themeColors)
  changeElementColor(themeColors)
}

export function changeThemeColors(themeColors) {
  // 主题色现在完全由 CSS 变量驱动（setRootColors / changeMenuColor 同步 --color-* 与
  // --el-color-*），不再拉取并注入 Element UI 时代的 element-extra.css——那份样式里的
  // `.el-input__inner { border }` 正是 Element Plus 下输入框「border 套 border」的根源。
  currentThemeColorsCache = themeColors || {}
  setRootColors()
  changeMenuColor(themeColors)
  changeElementColor(themeColors)
  initSystemThemeListener()
}
