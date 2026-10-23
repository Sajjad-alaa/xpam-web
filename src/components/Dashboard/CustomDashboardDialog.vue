<template>
  <el-dialog
    :model-value="visible"
    :title="dashboard && dashboard.id ? 'Dashboard Settings & Sharing' : 'Create Custom Dashboard'"
    width="680px"
    destroy-on-close
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" label-width="150px" size="default">
      <el-form-item v-if="!dashboard || !dashboard.id" label="Starter Template">
        <div class="cd-template-grid">
          <div
            v-for="tpl of templateOptions"
            :key="tpl.id"
            class="cd-template-card"
            :class="{ 'is-active': form.template === tpl.id }"
            @click="selectTemplate(tpl)"
          >
            <div class="cd-template-title">
              <b>{{ tpl.name }}</b>
              <el-tag v-if="tpl.id !== 'custom'" size="small" type="primary" effect="plain">
                {{ (tpl.widgets || []).length }} widgets
              </el-tag>
            </div>
            <div class="cd-template-desc">{{ tpl.description }}</div>
          </div>
        </div>
      </el-form-item>

      <el-form-item label="Dashboard Name" required>
        <el-input
          v-model="form.name"
          maxlength="128"
          placeholder="e.g. SOC Live Wall, Production DB & JIT Posture"
        />
      </el-form-item>

      <el-form-item label="Description">
        <el-input
          v-model="form.description"
          maxlength="512"
          placeholder="Optional note shown at the top of the dashboard"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Section">
            <el-select v-model="form.scope" style="width: 100%">
              <el-option value="all" label="All Sections (Console, PAM, Audit)" />
              <el-option value="console" label="Console Only" />
              <el-option value="pam" label="PAM Only" />
              <el-option value="audit" label="Audit Only" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Default Range">
            <el-select v-model="form.days" style="width: 100%">
              <el-option :value="1" label="Last 24 Hours (1 Day)" />
              <el-option :value="7" label="Last 7 Days" />
              <el-option :value="30" label="Last 30 Days" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="Auto-Refresh">
            <el-select v-model="form.refresh_seconds" style="width: 100%">
              <el-option :value="0" label="Off (Manual)" />
              <el-option :value="15" label="Every 15 Seconds (NOC/SOC)" />
              <el-option :value="60" label="Every 1 Minute" />
              <el-option :value="300" label="Every 5 Minutes" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="Pin as Default">
            <el-switch v-model="form.is_default" />
            <span class="cd-form-hint">Open first for viewers in this org</span>
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">
        Organization Sharing ({{ orgName || 'Current Organization' }})
      </el-divider>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 14px"
        title="Strictly isolated to this organization: users in other organizations cannot view this dashboard."
      />

      <el-form-item label="Share With">
        <el-radio-group v-model="shareMode">
          <el-radio value="specific">Specific Users &amp; Groups</el-radio>
          <el-radio value="all">Everyone in Organization</el-radio>
          <el-radio value="private">Admins Only</el-radio>
        </el-radio-group>
      </el-form-item>

      <template v-if="shareMode === 'specific'">
        <el-form-item label="Shared Users">
          <el-select
            v-model="form.shared_users"
            multiple
            filterable
            clearable
            placeholder="Choose users in this organization"
            style="width: 100%"
          >
            <el-option v-for="u of orgUsers" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="Shared Groups">
          <el-select
            v-model="form.shared_groups"
            multiple
            filterable
            clearable
            placeholder="Choose user groups in this organization"
            style="width: 100%"
          >
            <el-option v-for="g of orgGroups" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
      </template>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">{{ $t('Cancel') }}</el-button>
      <el-button type="primary" :loading="saving" @click="submit">
        {{ dashboard && dashboard.id ? $t('Save') : $t('Create') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'CustomDashboardDialog',
  props: {
    visible: { type: Boolean, default: false },
    dashboard: { type: Object, default: null },
    templates: { type: Array, default: () => [] },
    defaultScope: { type: String, default: 'all' },
    orgName: { type: String, default: '' }
  },
  emits: ['update:visible', 'saved'],
  data() {
    return {
      saving: false,
      shareMode: 'specific',
      orgUsers: [],
      orgGroups: [],
      form: {
        name: '',
        description: '',
        scope: 'all',
        template: 'soc_live',
        days: 7,
        refresh_seconds: 0,
        is_default: false,
        is_shared_all: false,
        shared_users: [],
        shared_groups: [],
        layout: []
      }
    }
  },
  computed: {
    templateOptions() {
      return [
        ...(this.templates || []),
        {
          id: 'custom',
          name: 'Custom Blank Canvas',
          description: 'Start with a clean dashboard and pick widgets from the gallery.',
          days: 7,
          refresh_seconds: 0,
          widgets: [
            { widget: 'console_realtime', span: 12 },
            { widget: 'console_data_summary', span: 12 }
          ]
        }
      ]
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(val) {
        if (val) {
          this.initForm()
          this.loadShareTargets()
        }
      }
    }
  },
  methods: {
    initForm() {
      const d = this.dashboard
      if (d && d.id) {
        this.form = {
          name: d.name || '',
          description: d.description || '',
          scope: d.scope || 'all',
          template: d.template || 'custom',
          days: d.days || 7,
          refresh_seconds: d.refresh_seconds || 0,
          is_default: !!d.is_default,
          is_shared_all: !!d.is_shared_all,
          shared_users: [...(d.shared_users || [])],
          shared_groups: [...(d.shared_groups || [])],
          layout: [...(d.layout || [])]
        }
        if (d.is_shared_all) {
          this.shareMode = 'all'
        } else if (
          (d.shared_users && d.shared_users.length) ||
          (d.shared_groups && d.shared_groups.length)
        ) {
          this.shareMode = 'specific'
        } else {
          this.shareMode = 'private'
        }
      } else {
        const presetId =
          (d && d.template) || (this.templates[0] && this.templates[0].id) || 'soc_live'
        const tpl = this.templateOptions.find((t) => t.id === presetId) || this.templateOptions[0]
        this.form = {
          name: (d && d.name) || tpl?.name || '',
          description: (d && d.description) || tpl?.description || '',
          scope: this.defaultScope || 'all',
          template: tpl?.id || 'soc_live',
          days: tpl?.days || 7,
          refresh_seconds: tpl?.refresh_seconds ?? 0,
          is_default: false,
          is_shared_all: false,
          shared_users: [],
          shared_groups: [],
          layout: [...(tpl?.widgets || [])]
        }
        this.shareMode = 'specific'
      }
    },
    selectTemplate(tpl) {
      this.form.template = tpl.id
      this.form.name = tpl.name
      this.form.description = tpl.description
      this.form.days = tpl.days || 7
      this.form.refresh_seconds = tpl.refresh_seconds ?? 0
      this.form.layout = [...(tpl.widgets || [])]
    },
    async loadShareTargets() {
      try {
        const res = await this.$axios.get('/api/v1/reports/custom-dashboards/share-targets/', {
          disableFlashErrorMsg: true
        })
        this.orgUsers = res?.users || []
        this.orgGroups = res?.groups || []
      } catch (e) {
        this.orgUsers = []
        this.orgGroups = []
      }
    },
    async submit() {
      if (!this.form.name || !this.form.name.trim()) {
        this.$message.warning('Please enter a dashboard name')
        return
      }
      const payload = {
        name: this.form.name.trim(),
        description: (this.form.description || '').trim(),
        scope: this.form.scope,
        template: this.form.template,
        days: this.form.days,
        refresh_seconds: this.form.refresh_seconds,
        is_default: this.form.is_default,
        is_shared_all: this.shareMode === 'all',
        shared_users: this.shareMode === 'specific' ? this.form.shared_users : [],
        shared_groups: this.shareMode === 'specific' ? this.form.shared_groups : []
      }
      if (!this.dashboard || !this.dashboard.id) {
        payload.layout = this.form.layout
      }
      this.saving = true
      try {
        const res =
          this.dashboard && this.dashboard.id
            ? await this.$axios.patch(
                `/api/v1/reports/custom-dashboards/${this.dashboard.id}/`,
                payload
              )
            : await this.$axios.post('/api/v1/reports/custom-dashboards/', payload)
        this.$message.success(this.$t('SaveSuccessMsg') || 'Saved')
        this.$emit('update:visible', false)
        this.$emit('saved', res)
      } finally {
        this.saving = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.cd-template-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  width: 100%;
}

.cd-template-card {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  background: var(--page-background-color, #fff);

  &:hover {
    border-color: var(--el-color-primary-light-3);
  }

  &.is-active {
    border-color: var(--color-primary, var(--el-color-primary));
    background: var(--el-color-primary-light-9);
  }
}

.cd-template-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 4px;
}

.cd-template-desc {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.cd-form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
