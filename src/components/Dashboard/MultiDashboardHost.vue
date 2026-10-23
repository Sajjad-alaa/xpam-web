<template>
  <div class="md-host" :class="{ 'md-tv-mode': isTvMode }">
    <!-- Top Multi-Dashboard Tab & Action Bar -->
    <div class="md-tabbar">
      <div class="md-tabs-scroll">
        <button
          v-if="!standalone"
          type="button"
          class="md-tab"
          :class="{ 'is-active': activeTab === 'builtin' }"
          @click="selectTab('builtin')"
        >
          <i class="fa fa-th-large" />
          <span>{{ builtinTitle || $t('Dashboard') }}</span>
        </button>

        <button
          v-for="d of dashboards"
          :key="d.id"
          type="button"
          class="md-tab"
          :class="{ 'is-active': activeTab === d.id }"
          @click="selectTab(d.id)"
        >
          <i class="fa fa-tachometer" />
          <span>{{ d.name }}</span>
          <el-tag v-if="d.is_default" size="small" type="success" effect="plain" class="md-tab-tag">
            Default
          </el-tag>
          <el-tag
            v-else-if="
              d.is_shared_all ||
              (d.shared_users && d.shared_users.length) ||
              (d.shared_groups && d.shared_groups.length)
            "
            size="small"
            type="info"
            effect="plain"
            class="md-tab-tag"
          >
            Shared
          </el-tag>
        </button>
      </div>

      <div class="md-tabbar-actions">
        <el-button v-if="canManage" size="small" type="primary" plain @click="openCreateDialog()">
          <i class="fa fa-plus" style="margin-right: 4px" />
          New Dashboard
        </el-button>
        <el-button v-if="canManage && !standalone" size="small" @click="goManagePage">
          <i class="fa fa-sliders" style="margin-right: 4px" />
          Manage
        </el-button>
      </div>
    </div>

    <!-- Builtin Overview Slot -->
    <div v-if="activeTab === 'builtin' && !standalone">
      <slot />
    </div>

    <!-- Custom Dashboard Canvas -->
    <div v-else-if="activeDashboard" class="md-canvas">
      <!-- Global Toolbar -->
      <div class="md-toolbar">
        <div class="md-toolbar-left">
          <div class="md-dash-title">
            <span>{{ activeDashboard.name }}</span>
            <el-tag v-if="activeDashboard.is_default" size="small" type="success">Default</el-tag>
            <el-tag size="small" type="info" effect="plain">
              {{ shareSummary(activeDashboard) }}
            </el-tag>
          </div>
          <div v-if="activeDashboard.description" class="md-dash-desc">
            {{ activeDashboard.description }}
          </div>
        </div>

        <div class="md-toolbar-right">
          <span v-if="isTvMode" class="md-tv-clock">{{ tvClock }}</span>

          <!-- Global Time-Range Switcher -->
          <el-radio-group v-model="currentDays" size="small" @change="onDaysChange">
            <el-radio-button :value="1">24h</el-radio-button>
            <el-radio-button :value="7">7d</el-radio-button>
            <el-radio-button :value="30">30d</el-radio-button>
          </el-radio-group>

          <!-- Auto-Refresh Selector -->
          <el-select
            v-model="currentRefresh"
            size="small"
            style="width: 112px"
            @change="setupRefreshTimer"
          >
            <el-option :value="0" label="Refresh: Off" />
            <el-option :value="15" label="Every 15s" />
            <el-option :value="60" label="Every 1m" />
            <el-option :value="300" label="Every 5m" />
          </el-select>

          <el-button size="small" title="Refresh Now" @click="triggerRefresh">
            <i class="fa fa-refresh" :class="{ 'fa-spin': refreshing }" />
          </el-button>

          <el-button
            size="small"
            :type="isTvMode ? 'warning' : 'default'"
            title="Fullscreen NOC / TV Wall Mode"
            @click="toggleTvMode"
          >
            <i
              class="fa"
              :class="isTvMode ? 'fa-compress' : 'fa-expand'"
              style="margin-right: 4px"
            />
            {{ isTvMode ? 'Exit TV Mode' : 'TV Wall' }}
          </el-button>

          <template v-if="activeDashboard.can_edit && !isTvMode">
            <el-button
              v-if="!editingLayout"
              size="small"
              type="primary"
              plain
              @click="startEditLayout"
            >
              <i class="fa fa-th" style="margin-right: 4px" />
              Customize Layout
            </el-button>

            <template v-else>
              <el-button size="small" type="primary" plain @click="galleryVisible = true">
                <i class="fa fa-plus-circle" style="margin-right: 4px" />
                Add Widgets
              </el-button>
              <el-button size="small" type="success" :loading="savingLayout" @click="saveLayout">
                <i class="fa fa-check" style="margin-right: 4px" />
                Save Layout
              </el-button>
              <el-button size="small" @click="cancelEditLayout">Cancel</el-button>
            </template>

            <el-button
              size="small"
              title="Share & Settings"
              @click="openEditDialog(activeDashboard)"
            >
              <i class="fa fa-share-alt" style="margin-right: 4px" />
              Share
            </el-button>

            <el-button
              size="small"
              title="Duplicate Dashboard"
              @click="cloneDashboard(activeDashboard)"
            >
              <i class="fa fa-clone" />
            </el-button>
          </template>
        </div>
      </div>

      <!-- Customize Mode Banner -->
      <el-alert
        v-if="editingLayout"
        type="warning"
        :closable="false"
        show-icon
        class="md-edit-banner"
        title="Customize Mode: Drag widget headers to reorder, resize column widths (1/3, 1/2, 2/3, Full), or click 'Add Widgets' to open the gallery."
      />

      <!-- 24-Column Responsive Grid -->
      <el-row :gutter="16" class="md-grid">
        <el-col
          v-for="(item, idx) of workingLayout"
          :key="item.id"
          :lg="item.span || 12"
          :md="item.span || 12"
          :sm="24"
          :xs="24"
          class="md-grid-col"
          :draggable="editingLayout"
          @dragstart="onDragStart(idx)"
          @dragover.prevent
          @drop="onDrop(idx)"
        >
          <div class="md-widget-shell" :class="{ 'is-editing': editingLayout }">
            <!-- Edit Controls Bar -->
            <div v-if="editingLayout" class="md-widget-editbar">
              <div class="md-widget-drag">
                <i class="fa fa-bars" />
                <span class="md-widget-meta-title">{{ widgetTitle(item.widget) }}</span>
              </div>

              <div class="md-widget-controls">
                <el-input
                  v-model="item.title"
                  size="small"
                  placeholder="Custom header (optional)"
                  style="width: 170px"
                />
                <el-button-group size="small">
                  <el-button
                    v-for="s of spanChoices"
                    :key="s.value"
                    :type="item.span === s.value ? 'primary' : 'default'"
                    @click="item.span = s.value"
                  >
                    {{ s.label }}
                  </el-button>
                </el-button-group>
                <el-button-group size="small">
                  <el-button :disabled="idx === 0" @click="moveWidget(idx, -1)">
                    <i class="fa fa-arrow-left" />
                  </el-button>
                  <el-button
                    :disabled="idx === workingLayout.length - 1"
                    @click="moveWidget(idx, 1)"
                  >
                    <i class="fa fa-arrow-right" />
                  </el-button>
                </el-button-group>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  :disabled="workingLayout.length <= 1"
                  @click="removeWidget(idx)"
                >
                  <i class="fa fa-trash" />
                </el-button>
              </div>
            </div>

            <div v-else-if="item.title" class="md-widget-custom-header">
              {{ item.title }}
            </div>

            <CustomDashboardWidget
              :widget="item.widget"
              :days="currentDays"
              :refresh-key="refreshKey"
              :allowed="isWidgetAllowed(item.widget)"
            />
          </div>
        </el-col>
      </el-row>
    </div>

    <el-empty
      v-else
      description="No custom dashboards created yet. Click 'New Dashboard' to build one from a template."
    >
      <el-button v-if="canManage" type="primary" @click="openCreateDialog()">
        Create First Dashboard
      </el-button>
    </el-empty>

    <!-- Visual Widget Gallery Drawer -->
    <el-drawer v-model="galleryVisible" title="Visual Widget Gallery" size="460px" append-to-body>
      <div class="md-gallery">
        <el-radio-group v-model="galleryCategory" size="small" style="margin-bottom: 14px">
          <el-radio-button value="all">All</el-radio-button>
          <el-radio-button value="console">Console</el-radio-button>
          <el-radio-button v-if="catalog.some((w) => w.category === 'jit')" value="jit">
            JIT &amp; ZSP
          </el-radio-button>
          <el-radio-button value="pam">PAM &amp; Vault</el-radio-button>
          <el-radio-button value="audit">SOC &amp; Audit</el-radio-button>
        </el-radio-group>

        <div v-for="w of filteredCatalog" :key="w.id" class="md-gallery-card">
          <div class="md-gallery-head">
            <div>
              <b>{{ w.title }}</b>
              <el-tag size="small" effect="plain" style="margin-left: 6px">
                {{ w.category.toUpperCase() }}
              </el-tag>
            </div>
            <el-button size="small" type="primary" @click="addWidget(w)">
              <i class="fa fa-plus" style="margin-right: 4px" />
              Add
              <span v-if="widgetCountOnCanvas(w.id) > 0">({{ widgetCountOnCanvas(w.id) }})</span>
            </el-button>
          </div>
          <div class="md-gallery-desc">{{ w.description }}</div>
        </div>
      </div>
    </el-drawer>

    <!-- Create / Edit / Share Dialog -->
    <CustomDashboardDialog
      v-model:visible="dialogVisible"
      :dashboard="editingDashboard"
      :templates="templates"
      :default-scope="sectionScope"
      :org-name="orgName"
      @saved="onDashboardSaved"
    />
  </div>
</template>

<script>
import CustomDashboardWidget from './CustomDashboardWidget.vue'
import CustomDashboardDialog from './CustomDashboardDialog.vue'

export default {
  name: 'MultiDashboardHost',
  components: {
    CustomDashboardWidget,
    CustomDashboardDialog
  },
  props: {
    sectionScope: { type: String, default: 'console' },
    builtinTitle: { type: String, default: '' },
    standalone: { type: Boolean, default: false },
    initialDashboardId: { type: String, default: '' }
  },
  data() {
    return {
      dashboards: [],
      widgetsCatalog: [],
      templates: [],
      canManage: false,
      orgName: '',
      activeTab: this.standalone ? '' : 'builtin',
      currentDays: 7,
      currentRefresh: 0,
      refreshKey: 0,
      refreshing: false,
      refreshTimer: null,
      clockTimer: null,
      tvClock: '',
      isTvMode: false,
      editingLayout: false,
      savingLayout: false,
      workingLayout: [],
      dragIndex: null,
      galleryVisible: false,
      galleryCategory: 'all',
      dialogVisible: false,
      editingDashboard: null,
      spanChoices: [
        { label: '1/3', value: 8 },
        { label: '1/2', value: 12 },
        { label: '2/3', value: 16 },
        { label: 'Full', value: 24 }
      ]
    }
  },
  computed: {
    activeDashboard() {
      if (this.activeTab === 'builtin') return null
      return this.dashboards.find((d) => d.id === this.activeTab) || null
    },
    filteredCatalog() {
      if (this.galleryCategory === 'all') return this.widgetsCatalog
      return this.widgetsCatalog.filter((w) => w.category === this.galleryCategory)
    }
  },
  watch: {
    initialDashboardId(val) {
      if (val) this.selectTab(val)
    },
    '$route.query.dashboard'(val) {
      if (val) this.selectTab(String(val))
    }
  },
  mounted() {
    this.loadAll()
    window.addEventListener('keydown', this.onKeyDown)
  },
  beforeUnmount() {
    this.clearTimers()
    window.removeEventListener('keydown', this.onKeyDown)
  },
  methods: {
    async loadAll(preferId = '') {
      try {
        const [catalogRes, listRes] = await Promise.all([
          this.$axios.get('/api/v1/reports/custom-dashboards/catalog/', {
            disableFlashErrorMsg: true
          }),
          this.$axios.get('/api/v1/reports/custom-dashboards/', {
            params: { scope: this.sectionScope },
            disableFlashErrorMsg: true
          })
        ])
        this.canManage = !!catalogRes?.can_manage
        this.orgName = catalogRes?.org_name || ''
        this.widgetsCatalog = catalogRes?.widgets || []
        this.templates = catalogRes?.templates || []
        this.dashboards = Array.isArray(listRes) ? listRes : listRes?.results || []

        const queryDash = preferId || this.initialDashboardId || this.$route?.query?.dashboard
        if (queryDash && this.dashboards.some((d) => d.id === queryDash)) {
          this.selectTab(String(queryDash))
        } else if (
          this.activeTab !== 'builtin' &&
          this.dashboards.some((d) => d.id === this.activeTab)
        ) {
          this.selectTab(this.activeTab)
        } else {
          const defaultDash = this.dashboards.find((d) => d.is_default)
          if (defaultDash) {
            this.selectTab(defaultDash.id)
          } else if (this.standalone && this.dashboards.length) {
            this.selectTab(this.dashboards[0].id)
          } else {
            this.activeTab = this.standalone ? '' : 'builtin'
          }
        }
      } catch (e) {
        // Fallback silently to builtin dashboard if API fails
      }
    },
    selectTab(tabId) {
      this.editingLayout = false
      this.activeTab = tabId
      const d = this.dashboards.find((item) => item.id === tabId)
      if (d) {
        this.currentDays = d.days || 7
        this.currentRefresh = d.refresh_seconds || 0
        this.workingLayout = JSON.parse(JSON.stringify(d.layout || []))
        this.setupRefreshTimer()
      } else {
        this.clearTimers()
      }
    },
    onDaysChange() {
      this.triggerRefresh()
    },
    triggerRefresh() {
      this.refreshing = true
      this.refreshKey += 1
      setTimeout(() => {
        this.refreshing = false
      }, 400)
    },
    setupRefreshTimer() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
      if (this.currentRefresh > 0 && this.activeDashboard) {
        this.refreshTimer = setInterval(() => {
          this.triggerRefresh()
        }, this.currentRefresh * 1000)
      }
    },
    clearTimers() {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
      if (this.clockTimer) {
        clearInterval(this.clockTimer)
        this.clockTimer = null
      }
    },
    toggleTvMode() {
      this.isTvMode = !this.isTvMode
      if (this.isTvMode) {
        this.editingLayout = false
        this.tvClock = new Date().toLocaleTimeString()
        this.clockTimer = setInterval(() => {
          this.tvClock = new Date().toLocaleTimeString()
        }, 1000)
      } else if (this.clockTimer) {
        clearInterval(this.clockTimer)
        this.clockTimer = null
      }
    },
    onKeyDown(e) {
      if (e.key === 'Escape' && this.isTvMode) {
        this.toggleTvMode()
      }
    },
    widgetTitle(widgetId) {
      const found = this.widgetsCatalog.find((w) => w.id === widgetId)
      return found ? found.title : widgetId
    },
    isWidgetAllowed(widgetId) {
      const found = this.widgetsCatalog.find((w) => w.id === widgetId)
      return found ? found.allowed !== false : true
    },
    widgetCountOnCanvas(widgetId) {
      return this.workingLayout.filter((item) => item.widget === widgetId).length
    },
    shareSummary(d) {
      if (d.is_shared_all) return 'Shared: Entire Org'
      const uCount = (d.shared_users || []).length
      const gCount = (d.shared_groups || []).length
      if (uCount || gCount) {
        const parts = []
        if (uCount) parts.push(`${uCount} user${uCount > 1 ? 's' : ''}`)
        if (gCount) parts.push(`${gCount} group${gCount > 1 ? 's' : ''}`)
        return `Shared: ${parts.join(', ')}`
      }
      return 'Admins Only'
    },
    startEditLayout() {
      if (!this.activeDashboard) return
      this.workingLayout = JSON.parse(JSON.stringify(this.activeDashboard.layout || []))
      this.editingLayout = true
    },
    cancelEditLayout() {
      if (this.activeDashboard) {
        this.workingLayout = JSON.parse(JSON.stringify(this.activeDashboard.layout || []))
      }
      this.editingLayout = false
    },
    addWidget(w) {
      this.workingLayout.push({
        id: `${w.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        widget: w.id,
        span: w.default_span || 12,
        title: ''
      })
      this.$message.success(`Added "${w.title}"`)
    },
    removeWidget(idx) {
      if (this.workingLayout.length <= 1) return
      this.workingLayout.splice(idx, 1)
    },
    moveWidget(idx, delta) {
      const target = idx + delta
      if (target < 0 || target >= this.workingLayout.length) return
      const copy = [...this.workingLayout]
      const [moved] = copy.splice(idx, 1)
      copy.splice(target, 0, moved)
      this.workingLayout = copy
    },
    onDragStart(idx) {
      this.dragIndex = idx
    },
    onDrop(targetIdx) {
      if (this.dragIndex === null || this.dragIndex === targetIdx) return
      const copy = [...this.workingLayout]
      const [moved] = copy.splice(this.dragIndex, 1)
      copy.splice(targetIdx, 0, moved)
      this.workingLayout = copy
      this.dragIndex = null
    },
    async saveLayout() {
      if (!this.activeDashboard) return
      this.savingLayout = true
      try {
        const updated = await this.$axios.patch(
          `/api/v1/reports/custom-dashboards/${this.activeDashboard.id}/`,
          {
            layout: this.workingLayout,
            days: this.currentDays,
            refresh_seconds: this.currentRefresh
          }
        )
        const idx = this.dashboards.findIndex((d) => d.id === updated.id)
        if (idx >= 0) this.dashboards.splice(idx, 1, updated)
        this.workingLayout = JSON.parse(JSON.stringify(updated.layout || []))
        this.editingLayout = false
        this.$message.success(this.$t('SaveSuccessMsg') || 'Dashboard layout saved')
      } finally {
        this.savingLayout = false
      }
    },
    openCreateDialog(templateId = '') {
      this.editingDashboard = templateId ? { template: templateId } : null
      this.dialogVisible = true
    },
    openEditDialog(d) {
      this.editingDashboard = d
      this.dialogVisible = true
    },
    async cloneDashboard(d) {
      const cloned = await this.$axios.post(`/api/v1/reports/custom-dashboards/${d.id}/clone/`, {})
      this.$message.success(`Cloned "${cloned.name}"`)
      await this.loadAll(cloned.id)
    },
    async onDashboardSaved(saved) {
      await this.loadAll(saved?.id || '')
    },
    goManagePage() {
      const routeMap = {
        console: 'ConsoleCustomDashboards',
        pam: 'PamCustomDashboards',
        audit: 'AuditCustomDashboards'
      }
      const routeName = routeMap[this.sectionScope] || 'ConsoleCustomDashboards'
      this.$router.push({ name: routeName })
    }
  }
}
</script>

<style lang="scss" scoped>
.md-tabbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding: 8px 12px;
  background: var(--page-background-color, #ffffff);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.md-tabs-scroll {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
}

.md-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &.is-active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
    color: var(--color-primary, var(--el-color-primary));
  }
}

.md-tab-tag {
  margin-left: 2px;
}

.md-tabbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.md-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  padding: 12px 16px;
  background: var(--page-background-color, #ffffff);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.md-dash-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.md-dash-desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.md-toolbar-right {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.md-edit-banner {
  margin-bottom: 14px;
}

.md-grid-col {
  margin-bottom: 16px;
}

.md-widget-shell {
  height: 100%;
  border-radius: 8px;

  &.is-editing {
    border: 2px dashed var(--el-color-primary-light-3);
    padding: 8px;
    background: var(--el-fill-color-blank);
  }
}

.md-widget-editbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 10px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  cursor: move;
}

.md-widget-drag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
}

.md-widget-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.md-widget-custom-header {
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  margin-bottom: 6px;
  background: var(--page-background-color, #ffffff);
  border-radius: 6px;
  color: var(--color-text-primary);
}

.md-gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.md-gallery-card {
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--page-background-color, #fff);
}

.md-gallery-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.md-gallery-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}

.md-tv-mode {
  position: fixed;
  inset: 0;
  z-index: 2500;
  overflow-y: auto;
  padding: 16px 24px;
  background: var(--page-content-background-color, #f1f5f9);

  .md-tabbar {
    display: none;
  }
}

.md-tv-clock {
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
}
</style>
