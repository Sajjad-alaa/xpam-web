<template>
  <Page>
    <div class="appearance-container">
      <!-- Section 1: Color Scheme & Theme Presets -->
      <IBox :title="$t('Theme') || 'Theme & Appearance'" class="section-card">
        <!-- Visual Mode Selection (Light / Dark / Auto) -->
        <div class="setting-subsection">
          <div class="subsection-header">
            <span class="subsection-title">{{ $t('ThemeMode') || 'Theme Mode' }}</span>
            <span class="subsection-desc">{{
              $t('ThemeModeTip') || 'Select your visual appearance mode'
            }}</span>
          </div>
          <div class="mode-selector-grid">
            <div
              v-for="mode in modeOptions"
              :key="mode.value"
              class="mode-card"
              :class="{ 'is-active': selectedMode === mode.value }"
              @click="handleModeChange(mode.value)"
            >
              <div class="mode-icon-wrapper" :class="mode.value">
                <i :class="mode.icon" />
              </div>
              <div class="mode-info">
                <div class="mode-name">{{ mode.label }}</div>
                <div class="mode-desc">{{ mode.desc }}</div>
              </div>
              <div class="mode-check">
                <i v-if="selectedMode === mode.value" class="fa fa-check-circle check-active" />
                <span v-else class="check-circle" />
              </div>
            </div>
          </div>
        </div>

        <!-- Curated Themes Gallery -->
        <div class="setting-subsection m-t-lg">
          <div class="subsection-header">
            <span class="subsection-title">{{ $t('ThemePreset') || 'Curated Themes' }}</span>
            <span class="subsection-desc">{{
              $t('ThemePresetTip') || 'Choose from modern dark and light palettes'
            }}</span>
          </div>
          <div class="themes-grid">
            <div
              v-for="theme in themeConfigs"
              :key="theme.name"
              class="theme-card"
              :class="{ 'is-active': selectedTheme === theme.name }"
              @click="handleThemeSelect(theme)"
            >
              <div class="theme-card-top">
                <span class="theme-name">{{ getThemeLabel(theme) }}</span>
                <span class="theme-tag" :class="theme.is_dark ? 'tag-dark' : 'tag-light'">
                  {{ theme.is_dark ? 'Dark' : 'Light' }}
                </span>
              </div>

              <!-- Mini mockup of the UI -->
              <div class="theme-mockup">
                <div
                  class="mockup-header"
                  :style="{ backgroundColor: getThemeColor(theme, '--banner-bg') }"
                >
                  <div class="mockup-dot" />
                  <div class="mockup-line" />
                </div>
                <div class="mockup-body">
                  <div
                    class="mockup-sidebar"
                    :style="{ backgroundColor: getThemeColor(theme, '--menu-bg') }"
                  >
                    <div
                      class="mockup-item is-active"
                      :style="{ backgroundColor: getThemeColor(theme, '--color-primary') }"
                    />
                    <div class="mockup-item" />
                    <div class="mockup-item" />
                  </div>
                  <div
                    class="mockup-content"
                    :style="{
                      backgroundColor: getThemeColor(theme, '--page-content-background-color')
                    }"
                  >
                    <div
                      class="mockup-card"
                      :style="{ backgroundColor: theme.is_dark ? '#1e293b' : '#ffffff' }"
                    >
                      <div
                        class="mockup-accent-pill"
                        :style="{ backgroundColor: getThemeColor(theme, '--color-primary') }"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Color dots swatch -->
              <div class="theme-swatches">
                <span class="swatch-label">Colors:</span>
                <div class="swatches-dots">
                  <span
                    class="color-dot"
                    :style="{ backgroundColor: getThemeColor(theme, '--color-primary') }"
                    title="Primary Accent"
                  />
                  <span
                    class="color-dot"
                    :style="{ backgroundColor: getThemeColor(theme, '--banner-bg') }"
                    title="Top Header"
                  />
                  <span
                    class="color-dot"
                    :style="{ backgroundColor: getThemeColor(theme, '--menu-bg') }"
                    title="Sidebar"
                  />
                  <span
                    class="color-dot"
                    :style="{
                      backgroundColor: getThemeColor(theme, '--page-content-background-color')
                    }"
                    title="Surface Canvas"
                  />
                </div>
              </div>

              <div class="theme-check-icon">
                <i v-if="selectedTheme === theme.name" class="fa fa-check-circle check-active" />
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Primary Accent Color -->
        <div class="setting-subsection m-t-lg">
          <div class="subsection-header">
            <span class="subsection-title">{{ $t('AccentColor') || 'Primary Accent Color' }}</span>
            <span class="subsection-desc">{{
              $t('AccentColorTip') ||
              'Select a signature brand accent color or input custom hex code'
            }}</span>
          </div>
          <div class="accent-picker-row">
            <div class="swatch-pills">
              <button
                v-for="color in presetAccents"
                :key="color.hex"
                type="button"
                class="accent-pill"
                :class="{ 'is-selected': customPrimary.toLowerCase() === color.hex.toLowerCase() }"
                :style="{ backgroundColor: color.hex }"
                :title="color.name"
                @click="handleAccentSelect(color.hex)"
              >
                <i
                  v-if="customPrimary.toLowerCase() === color.hex.toLowerCase()"
                  class="fa fa-check"
                />
              </button>
            </div>
            <div class="custom-color-control">
              <el-color-picker
                v-model="customPrimary"
                size="small"
                @change="handleCustomColorChange"
              />
              <el-input
                v-model="customPrimary"
                size="small"
                style="width: 120px"
                placeholder="#38bdf8"
                @change="handleCustomColorChange"
              />
            </div>
          </div>
        </div>
      </IBox>

      <!-- Section 2: Live Interactive Preview -->
      <IBox :title="$t('Preview') || 'Interactive Interface Preview'" class="section-card">
        <div class="preview-container">
          <div class="preview-row">
            <span class="preview-label">Buttons:</span>
            <div class="preview-items">
              <el-button type="primary" size="small">{{ $t('Primary') || 'Primary' }}</el-button>
              <el-button type="success" size="small">{{ $t('Success') || 'Success' }}</el-button>
              <el-button type="info" size="small">{{ $t('Info') || 'Info' }}</el-button>
              <el-button type="warning" size="small">{{ $t('Warning') || 'Warning' }}</el-button>
              <el-button type="danger" size="small">{{ $t('Danger') || 'Danger' }}</el-button>
              <el-button size="small" disabled>{{ $t('Disabled') || 'Disabled' }}</el-button>
            </div>
          </div>

          <div class="preview-row">
            <span class="preview-label">Tags & Badges:</span>
            <div class="preview-items">
              <el-tag type="primary" size="small">{{ $t('Primary') || 'Primary' }}</el-tag>
              <el-tag type="success" size="small">{{ $t('Active') || 'Active' }}</el-tag>
              <el-tag type="info" size="small">{{ $t('Pending') || 'Pending' }}</el-tag>
              <el-tag type="warning" size="small">{{ $t('Warning') || 'Warning' }}</el-tag>
              <el-tag type="danger" size="small">{{ $t('Expired') || 'Expired' }}</el-tag>
            </div>
          </div>

          <div class="preview-row">
            <span class="preview-label">Controls:</span>
            <div class="preview-items controls-items">
              <el-input
                v-model="previewInput"
                size="small"
                style="width: 220px"
                placeholder="Modern input control..."
              />
              <el-switch v-model="previewSwitch" active-text="Status Active" />
            </div>
          </div>
        </div>
      </IBox>

      <!-- Section 3: Branding & Platform Identity -->
      <IBox :title="$t('Basic') || 'Platform Branding'" class="section-card">
        <el-form label-position="top" class="branding-form">
          <el-form-item :label="$t('LoginTitle') || 'Login Title'">
            <el-input v-model="form.login_title" placeholder="XPAM" style="max-width: 480px" />
          </el-form-item>

          <div class="logos-grid">
            <div class="logo-item">
              <div class="logo-label">{{ $t('LogoIndex') || 'Platform Navigation Logo' }}</div>
              <UploadField
                v-model="form.logo_index"
                :height="40"
                accept="image/jpg, image/png, image/jpeg, image/webp"
                :tip="$t('LogoIndexTip') || 'Recommended height 40px'"
                :show-b-g="true"
                @file-change="(f) => handleFileChange('logo_index', f)"
              />
            </div>

            <div class="logo-item">
              <div class="logo-label">{{ $t('LogoLogout') || 'Logout / Login Card Logo' }}</div>
              <UploadField
                v-model="form.logo_logout"
                :width="82"
                :height="82"
                accept="image/jpg, image/png, image/jpeg, image/webp"
                :tip="$t('LogoLogoutTip') || 'Recommended size 82x82px'"
                @file-change="(f) => handleFileChange('logo_logout', f)"
              />
            </div>

            <div class="logo-item">
              <div class="logo-label">{{ $t('Favicon') || 'Browser Favicon' }}</div>
              <UploadField
                v-model="form.favicon"
                :width="32"
                :height="32"
                accept="image/jpg, image/png, image/jpeg, image/x-icon, image/vnd.microsoft.icon"
                :tip="$t('FaviconTip') || 'Recommended size 32x32px'"
                @file-change="(f) => handleFileChange('favicon', f)"
              />
            </div>

            <div class="logo-item">
              <div class="logo-label">{{ $t('LoginImage') || 'Login Hero Image' }}</div>
              <UploadField
                v-model="form.login_image"
                :width="260"
                :height="180"
                accept="image/jpg, image/png, image/jpeg"
                :tip="$t('LoginImageTip') || 'Recommended size 492x472px'"
                @file-change="(f) => handleFileChange('login_image', f)"
              />
            </div>
          </div>

          <el-form-item :label="$t('Footer') || 'Footer Content'" class="m-t-lg">
            <MarkDown v-model="form.footer_content" :rows="4" />
          </el-form-item>
        </el-form>
      </IBox>

      <!-- Section 4: Action Bar -->
      <div class="appearance-actions">
        <el-button type="primary" :loading="saving" size="default" @click="handleSave">
          <i class="fa fa-check" style="margin-right: 6px" />
          {{ $t('Save') || 'Save Changes' }}
        </el-button>
        <el-button size="default" @click="handleRestore">
          <i class="fa fa-refresh" style="margin-right: 6px" />
          {{ $t('RestoreButton') || 'Restore Defaults' }}
        </el-button>
      </div>
    </div>
  </Page>
</template>

<script>
import { getInterfaceInfo, previewThemes, restoreInterface, updateInterface } from '@/api/interface'
import { IBox, UploadField } from '@/components'
import MarkDown from '@/components/Widgets/MarkDown'
import { Page } from '@/layout/components'
import { getLangCode } from '@/i18n/utils'
import { isDarkMode, setDarkMode, toggleDarkMode, getSavedThemeMode } from '@/utils/theme/color'

export default {
  name: 'InterfaceSettings',
  components: {
    IBox,
    Page,
    UploadField,
    MarkDown
  },
  data() {
    return {
      loading: true,
      saving: false,
      selectedTheme: 'midnight_dark',
      selectedMode: 'dark',
      customPrimary: '#38bdf8',
      previewInput: '',
      previewSwitch: true,
      files: {},
      form: {
        login_title: '',
        logo_index: '',
        logo_logout: '',
        favicon: '',
        login_image: '',
        footer_content: ''
      },
      themeConfigs: [],
      modeOptions: [
        {
          value: 'dark',
          label: 'Dark Mode',
          desc: 'High contrast dark surfaces for focused work',
          icon: 'fa fa-moon-o'
        },
        {
          value: 'light',
          label: 'Light Mode',
          desc: 'Clean, crisp modern light surfaces',
          icon: 'fa fa-sun-o'
        },
        {
          value: 'auto',
          label: 'Follow System',
          desc: 'Sync automatically with OS dark/light mode',
          icon: 'fa fa-desktop'
        }
      ],
      presetAccents: [
        { name: 'Sky Blue', hex: '#38bdf8' },
        { name: 'Ocean Blue', hex: '#2563eb' },
        { name: 'Emerald Green', hex: '#10b981' },
        { name: 'Indigo Purple', hex: '#6366f1' },
        { name: 'Amethyst Violet', hex: '#a855f7' },
        { name: 'Rose Crimson', hex: '#f43f5e' },
        { name: 'Amber Gold', hex: '#f59e0b' }
      ]
    }
  },
  async mounted() {
    await Promise.all([this.fetchInterfaceData(), this.fetchThemeConfigs()])
    this.initCurrentThemeState()
    this.loading = false
  },
  methods: {
    async fetchInterfaceData() {
      try {
        const data = await getInterfaceInfo()
        if (data) {
          this.form = {
            login_title: data.login_title || '',
            logo_index: data.logo_index || '',
            logo_logout: data.logo_logout || '',
            favicon: data.favicon || '',
            login_image: data.login_image || '',
            footer_content: data.footer_content || ''
          }
          if (data.theme) {
            this.selectedTheme = data.theme
          }
          if (data.custom_primary) {
            this.customPrimary = data.custom_primary
          }
          if (data.theme_mode) {
            this.selectedMode = data.theme_mode
          }
        }
      } catch (e) {
        // Fallback
      }
    },
    async fetchThemeConfigs() {
      try {
        const themes = await previewThemes()
        if (Array.isArray(themes) && themes.length > 0) {
          this.themeConfigs = themes
        }
      } catch (e) {
        // Fallback
      }
    },
    initCurrentThemeState() {
      const savedMode = getSavedThemeMode()
      if (savedMode === 'dark' || savedMode === 'light') {
        this.selectedMode = savedMode
      }
      const activeThemeObj = this.themeConfigs.find((t) => t.name === this.selectedTheme)
      if (activeThemeObj) {
        const primary = activeThemeObj.colors?.['--color-primary'] || activeThemeObj.colors?.primary
        if (primary && !this.customPrimary) {
          this.customPrimary = primary
        }
      }
    },
    getThemeLabel(theme) {
      const raw = (getLangCode() || 'en').toLowerCase()
      let key = 'en'
      if (raw.startsWith('zh')) key = 'zh'
      else if (raw.startsWith('ja')) key = 'ja'
      return theme.display?.[key] || theme.display?.en || theme.name
    },
    getThemeColor(theme, prop) {
      return theme.colors?.[prop] || '#38bdf8'
    },
    getThemeMockupStyle(theme) {
      return {
        borderColor: theme.is_dark ? '#243044' : '#e2e8f0'
      }
    },
    handleModeChange(mode) {
      this.selectedMode = mode
      if (mode === 'dark') {
        localStorage.setItem('lina-theme-mode', 'dark')
        setDarkMode(true)
      } else if (mode === 'light') {
        localStorage.setItem('lina-theme-mode', 'light')
        setDarkMode(false)
      } else {
        localStorage.setItem('lina-theme-mode', 'auto')
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setDarkMode(systemDark)
      }
      this.applyLiveColors()
    },
    handleThemeSelect(theme) {
      this.selectedTheme = theme.name
      if (theme.is_dark) {
        this.selectedMode = 'dark'
        localStorage.setItem('lina-theme-mode', 'dark')
        setDarkMode(true)
      } else {
        this.selectedMode = 'light'
        localStorage.setItem('lina-theme-mode', 'light')
        setDarkMode(false)
      }
      const primary = theme.colors?.['--color-primary'] || theme.colors?.primary
      if (primary) {
        this.customPrimary = primary
      }
      this.applyLiveColors()
    },
    handleAccentSelect(hex) {
      this.customPrimary = hex
      this.applyLiveColors()
    },
    handleCustomColorChange(val) {
      if (val && val.startsWith('#')) {
        this.customPrimary = val
        this.applyLiveColors()
      }
    },
    applyLiveColors() {
      const activeThemeObj = this.themeConfigs.find((t) => t.name === this.selectedTheme)
      const baseColors = activeThemeObj?.colors ? { ...activeThemeObj.colors } : {}
      if (this.customPrimary && this.customPrimary.startsWith('#')) {
        baseColors['--color-primary'] = this.customPrimary
        baseColors['--color-link'] = this.customPrimary
        baseColors['--menu-text-active'] = this.customPrimary
        baseColors['primary'] = this.customPrimary
      }
      baseColors['theme_mode'] = this.selectedMode
      if (this.selectedMode === 'auto') {
        delete baseColors['is_dark']
      } else {
        baseColors['is_dark'] = this.selectedMode === 'dark'
      }
      this.$store.dispatch('settings/changeThemeStyle', baseColors)
    },
    handleFileChange(field, file) {
      this.files[field] = file
    },
    async handleSave() {
      this.saving = true
      try {
        const form = new FormData()
        form.append('theme', this.selectedTheme)
        form.append('theme_mode', this.selectedMode)
        form.append('custom_primary', this.customPrimary)
        form.append('login_title', this.form.login_title)
        form.append('footer_content', this.form.footer_content)

        const imageKeys = ['favicon', 'login_image', 'logo_logout', 'logo_index']
        for (const key of imageKeys) {
          if (this.files[key] !== undefined && this.files[key] !== null) {
            form.append(key, this.files[key])
          } else if (this.form[key]) {
            form.append(key, this.form[key])
          }
        }

        const res = await updateInterface(form)
        this.$message.success(
          this.$tc('UpdateSuccessMsg') || 'Appearance settings updated successfully'
        )

        if (res?.theme_info?.colors) {
          this.$store.dispatch('settings/changeThemeStyle', res.theme_info.colors)
        }
        await this.$store.dispatch('settings/getPublicSettings', true)

        setTimeout(() => {
          location.reload()
        }, 500)
      } catch (err) {
        this.$message.error((err?.detail || err?.message || err) + '')
      } finally {
        this.saving = false
      }
    },
    handleRestore() {
      this.$confirm(
        this.$t('RestoreDialogMessage') ||
          'Are you sure you want to restore default appearance settings?',
        this.$t('RestoreDialogTitle') || 'Restore Defaults',
        {
          confirmButtonText: this.$t('Confirm') || 'Confirm',
          cancelButtonText: this.$t('Cancel') || 'Cancel',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const res = await restoreInterface()
          localStorage.removeItem('lina-theme-mode')
          this.$message.success(res.success || 'Restored successfully')
          location.reload()
        } catch (e) {
          this.$message.error('Restore failed')
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.appearance-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.section-card {
  border-radius: var(--jms-card-radius, 8px);
}

.setting-subsection {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.m-t-lg {
  margin-top: 24px;
}

.subsection-header {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .subsection-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .subsection-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

// Mode Selection Cards (Light / Dark / Auto)
.mode-selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.mode-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--panel-border-color, var(--el-border-color));
  background-color: var(--el-bg-color-overlay, var(--page-background-color));
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: var(--jms-card-shadow-hover);
  }

  &.is-active {
    border-color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 6%, transparent);
    box-shadow: 0 0 0 1px var(--color-primary);
  }

  .mode-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    font-size: 18px;

    &.dark {
      background: #0f172a;
      color: #38bdf8;
    }

    &.light {
      background: #f1f5f9;
      color: #f59e0b;
    }

    &.auto {
      background: #e2e8f0;
      color: #475569;
    }
  }

  html.dark & {
    .mode-icon-wrapper {
      &.light {
        background: rgba(255, 255, 255, 0.08);
        color: #fbbf24;
      }

      &.auto {
        background: rgba(255, 255, 255, 0.06);
        color: #94a3b8;
      }

      &.dark {
        background: #0f172a;
        color: #38bdf8;
      }
    }
  }

  .mode-info {
    flex: 1 1 auto;
    min-width: 0;

    .mode-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .mode-desc {
      font-size: 11px;
      color: var(--color-text-secondary);
      margin-top: 2px;
    }
  }

  .mode-check {
    flex: 0 0 auto;

    .check-active {
      font-size: 18px;
      color: var(--color-primary);
    }

    .check-circle {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 1px solid var(--panel-border-color);
    }
  }
}

// Curated Themes Grid
.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.theme-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid var(--panel-border-color, var(--el-border-color));
  background-color: var(--el-bg-color-overlay, var(--page-background-color));
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: var(--jms-card-shadow-hover);
  }

  &.is-active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  .theme-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .theme-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .theme-tag {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;

      &.tag-dark {
        background: #0f172a;
        color: #38bdf8;
        border: 1px solid #243044;
      }

      &.tag-light {
        background: #f1f5f9;
        color: #059669;
        border: 1px solid #e2e8f0;
      }
    }

    html.dark & {
      .theme-tag.tag-light {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .theme-tag.tag-dark {
        background: rgba(56, 189, 248, 0.12);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.25);
      }
    }
  }

  // Mini Mockup
  .theme-mockup {
    display: flex;
    flex-direction: column;
    height: 72px;
    border-radius: 6px;
    border: 1px solid;
    overflow: hidden;

    .mockup-header {
      display: flex;
      align-items: center;
      gap: 6px;
      height: 16px;
      padding: 0 8px;

      .mockup-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
      }

      .mockup-line {
        width: 40px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.3);
      }
    }

    .mockup-body {
      display: flex;
      flex: 1 1 auto;

      .mockup-sidebar {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 44px;
        padding: 6px 4px;

        .mockup-item {
          height: 6px;
          border-radius: 2px;
          background: rgba(148, 163, 184, 0.3);

          &.is-active {
            opacity: 0.9;
          }
        }
      }

      .mockup-content {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1 1 auto;
        padding: 6px;

        .mockup-card {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          border: 1px solid rgba(148, 163, 184, 0.2);

          .mockup-accent-pill {
            width: 32px;
            height: 8px;
            border-radius: 3px;
          }
        }
      }
    }
  }

  // Swatches
  .theme-swatches {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    color: var(--color-text-secondary);

    .swatches-dots {
      display: flex;
      gap: 5px;

      .color-dot {
        width: 13px;
        height: 13px;
        border-radius: 50%;
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
    }
  }

  .theme-check-icon {
    position: absolute;
    top: 8px;
    right: 8px;

    .check-active {
      font-size: 16px;
      color: var(--color-primary);
    }
  }
}

// Accent Picker
.accent-picker-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.swatch-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.accent-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  color: #ffffff;
  font-size: 12px;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.12);
  }

  &.is-selected {
    box-shadow:
      0 0 0 2px var(--page-background-color),
      0 0 0 4px var(--color-primary);
  }
}

.custom-color-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

// Preview Box
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 0;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 16px;

  .preview-label {
    min-width: 100px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .preview-items {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    &.controls-items {
      gap: 16px;
    }
  }
}

// Logos & Identity
.branding-form {
  padding-top: 8px;
}

.logos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-top: 12px;
}

.logo-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .logo-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
  }
}

// Action Bar
.appearance-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
</style>
