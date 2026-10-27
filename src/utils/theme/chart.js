import { getCssVar } from './color'

const isPlain = (v) =>
  v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype

export function isDarkTheme() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
}

// 取（并浅拷贝）obj[key] 这一层配置，避免直接改动调用方传入的（可能是响应式的）options
function own(obj, key) {
  obj[key] = isPlain(obj[key]) ? { ...obj[key] } : {}
  return obj[key]
}

function setDefault(obj, key, value) {
  if (obj[key] === undefined || obj[key] === null || obj[key] === '') {
    obj[key] = value
  }
}

// 组件配置既可能是对象也可能是数组：逐项浅拷贝后交给 fn 处理
function eachOwn(opts, key, fn) {
  const value = opts[key]
  if (Array.isArray(value)) {
    opts[key] = value.map((item) => {
      if (!isPlain(item)) return item
      const copy = { ...item }
      fn(copy)
      return copy
    })
  } else if (isPlain(value)) {
    const copy = { ...value }
    fn(copy)
    opts[key] = copy
  }
}

/**
 * ECharts 自带的文字/坐标轴/提示框默认是浅色主题配色（深灰文字、白色提示框），深色模式下
 * 不可读。深色模式下给图表补充缺省的主题色，不覆盖业务代码显式设置的颜色；明亮模式原样返回。
 */
export function applyChartTheme(options) {
  if (!isPlain(options) || !isDarkTheme()) {
    return options
  }
  const text = getCssVar('--color-text-primary', '#f8fafc')
  const textSecondary = getCssVar('--color-text-secondary', '#94a3b8')
  const border = getCssVar('--panel-border-color', '#243044')
  const surface = getCssVar('--page-background-color', '#1e293b')

  const opts = { ...options }

  eachOwn(opts, 'tooltip', (tooltip) => {
    setDefault(tooltip, 'backgroundColor', surface)
    setDefault(tooltip, 'borderColor', border)
    setDefault(own(tooltip, 'textStyle'), 'color', text)
  })

  eachOwn(opts, 'legend', (legend) => {
    setDefault(own(legend, 'textStyle'), 'color', textSecondary)
    setDefault(own(legend, 'pageTextStyle'), 'color', textSecondary)
  })

  eachOwn(opts, 'title', (title) => {
    setDefault(own(title, 'textStyle'), 'color', text)
    setDefault(own(title, 'subtextStyle'), 'color', textSecondary)
  })

  for (const key of ['xAxis', 'yAxis', 'radiusAxis', 'angleAxis']) {
    eachOwn(opts, key, (axis) => {
      setDefault(own(axis, 'axisLabel'), 'color', textSecondary)
      setDefault(own(axis, 'nameTextStyle'), 'color', textSecondary)
      setDefault(own(own(axis, 'axisLine'), 'lineStyle'), 'color', border)
      setDefault(own(own(axis, 'splitLine'), 'lineStyle'), 'color', border)
    })
  }

  eachOwn(opts, 'series', (series) => {
    // 饼图外侧引导文字默认是深灰色
    if (series.type === 'pie' && series.label && series.label.position !== 'inside') {
      setDefault(own(series, 'label'), 'color', textSecondary)
    }
  })

  return opts
}
