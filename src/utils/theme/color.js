import color from 'css-color-function'
import formula from './formula.json'
import defaultThemeConfig from '@/styles/default-theme'

export function generateColors(themeColors) {
  const colors = {}
  if (!themeColors || Object.keys(themeColors).length === 0) {
    themeColors = defaultThemeConfig
  }
  let primaryColor = themeColors
  const subColor = themeColors || defaultThemeConfig
  if (typeof themeColors === 'object') {
    primaryColor =
      themeColors['--color-primary'] ||
      themeColors['primary'] ||
      defaultThemeConfig['--color-primary']
  }

  for (const [key, value] of Object.entries(formula)) {
    let replaceColor
    if (value.includes('primary')) {
      replaceColor = value.replace(/primary/g, primaryColor)
    }
    if (value.includes('success')) {
      replaceColor = value.replace(/success/g, subColor['--color-success'])
    }
    if (value.includes('info')) {
      replaceColor = value.replace(/info/g, subColor['--color-info'])
    }
    if (value.includes('warning')) {
      replaceColor = value.replace(/warning/g, subColor['--color-warning'])
    }
    if (value.includes('danger')) {
      replaceColor = value.replace(/danger/g, subColor['--color-danger'])
    }
    if (replaceColor && !replaceColor.includes('undefined')) {
      const convertColor = color.convert(replaceColor)
      colors[key] = convertColor.indexOf('rgba') > -1 ? convertColor : colorRgbToHex(convertColor)
    }
  }

  return colors
}

/* 将rgb颜色转成hex */
export function colorRgbToHex(rgb) {
  const [r, g, b] = rgb.replace(/(?:\(|\)|rgb|RGB)*/g, '').split(',')
  return '#' + ((1 << 24) + (Number(r) << 16) + (Number(g) << 8) + Number(b)).toString(16).slice(1)
}

export function mix(color_1, color_2, weight) {
  function d2h(d) {
    return d.toString(16)
  }

  function h2d(h) {
    return parseInt(h, 16)
  }

  weight = typeof weight !== 'undefined' ? weight : 50
  let color = '#'

  for (let i = 0; i <= 5; i += 2) {
    const v1 = h2d(color_1.substr(i, 2))
    const v2 = h2d(color_2.substr(i, 2))
    let val = d2h(Math.floor(v2 + (v1 - v2) * (weight / 100.0)))

    while (val.length < 2) {
      val = '0' + val
    }
    color += val
  }
  return color
}

export function getCssVar(name, fallback = '') {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return fallback
  }

  const root = document.documentElement
  const inlineValue = root.style.getPropertyValue(name)
  const computedValue = window.getComputedStyle(root).getPropertyValue(name)
  const defaultValue = fallback || defaultThemeConfig[name] || ''
  return (inlineValue || computedValue || defaultValue).trim()
}

export function colorToRgba(inputColor, alpha) {
  const fallback = alpha === 0 ? 'transparent' : inputColor
  if (!inputColor) {
    return fallback
  }

  const normalizedColor = inputColor.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalizedColor)) {
    const hex = normalizedColor.slice(1)
    const fullHex =
      hex.length === 3
        ? hex
            .split('')
            .map((char) => char + char)
            .join('')
        : hex
    const r = Number.parseInt(fullHex.slice(0, 2), 16)
    const g = Number.parseInt(fullHex.slice(2, 4), 16)
    const b = Number.parseInt(fullHex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const rgbValues = normalizedColor.match(/\d+/g)
  if (normalizedColor.startsWith('rgb') && rgbValues && rgbValues.length >= 3) {
    return `rgba(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]}, ${alpha})`
  }

  return fallback
}

export function setRootColors() {
  const themeColors = defaultThemeConfig || {}
  for (const [key, value] of Object.entries(themeColors)) {
    document.documentElement.style.setProperty(key, value)
  }
}

function syncElementPlusColorVars(elementStyle, colorName, currentColor) {
  const white = 'ffffff'
  const black = '000000'
  const elColorKey = `--el-color-${colorName}`

  elementStyle.setProperty(elColorKey, currentColor)
  elementStyle.setProperty(`${elColorKey}-light-3`, mix(white, currentColor.replace(/#/g, ''), 30))
  elementStyle.setProperty(`${elColorKey}-light-5`, mix(white, currentColor.replace(/#/g, ''), 50))
  elementStyle.setProperty(`${elColorKey}-light-7`, mix(white, currentColor.replace(/#/g, ''), 70))
  elementStyle.setProperty(`${elColorKey}-light-8`, mix(white, currentColor.replace(/#/g, ''), 80))
  elementStyle.setProperty(`${elColorKey}-light-9`, mix(white, currentColor.replace(/#/g, ''), 90))
  elementStyle.setProperty(`${elColorKey}-dark-2`, mix(black, currentColor.replace(/#/g, ''), 20))
}

export function getSavedThemeMode() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 'auto'
  }
  return localStorage.getItem('lina-theme-mode') || 'auto'
}

export function isDarkMode(themeColors = {}) {
  if (themeColors && typeof themeColors === 'object') {
    if (themeColors.is_dark === true || themeColors.theme_mode === 'dark') {
      return true
    }
    if (themeColors.is_dark === false || themeColors.theme_mode === 'light') {
      return false
    }
    const bg =
      themeColors['--page-background-color'] || themeColors['sidebarBg'] || themeColors['--menu-bg']
    if (
      bg &&
      (bg === '#0f172a' ||
        bg === '#090d16' ||
        bg === '#0b1318' ||
        bg === '#120e1f' ||
        bg === '#1e293b' ||
        bg === '#131b2e' ||
        bg === '#111f26' ||
        bg === '#1d1730' ||
        bg.startsWith('#0') ||
        bg.startsWith('#1'))
    ) {
      return true
    }
  }

  const savedMode = getSavedThemeMode()
  if (savedMode === 'dark') return true
  if (savedMode === 'light') return false

  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return false
}

export function setDarkMode(isDark) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

export function toggleDarkMode(currentThemeColors = {}) {
  const currentDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const newMode = currentDark ? 'light' : 'dark'
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('lina-theme-mode', newMode)
  }
  setDarkMode(!currentDark)
  changeMenuColor(currentThemeColors)
  return !currentDark
}

export function changeMenuColor(themeColors = {}) {
  const elementStyle = document.documentElement.style
  const colors = {
    ...(Object.keys(themeColors).length > 0 ? themeColors : defaultThemeConfig)
  }

  const dark = isDarkMode(colors)
  setDarkMode(dark)

  if (colors['primary'] && !colors['--color-primary']) {
    colors['--color-primary'] = colors['primary']
  }
  if (colors['--color-primary'] && !colors['--menu-text-active']) {
    colors['--menu-text-active'] = colors['--color-primary']
  }
  if (colors['--color-primary'] && !colors['--color-link']) {
    colors['--color-link'] = colors['--color-primary']
  }

  const white = 'ffffff'
  const black = '000000'

  // Hover background generator
  const menuActiveTextColor = colors['--menu-text-active']
  const hasCompleteMenuState = colors['--menu-hover-bg'] || colors['--menu-active-bg']
  if (!hasCompleteMenuState && menuActiveTextColor) {
    colors['--menu-hover'] = dark
      ? 'rgba(255, 255, 255, 0.08)'
      : mix(white, menuActiveTextColor.replace(/#/g, ''), 90)
  }

  const lights = [15, 40, 60, 90]
  const darken = [15, 30, 40, 80]

  const colorsGenMore = ['--color-primary']
  for (const key in colors) {
    const currentColor = colors[key]
    elementStyle.setProperty(key, currentColor)

    if (/^--color-(primary|success|info|warning|danger)$/.test(key)) {
      const colorName = key.replace('--color-', '')
      syncElementPlusColorVars(elementStyle, colorName, currentColor)
    }

    if (colorsGenMore.includes(key)) {
      for (const [i, light] of lights.entries()) {
        const color = mix(white, currentColor.replace(/#/g, ''), light)
        elementStyle.setProperty(key + '-light' + '-' + i, color)
      }
      for (const [i, darkVal] of darken.entries()) {
        const color = mix(black, currentColor.replace(/#/g, ''), darkVal)
        elementStyle.setProperty(key + '-dark' + '-' + i, color)
      }
    }

    if (key.includes('--color')) {
      const lightColor = mix(white, currentColor.replace(/#/g, ''), 70)
      const darkColor = mix(black, currentColor.replace(/#/g, ''), 70)
      elementStyle.setProperty(key + '-light', lightColor)
      elementStyle.setProperty(key + '-dark', darkColor)
    }
  }

  // Ensure element-plus surface variables align with dark/light mode
  if (dark) {
    elementStyle.setProperty('--el-bg-color', colors['--page-background-color'] || '#1e293b')
    elementStyle.setProperty(
      '--el-bg-color-page',
      colors['--page-content-background-color'] || '#0f172a'
    )
    elementStyle.setProperty('--el-bg-color-overlay', '#1e293b')
    elementStyle.setProperty('--el-card-bg-color', '#1e293b')
    elementStyle.setProperty('--el-border-color', colors['--color-border'] || '#243044')
    elementStyle.setProperty('--el-text-color-primary', colors['--color-text-primary'] || '#f8fafc')
  } else {
    elementStyle.setProperty('--el-bg-color', '#ffffff')
    elementStyle.setProperty('--el-bg-color-page', '#f8fafc')
    elementStyle.setProperty('--el-bg-color-overlay', '#ffffff')
    elementStyle.setProperty('--el-card-bg-color', '#ffffff')
    elementStyle.setProperty('--el-border-color', colors['--color-border'] || '#e2e8f0')
    elementStyle.setProperty('--el-text-color-primary', colors['--color-text-primary'] || '#0f172a')
  }
}
