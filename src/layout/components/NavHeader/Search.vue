<template>
  <span ref="root" class="global-search">
    <!-- 搜索触发按钮 -->
    <div class="search-trigger" @click="openPanel">
      <el-input
        v-model="search"
        :placeholder="$t('Search')"
        :prefix-icon="searchIcon"
        class="search-input jms-input-spacing"
        readonly
        @keydown.esc.prevent="closePanel"
        @clear="clearSearch"
      >
        <template #suffix>
          <span class="search-shortcut">{{ shortcutText }}</span>
        </template>
      </el-input>
    </div>

    <!-- 搜索模态框 -->
    <el-dialog
      v-model="isOpen"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :append-to-body="true"
      :show-close="false"
      class="search-modal"
      header-class="search-modal-header"
      modal-class="search-modal-overlay"
      body-class="search-modal-body"
      width="640px"
      top="10vh"
      @close="closePanel"
    >
      <div class="search-modal-content">
        <!-- 搜索框 -->
        <div class="search-input-wrapper">
          <el-input
            ref="panelSearchInput"
            v-model="search"
            :placeholder="$t('Search')"
            :clearable="true"
            :prefix-icon="searchIcon"
            class="search-panel-input jms-input-spacing"
            @input="onInput"
            @keydown.down.prevent="onArrowDown"
            @keydown.up.prevent="onArrowUp"
            @keydown.enter.prevent="onEnter"
            @keydown.esc.prevent="closePanel"
          />
        </div>

        <!-- 搜索结果内容 -->
        <div ref="searchResultsRef" class="search-results">
          <div v-if="loading" class="section loading">{{ $t('Loading') }}...</div>

          <!-- 搜索历史 -->
          <template v-if="showHistory">
            <div class="section-title">
              <span>{{ $t('History') }}</span>
              <el-link class="clear-history-btn" @click.stop="clearHistory">
                {{ $t('Clear') }}
              </el-link>
            </div>
            <ul class="list">
              <li
                v-for="(item, index) in history"
                :key="'h-' + index"
                :class="['item', { 'is-active': isCurrentActive(item) }]"
                @click="applyHistory(item)"
                @mouseenter="setActiveItem(item)"
              >
                <el-icon class="icon"><Timer /></el-icon>
                <span class="label">{{ item.q }}</span>
                <el-icon class="go"><ArrowRight /></el-icon>
              </li>
            </ul>
          </template>

          <!-- 快捷操作 (Quick Actions) -->
          <template v-if="!search && quickActions.length">
            <div class="section-title">
              <span>{{ $t('Quick Actions') }}</span>
            </div>
            <ul class="list">
              <li
                v-for="action in quickActions"
                :key="'qa-' + action.path"
                :class="['item', { 'is-active': isCurrentActive(action) }]"
                @click="navigatePath(action.path)"
                @mouseenter="setActiveItem(action)"
              >
                <el-icon class="icon">
                  <component :is="action.icon" />
                </el-icon>
                <span class="label">{{ action.title }}</span>
                <span class="sub">{{ action.path }}</span>
                <el-icon class="go"><ArrowRight /></el-icon>
              </li>
            </ul>
          </template>

          <!-- 路由建议 (Route Suggestions) -->
          <template v-if="routeSuggestions.length">
            <div class="section-title">{{ $t('Routes') }}</div>
            <ul class="list">
              <li
                v-for="route in routeSuggestions"
                :key="'r-' + route.name + route.path"
                :class="['item', { 'is-active': isCurrentActive(route) }]"
                @click="navigateRoute(route)"
                @mouseenter="setActiveItem(route)"
              >
                <el-icon class="icon"><LocationInformation /></el-icon>
                <span class="label">{{ route.title || route.name || route.path }}</span>
                <span class="sub">{{ route.path }}</span>
                <el-icon class="go"><ArrowRight /></el-icon>
              </li>
            </ul>
          </template>

          <!-- 检索数据结果 -->
          <template v-if="options.length">
            <div v-for="group in options" :key="'g-' + group.label" class="section">
              <div class="section-title">{{ group.label }}</div>
              <ul class="list">
                <li
                  v-for="item in group.options"
                  :key="item.value"
                  :class="['item', { 'is-active': isCurrentActive(item) }]"
                  @click="handleSearch(item)"
                  @mouseenter="setActiveItem(item)"
                >
                  <Icon :icon="iconMap[item.model] || 'el-icon-document'" class="icon" />
                  <span class="label">{{ item.name }}</span>
                  <span class="sub">{{ item.content }}</span>
                  <el-icon class="go"><ArrowRight /></el-icon>
                </li>
              </ul>
            </div>
          </template>

          <div v-if="search && isEmpty" class="section empty">
            {{ $t('NoData') }}
          </div>

          <div v-if="!search" class="section placeholder">
            <div class="placeholder-content">
              <div class="supported-types">
                <div class="types-title">{{ $t('SupportedTypes') }}:</div>
                <div class="types-list">
                  <span v-for="(icon, type) in iconMap" :key="type" class="type-item">
                    <Icon :icon="icon" class="type-icon" />
                    {{ $t(type) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Command Palette 快捷键提示条 -->
        <div class="command-palette-footer">
          <div class="footer-tip">
            <kbd class="shortcut-key">↑</kbd>
            <kbd class="shortcut-key">↓</kbd>
            <span class="shortcut-label">{{ $t('Navigate') || 'Navigate' }}</span>
          </div>
          <div class="footer-tip">
            <kbd class="shortcut-key">↵</kbd>
            <span class="shortcut-label">{{ $t('Open') || 'Open' }}</span>
          </div>
          <div class="footer-tip">
            <kbd class="shortcut-key">ESC</kbd>
            <span class="shortcut-label">{{ $t('Close') || 'Close' }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </span>
</template>

<script>
import Icon from '@/components/Widgets/Icon/index.vue'
import { ObjectLocalStorage } from '@/utils/common/objectLocalStorage'
import { Search as SearchIcon } from '@element-plus/icons-vue'
import _ from 'lodash'
import { markRaw } from 'vue'
import { mapGetters } from 'vuex'

export default {
  name: 'Search',
  components: {
    Icon
  },
  data() {
    return {
      search: '',
      loading: false,
      options: [],
      isOpen: false,
      history: [],
      routeSuggestions: [],
      routes: [],
      activeIndex: 0,
      iconMap: {
        Account: 'accounts',
        Asset: 'assets',
        User: 'user-o',
        UserGroup: 'user-group',
        AssetPermission: 'permission'
      },
      searchIcon: markRaw(SearchIcon),
      historyStore: new ObjectLocalStorage('globalSearchHistory')
    }
  },
  computed: {
    ...mapGetters(['viewRoutes']),
    isEmpty() {
      return !this.routeSuggestions.length && this.options.length === 0
    },
    showHistory() {
      return this.history.length > 0 && !this.search
    },
    shortcutText() {
      return this.isMac ? '⌘K' : 'Ctrl+K'
    },
    isMac() {
      return navigator.platform.toUpperCase().indexOf('MAC') >= 0
    },
    quickActions() {
      // (only what the menus would show this user: permissions, and Tickets enabled and licensed)
      const tickets =
        Boolean(this.$store.getters.publicSettings?.['TICKETS_ENABLED']) && this.$hasTicketLicense()
      const ticketAdmin =
        this.$store.state.users.isSuperAdmin || this.$hasPerm('tickets.change_ticketflow')
      return [
        {
          title: this.$t('Request Asset Permission'),
          path: '/tickets/tickets/request-host-perm/create',
          icon: 'Ticket',
          can: tickets && this.$hasPerm('tickets.view_ticket')
        },
        {
          title: this.$t('My Tickets'),
          path: '/tickets/my-tickets',
          icon: 'Document',
          can: tickets && this.$hasPerm('tickets.view_ticket')
        },
        {
          title: this.$t('All Submitted Tickets'),
          path: '/tickets/all-tickets',
          icon: 'Tickets',
          can: tickets && this.$hasPerm('tickets.view_ticket') && ticketAdmin
        },
        {
          title: this.$t('JIT Policies'),
          path: '/pam/automations/jit-accounts',
          icon: 'Key',
          can: tickets && this.$hasPerm('accounts.view_jitpolicy')
        },
        {
          title: this.$t('Assets'),
          path: '/console/assets/assets',
          icon: 'Monitor',
          can: this.$hasPerm('assets.view_asset')
        },
        {
          title: this.$t('Custom Dashboards'),
          path: '/console/custom-dashboards',
          icon: 'Odometer',
          can: this.$hasPerm('rbac.view_console')
        }
      ].filter((action) => action.can)
    },
    navigableItems() {
      if (!this.search) {
        const items = []
        if (this.showHistory) {
          items.push(...this.history)
        }
        items.push(...this.quickActions)
        return items
      }
      const items = []
      if (this.routeSuggestions.length) {
        items.push(...this.routeSuggestions)
      }
      for (const group of this.options) {
        if (group.options && group.options.length) {
          items.push(...group.options)
        }
      }
      return items
    }
  },
  mounted() {
    this.loadHistory()
    this.buildRouteSuggestions()
    this.bindKeyboardShortcut()
  },
  beforeUnmount() {
    this.unbindKeyboardShortcut()
  },
  methods: {
    isCurrentActive(item) {
      return this.navigableItems[this.activeIndex] === item
    },
    setActiveItem(item) {
      const index = this.navigableItems.indexOf(item)
      if (index !== -1) {
        this.activeIndex = index
      }
    },
    onArrowDown() {
      const total = this.navigableItems.length
      if (total === 0) return
      this.activeIndex = (this.activeIndex + 1) % total
      this.scrollToActive()
    },
    onArrowUp() {
      const total = this.navigableItems.length
      if (total === 0) return
      this.activeIndex = (this.activeIndex - 1 + total) % total
      this.scrollToActive()
    },
    scrollToActive() {
      this.$nextTick(() => {
        const activeEl = this.$refs.searchResultsRef?.querySelector('.item.is-active')
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest' })
        }
      })
    },
    openPanel() {
      this.isOpen = true
      this.activeIndex = 0
      this.buildRouteSuggestions()
      this.$nextTick(() => {
        this.$refs.panelSearchInput?.focus()
      })
    },
    closePanel() {
      this.isOpen = false
    },
    onInput() {
      this.activeIndex = 0
      this.openPanel()
      this.debouncedQuery()
      this.filterRouteSuggestions(this.search)
    },
    clearSearch() {
      this.search = ''
      this.options = []
      this.activeIndex = 0
      this.buildRouteSuggestions()
      this.filterRouteSuggestions('')
    },
    onEnter() {
      if (this.navigableItems.length > 0) {
        const item = this.navigableItems[this.activeIndex] || this.navigableItems[0]
        this.executeNavigableItem(item)
      }
    },
    executeNavigableItem(item) {
      if (!item) return
      if (item.q !== undefined) {
        this.applyHistory(item)
        return
      }
      if (item.model && item.id) {
        this.handleSearch(item)
        return
      }
      if (item.path) {
        this.navigatePath(item.path)
      }
    },
    debouncedQuery: _.debounce(function () {
      this.searchQuery(this.search)
    }, 300),
    async searchQuery(q) {
      this.filterRouteSuggestions(q)
      if (!q) {
        this.options = []
        return
      }
      this.loading = true
      const url = '/api/v1/search/?q=' + q
      try {
        const res = await this.$axios.get(url)
        let options = res || []
        options = _.groupBy(res, 'model_label')
        this.options = Object.keys(options).map((key) => ({
          label: key,
          options: options[key]
        }))
        this.activeIndex = 0
      } catch (error) {
        console.error('Search error:', error)
        this.options = []
      } finally {
        this.loading = false
      }
    },
    handleSearch(item) {
      const route = {
        name: item.model + 'Detail',
        params: { id: item.id }
      }
      this.addToHistory(this.search)
      this.$router.push(route)
      this.closePanel()
    },
    navigateRoute(route) {
      this.$router.push(route.path)
      this.closePanel()
    },
    navigatePath(path) {
      this.$router.push(path)
      this.closePanel()
    },
    filterRouteSuggestions(q) {
      if (!q) {
        this.routeSuggestions = []
        return
      }
      this.routeSuggestions = this.routes
        .filter((r) => {
          const title = r.title || r.name || r.path
          return (
            title.toLowerCase().includes(q.toLowerCase()) ||
            r.path.toLowerCase().includes(q.toLowerCase())
          )
        })
        .slice(0, 5)
    },
    buildRouteSuggestions() {
      if (this.routes.length > 0) {
        return
      }
      const allRoutes = this.viewRoutes
      const flat = []
      const walk = (routes, parentPath = '') => {
        for (const r of routes) {
          const path = parentPath + r.path
          if (r.path && r.path !== '/' && !r.hidden) {
            flat.push({
              name: r.name,
              path: path,
              title: r.meta?.title
            })
          }

          if (r.children && r.children.length) {
            walk(r.children, path)
          }
        }
      }
      walk(allRoutes)
      this.routes = flat
    },
    loadHistory() {
      this.history = (this.historyStore.get('list') || []).filter((i) => i.q)
    },
    addToHistory(q) {
      const entry = { q: q }
      const list = this.historyStore.get('list') || []
      const next = [entry, ...list.filter((i) => i.q !== entry.q)].slice(0, 10)
      this.historyStore.set('list', next)
      this.history = next
    },
    applyHistory(h) {
      this.search = h.q
      this.onInput()
    },
    clearHistory() {
      this.historyStore.set('list', [])
      this.history = []
    },
    bindKeyboardShortcut() {
      document.addEventListener('keydown', this.handleKeyboardShortcut)
    },
    unbindKeyboardShortcut() {
      document.removeEventListener('keydown', this.handleKeyboardShortcut)
    },
    handleKeyboardShortcut(event) {
      // 检查是否按下了正确的快捷键
      const isCorrectKey = event.key === 'k' || event.key === 'K'
      const isCorrectModifier = this.isMac ? event.metaKey : event.ctrlKey

      if (isCorrectKey && isCorrectModifier) {
        // 阻止默认行为
        event.preventDefault()

        // 如果当前有输入框聚焦，且不是在搜索触发器内，不触发搜索
        const activeElement = document.activeElement
        const isInputFocused =
          activeElement &&
          activeElement !== this.$refs.panelSearchInput?.$el?.querySelector('input') &&
          (activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true')

        if (!isInputFocused || this.isOpen) {
          if (this.isOpen) {
            this.closePanel()
          } else {
            this.openPanel()
          }
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.global-search {
  position: relative;
  display: flex;
  align-items: center;
  width: 220px;
  height: 40px;
  padding: 5px 0;
  min-width: 220px;
  margin-right: 5px;

  .search-trigger {
    display: flex;
    align-items: center;
    width: 100%;
    height: 28px;
    line-height: 1;
    cursor: pointer;

    .search-input {
      --jms-input-padding-block: 0;
      --jms-input-padding-inline: 12px;

      width: 100%;
      height: 28px;
      pointer-events: none;

      :deep(.el-input__wrapper) {
        min-height: 28px;
        height: 28px;
        background-color: rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        border: none !important;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12) !important;
        cursor: pointer;
        transition:
          background-color 0.2s ease,
          box-shadow 0.2s ease;
      }

      :deep(.el-input__inner) {
        height: 100%;
        line-height: 1;
        background: transparent;
        border: unset !important;
        cursor: pointer;

        &::placeholder {
          color: #fff;
          opacity: 0.7;
        }
      }

      :deep(.el-input__prefix),
      :deep(.el-input__suffix),
      :deep(.el-input__suffix-inner) {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }

      :deep(.el-input__prefix-inner) {
        display: flex;
        align-items: center;
      }

      :deep(.el-input__prefix-inner > :last-child) {
        margin-right: 8px;
      }

      :deep(.el-input__icon),
      :deep(.el-icon) {
        color: #fff;
        font-size: 15px;
        line-height: 1;
      }
    }

    &:hover {
      .search-input :deep(.el-input__wrapper) {
        background-color: rgba(255, 255, 255, 0.14);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2) !important;
      }
    }

    .search-shortcut {
      color: rgba(255, 255, 255, 0.75);
      font-size: 11px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
      letter-spacing: 0.5px;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      user-select: none;
      pointer-events: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 18px;
      line-height: 1;
    }
  }
}

@media screen and (max-width: 992px) {
  .global-search {
    width: 36px;
    min-width: 36px;
    margin-right: 0;

    .search-trigger .search-input {
      --jms-input-padding-inline: 10px;

      :deep(.el-input__inner),
      :deep(.el-input__suffix) {
        display: none;
      }

      :deep(.el-input__prefix) {
        position: static;
        width: 100%;
      }

      :deep(.el-input__prefix-inner > :last-child) {
        margin-right: 0;
      }
    }
  }
}
</style>

<style lang="scss">
body .v-modal {
  opacity: 0.3;
}

.search-modal.el-dialog {
  --el-dialog-padding-primary: 0;
  padding: 0 !important;
  margin: 10vh auto 0 !important;
  width: 640px !important;
  max-width: min(640px, calc(100vw - 32px)) !important;
  height: auto !important;
  max-height: 72vh !important;
  border-radius: 14px !important;
  border: 1px solid var(--panel-border-color, rgba(226, 232, 240, 0.8)) !important;
  box-shadow:
    0 20px 45px -10px rgba(15, 23, 42, 0.28),
    0 0 0 1px var(--panel-border-color, rgba(226, 232, 240, 0.5)) !important;
  overflow: hidden;
  background: var(--page-background-color, #ffffff) !important;
}

.search-modal-overlay {
  overflow-y: auto;

  .el-overlay-dialog {
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
}

.search-modal-header {
  display: none !important;
  padding: 0 !important;
  margin: 0 !important;
}

.search-modal-body {
  padding: 0 !important;
}

.search-modal-content {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: var(--page-background-color, #ffffff);
  height: auto;
  max-height: 72vh;
  overflow: hidden;
}

.search-input-wrapper {
  padding: 16px 20px;
  border-bottom: 1px solid var(--panel-border-color, #e2e8f0);
  background: var(--page-background-color, #ffffff);

  .search-panel-input {
    --jms-input-padding-block: 0;
    --jms-input-padding-inline: 12px;

    width: 100% !important;

    &.el-input {
      width: 100% !important;
    }

    .el-input__wrapper {
      width: 100%;
      min-height: 38px;
      height: 38px;
      border-radius: 8px;
      border: 1px solid var(--panel-border-color, var(--el-border-color)) !important;
      background-color: var(--page-content-background-color, var(--menu-hover, #f8fafc));
      box-shadow: none !important;
      box-sizing: border-box;
      transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease;

      &.is-focus {
        border-color: var(--el-color-primary) !important;
        box-shadow: var(--luxury-focus-ring, 0 0 0 3px rgba(56, 189, 248, 0.16)) !important;
      }
    }

    .el-input__inner {
      min-height: 36px;
      height: 36px;
      line-height: 36px;
      font-size: 14px;
      color: var(--color-text-primary);
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
      background: transparent;

      &::placeholder {
        color: var(--color-text-secondary);
      }
    }

    .el-input__prefix,
    .el-input__suffix,
    .el-input__prefix-inner,
    .el-input__suffix-inner {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      height: 36px;
      border: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
      color: var(--color-text-secondary);
    }

    .el-input__prefix-inner > :last-child {
      margin-right: 8px;
    }

    .el-input__suffix {
      padding-left: 0;
    }

    .el-input__clear,
    .el-input__icon {
      border: 0 !important;
      box-shadow: none !important;
      color: var(--color-text-secondary);
    }
  }
}

.search-results {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(72vh - 120px);
  background: var(--page-background-color, #ffffff);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--panel-border-color, #cbd5e1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-secondary, #94a3b8);
  }
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 6px;
  font-size: 11px;
  line-height: 1.5;
  color: var(--color-text-secondary, #94a3b8);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  .clear-history-btn {
    padding: 2px 6px;
    border: none;
    border-radius: 4px;
    background: none;
    color: var(--color-danger, #ef4444);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--menu-hover, #f1f5f9);
      color: var(--color-danger, #ef4444);
    }
  }
}

.list {
  margin: 0;
  padding: 4px 12px;
  list-style: none;

  .item {
    position: relative;
    display: flex;
    align-items: center;
    padding: 9px 12px;
    margin-bottom: 2px;
    border-radius: 8px;
    border-bottom: none;
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;

    &:before {
      content: '';
      position: absolute;
      left: 0;
      top: 6px;
      bottom: 6px;
      width: 3px;
      border-radius: 0 2px 2px 0;
      background: transparent;
      transition: background 0.15s ease;
    }

    &:hover,
    &.is-active {
      background: var(--menu-hover, rgba(56, 189, 248, 0.08));

      &:before {
        background: var(--color-primary);
      }

      .label {
        color: var(--color-primary);
      }

      .go {
        color: var(--color-primary);
        transform: translateX(2px);
      }
    }

    .icon {
      margin-right: 12px;
      font-size: 15px;
      color: var(--color-icon-primary, var(--color-text-secondary));
      flex-shrink: 0;
    }

    .label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13.5px;
      color: var(--color-text-primary);
      font-weight: 500;
      transition: color 0.15s ease;
    }

    .sub {
      margin-left: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex-shrink: 0;
      text-align: right;
      color: var(--color-text-secondary);
      font-size: 12px;
      max-width: 45%;
    }

    .go {
      margin-left: 8px;
      flex-shrink: 0;
      color: var(--color-text-secondary);
      font-size: 12px;
      transition:
        transform 0.15s ease,
        color 0.15s ease;
    }
  }
}

.command-palette-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 10px 20px;
  background: var(--page-background-color, #ffffff);
  border-top: 1px solid var(--panel-border-color, #e2e8f0);

  .footer-tip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    color: var(--color-text-secondary);

    .shortcut-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      font-size: 10.5px;
      font-family: inherit;
      font-weight: 600;
      color: var(--color-text-primary);
      background: var(--menu-hover, #f1f5f9);
      border: 1px solid var(--panel-border-color, #cbd5e1);
      border-radius: 4px;
      box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
      line-height: 1;
    }

    .shortcut-label {
      color: var(--color-text-secondary);
      font-weight: 400;
    }
  }
}

.loading,
.empty {
  padding: 32px 24px;
  color: var(--color-text-secondary);
  text-align: center;
  font-size: 13.5px;
}

.section.placeholder {
  padding: 20px 20px 24px;
  border-top: 1px solid var(--panel-border-color, #e2e8f0);

  .placeholder-content {
    text-align: center;
  }

  .supported-types {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .types-title {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .types-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
  }

  .type-item {
    display: flex;
    align-items: center;
    padding: 5px 10px;
    background: var(--menu-hover, #f1f5f9);
    border: 1px solid var(--panel-border-color, #e2e8f0);
    border-radius: 6px;
    font-size: 12px;
    color: var(--color-text-secondary);
    transition: all 0.2s ease;

    &:hover {
      background: var(--menu-hover, #e2e8f0);
      color: var(--color-text-primary);
    }

    .type-icon {
      margin-right: 6px;
      font-size: 13px;
      color: var(--color-primary);
    }
  }
}
</style>
