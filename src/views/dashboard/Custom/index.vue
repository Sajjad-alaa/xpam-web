<template>
  <Page>
    <div class="cd-manage">
      <!-- Starter Templates Banner -->
      <el-card v-if="canManage" shadow="never" class="cd-card">
        <template #header>
          <div class="cd-card-header">
            <div>
              <b>Starter Templates ({{ orgName || 'Current Organization' }})</b>
              <span class="cd-sub">
                Create a multi-widget dashboard from a role template and share it with specific
                users or groups in your organization
              </span>
            </div>
            <el-button type="primary" size="small" @click="openCreate()">
              <i class="fa fa-plus" style="margin-right: 4px" />
              New Custom Dashboard
            </el-button>
          </div>
        </template>

        <div class="cd-tpl-cards">
          <div v-for="t of templates" :key="t.id" class="cd-tpl-item">
            <div class="cd-tpl-top">
              <b>{{ t.name }}</b>
              <el-tag size="small" type="primary" effect="plain">
                {{ (t.widgets || []).length }} widgets
              </el-tag>
            </div>
            <p class="cd-tpl-desc">{{ t.description }}</p>
            <div class="cd-tpl-foot">
              <span class="cd-tpl-meta">
                Default: {{ t.days }}d · Refresh:
                {{ t.refresh_seconds ? `${t.refresh_seconds}s` : 'Off' }}
              </span>
              <el-button size="small" type="primary" plain @click="openCreate(t.id)">
                Use Template
              </el-button>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Organization Dashboards Table -->
      <el-card shadow="never" class="cd-card">
        <template #header>
          <div class="cd-card-header">
            <div>
              <b>Dashboards ({{ dashboards.length }})</b>
              <span class="cd-sub">
                Each organization only sees its own dashboards; shared users and groups see the
                dashboards shared with them
              </span>
            </div>
            <el-button size="small" @click="load">
              <i class="fa fa-refresh" />
            </el-button>
          </div>
        </template>

        <el-table v-loading="loading" :data="dashboards" size="small" style="width: 100%">
          <el-table-column label="Name" min-width="200">
            <template #default="{ row }">
              <el-link type="primary" @click="previewId = row.id">
                <b>{{ row.name }}</b>
              </el-link>
              <div v-if="row.description" class="cd-row-desc">{{ row.description }}</div>
            </template>
          </el-table-column>

          <el-table-column label="Organization" prop="org_name" width="150" />

          <el-table-column label="Section" width="110">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ (row.scope || 'all').toUpperCase() }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Widgets" width="90" align="center">
            <template #default="{ row }">
              {{ (row.layout || []).length }}
            </template>
          </el-table-column>

          <el-table-column label="Range / Refresh" width="140">
            <template #default="{ row }">
              {{ row.days }}d · {{ row.refresh_seconds ? `${row.refresh_seconds}s` : 'Manual' }}
            </template>
          </el-table-column>

          <el-table-column label="Shared With (Org Scoped)" min-width="240">
            <template #default="{ row }">
              <el-tag v-if="row.is_shared_all" size="small" type="success">
                All Organization Members
              </el-tag>
              <template
                v-else-if="
                  (row.shared_users_info && row.shared_users_info.length) ||
                  (row.shared_groups_info && row.shared_groups_info.length)
                "
              >
                <el-tag
                  v-for="g of row.shared_groups_info || []"
                  :key="'g-' + g.id"
                  size="small"
                  type="warning"
                  class="cd-share-tag"
                >
                  Group: {{ g.name }}
                </el-tag>
                <el-tag
                  v-for="u of row.shared_users_info || []"
                  :key="'u-' + u.id"
                  size="small"
                  type="info"
                  class="cd-share-tag"
                >
                  {{ u.name }}
                </el-tag>
              </template>
              <span v-else class="cd-muted">Admins Only</span>
            </template>
          </el-table-column>

          <el-table-column label="Default" width="90" align="center">
            <template #default="{ row }">
              <el-switch
                :model-value="row.is_default"
                :disabled="!row.can_edit"
                size="small"
                @change="toggleDefault(row, $event)"
              />
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="230" align="right">
            <template #default="{ row }">
              <el-button size="small" @click="previewId = row.id">Open</el-button>
              <el-button
                v-if="row.can_edit"
                size="small"
                type="primary"
                plain
                @click="openEdit(row)"
              >
                Share
              </el-button>
              <el-button v-if="row.can_edit" size="small" @click="cloneRow(row)">Clone</el-button>
              <el-button
                v-if="row.can_edit"
                size="small"
                type="danger"
                plain
                @click="deleteRow(row)"
              >
                Delete
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- Live Dashboard Canvas & Layout Customizer -->
      <MultiDashboardHost
        ref="hostRef"
        :standalone="true"
        section-scope="all"
        :initial-dashboard-id="previewId"
      />

      <CustomDashboardDialog
        v-model:visible="dialogVisible"
        :dashboard="editingRow"
        :templates="templates"
        default-scope="all"
        :org-name="orgName"
        @saved="onSaved"
      />
    </div>
  </Page>
</template>

<script>
import { Page } from '@/layout/components'
import { ElMessageBox } from 'element-plus'
import MultiDashboardHost from '@/components/Dashboard/MultiDashboardHost.vue'
import CustomDashboardDialog from '@/components/Dashboard/CustomDashboardDialog.vue'

export default {
  name: 'CustomDashboardManage',
  components: {
    Page,
    MultiDashboardHost,
    CustomDashboardDialog
  },
  data() {
    return {
      loading: false,
      canManage: false,
      orgName: '',
      templates: [],
      dashboards: [],
      previewId: '',
      dialogVisible: false,
      editingRow: null
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      try {
        const [catalogRes, listRes] = await Promise.all([
          this.$axios.get('/api/v1/reports/custom-dashboards/catalog/', {
            disableFlashErrorMsg: true
          }),
          this.$axios.get('/api/v1/reports/custom-dashboards/', {
            disableFlashErrorMsg: true
          })
        ])
        this.canManage = !!catalogRes?.can_manage
        this.orgName = catalogRes?.org_name || ''
        this.templates = catalogRes?.templates || []
        this.dashboards = Array.isArray(listRes) ? listRes : listRes?.results || []
        if (!this.previewId && this.dashboards.length) {
          this.previewId = this.dashboards[0].id
        }
      } finally {
        this.loading = false
      }
    },
    openCreate(templateId = '') {
      this.editingRow = templateId ? { template: templateId } : null
      this.dialogVisible = true
    },
    openEdit(row) {
      this.editingRow = row
      this.dialogVisible = true
    },
    async toggleDefault(row, val) {
      await this.$axios.patch(`/api/v1/reports/custom-dashboards/${row.id}/`, {
        is_default: val
      })
      await this.load()
      if (this.$refs.hostRef) this.$refs.hostRef.loadAll(row.id)
    },
    async cloneRow(row) {
      const cloned = await this.$axios.post(
        `/api/v1/reports/custom-dashboards/${row.id}/clone/`,
        {}
      )
      this.$message.success(`Cloned "${cloned.name}"`)
      this.previewId = cloned.id
      await this.load()
      if (this.$refs.hostRef) this.$refs.hostRef.loadAll(cloned.id)
    },
    deleteRow(row) {
      ElMessageBox.confirm(`Delete dashboard "${row.name}"?`, this.$t('Delete') || 'Delete', {
        type: 'warning'
      })
        .then(async () => {
          await this.$axios.delete(`/api/v1/reports/custom-dashboards/${row.id}/`)
          this.$message.success(this.$t('DeleteSuccessMsg') || 'Deleted')
          if (this.previewId === row.id) this.previewId = ''
          await this.load()
          if (this.$refs.hostRef) this.$refs.hostRef.loadAll()
        })
        .catch(() => {})
    },
    async onSaved(saved) {
      if (saved?.id) this.previewId = saved.id
      await this.load()
      if (this.$refs.hostRef) this.$refs.hostRef.loadAll(saved?.id || '')
    }
  }
}
</script>

<style lang="scss" scoped>
.cd-card {
  margin-bottom: 14px;
}

.cd-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.cd-sub {
  margin-left: 10px;
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.cd-tpl-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.cd-tpl-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--page-background-color, #fff);
}

.cd-tpl-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.cd-tpl-desc {
  margin: 8px 0 10px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.cd-tpl-foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cd-tpl-meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.cd-row-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cd-share-tag {
  margin: 0 4px 4px 0;
}

.cd-muted {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
