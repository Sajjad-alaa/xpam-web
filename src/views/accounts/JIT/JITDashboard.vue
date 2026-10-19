<template>
  <div v-loading="loading" class="zsp">
    <div class="zsp-head">
      <el-alert type="info" :closable="false" show-icon class="zsp-intro">
        {{ $t('ZSPIntro') }}
      </el-alert>
      <el-button :icon="Refresh" @click="load(true)">{{ $t('Refresh') }}</el-button>
    </div>

    <div v-if="data" class="zsp-cards">
      <el-card shadow="never" class="zsp-card zsp-score">
        <div class="zsp-ring">
          <svg viewBox="0 0 120 120" width="128" height="128">
            <circle cx="60" cy="60" r="50" class="zsp-ring-track" />
            <circle
              v-if="data.zsp.score > 0"
              cx="60"
              cy="60"
              r="50"
              class="zsp-ring-value"
              :stroke="scoreColor"
              :stroke-dasharray="`${(data.zsp.score / 100) * 314.16} 314.16`"
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div class="zsp-ring-text">
            <div class="zsp-score-value">{{ data.zsp.score }}%</div>
            <div class="zsp-score-label">{{ $t('ZSPScore') }}</div>
          </div>
        </div>
        <div class="zsp-score-help">
          {{
            $t('ZSPScoreHelp', {
              jit: data.zsp.jit_only_assets,
              total: data.zsp.assets_with_access
            })
          }}
        </div>
      </el-card>
      <el-card v-for="m of metrics" :key="m.label" shadow="never" class="zsp-card">
        <div class="zsp-metric">{{ m.value }}</div>
        <div class="zsp-metric-label">{{ m.label }}</div>
        <div v-if="m.sub" class="zsp-metric-sub">{{ m.sub }}</div>
      </el-card>
    </div>

    <div v-if="data" class="zsp-grid">
      <el-card shadow="never">
        <template #header>{{ $t('ZSPLast14Days') }}</template>
        <div class="zsp-bars">
          <div v-for="d of data.days" :key="d.date" class="zsp-bar" :title="barTitle(d)">
            <div class="zsp-bar-stack">
              <div class="zsp-bar-failed" :style="{ height: barHeight(d.failed) }" />
              <div class="zsp-bar-ok" :style="{ height: barHeight(d.created) }" />
            </div>
            <div class="zsp-bar-label">{{ d.date.slice(5) }}</div>
          </div>
        </div>
      </el-card>
      <el-card shadow="never">
        <template #header>{{ $t('ZSPTopUsers') }}</template>
        <div v-for="u of data.top_users" :key="u.name" class="zsp-top">
          <span>{{ u.name }}</span
          ><b>{{ u.count }}</b>
        </div>
        <el-empty v-if="!data.top_users.length" :image-size="48" :description="$t('NoData')" />
      </el-card>
      <el-card shadow="never">
        <template #header>{{ $t('ZSPTopAssets') }}</template>
        <div v-for="a of data.top_assets" :key="a.name" class="zsp-top">
          <span>{{ a.name }}</span
          ><b>{{ a.count }}</b>
        </div>
        <el-empty v-if="!data.top_assets.length" :image-size="48" :description="$t('NoData')" />
      </el-card>
    </div>

    <el-card v-if="data" shadow="never" class="zsp-standing">
      <template #header>
        <div class="zsp-standing-head">
          <span>{{ $t('ZSPStandingTitle') }}</span>
          <span class="zsp-standing-sub">{{ $t('ZSPStandingHelp') }}</span>
        </div>
      </template>
      <el-table :data="data.zsp.standing_permissions" size="small" style="width: 100%">
        <el-table-column :label="$t('AssetPermission')" min-width="220">
          <template #default="{ row }">
            <router-link :to="{ name: 'AssetPermissionDetail', params: { id: row.id } }">
              {{ row.name }}
            </router-link>
          </template>
        </el-table-column>
        <el-table-column :label="$t('ZSPStandingAccounts')" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="a of row.accounts" :key="a" size="small" type="warning" class="zsp-tag">
              {{ accountLabel(a) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('Users')" prop="users" width="90" />
        <el-table-column :label="$t('Assets')" prop="assets" width="90" />
        <el-table-column :label="$t('DateExpired')" min-width="150">
          <template #default="{ row }">{{ formatTime(row.date_expired) }}</template>
        </el-table-column>
        <el-table-column :label="$t('Actions')" width="170" align="center">
          <template #default="{ row }">
            <el-button
              v-if="$hasPerm('perms.change_assetpermission')"
              size="small"
              type="primary"
              @click="convert(row)"
            >
              {{ $t('ZSPConvert') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty
        v-if="!data.zsp.standing_permissions.length"
        :image-size="60"
        :description="$t('ZSPNoStanding')"
      />
    </el-card>
  </div>
</template>

<script>
import { Refresh } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { AccountLabelMapper } from '@/views/perms/const'

export default {
  name: 'JITDashboard',
  data() {
    return { Refresh, loading: false, data: null }
  },
  computed: {
    scoreColor() {
      const s = this.data?.zsp?.score || 0
      if (s >= 80) return 'var(--el-color-success)'
      if (s >= 50) return 'var(--el-color-warning)'
      return 'var(--el-color-danger)'
    },
    metrics() {
      const d = this.data
      if (!d) return []
      const wait = d.median_wait_seconds
      return [
        { label: this.$t('ZSPLiveAccounts'), value: d.live },
        {
          label: this.$t('ZSPCreated'),
          value: d.created_today,
          sub: this.$t('ZSPThisWeek', { n: d.created_week })
        },
        { label: this.$t('ZSPFailedWeek'), value: d.failed_week },
        { label: this.$t('ZSPPending'), value: d.requests_pending },
        {
          label: this.$t('ZSPAutoApproved'),
          value: `${d.requests_auto_week}/${d.requests_week}`,
          sub: this.$t('ZSPLast7Days')
        },
        {
          label: this.$t('ZSPMedianWait'),
          value: wait === null || wait === undefined ? '-' : this.duration(wait),
          sub: this.$t('ZSPLast7Days')
        },
        {
          label: this.$t('ZSPPolicies'),
          value: d.policies,
          sub: this.$t('ZSPPoliciesSub', { auto: d.policies_auto, only: d.policies_jit_only })
        }
      ]
    },
    maxBar() {
      return Math.max(1, ...(this.data?.days || []).map((d) => d.created + d.failed))
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    load(refresh = false) {
      this.loading = true
      this.$axios
        .get(`/api/v1/accounts/jit-dashboard/${refresh ? '?refresh=1' : ''}`)
        .then((res) => {
          this.data = res
        })
        .finally(() => {
          this.loading = false
        })
    },
    duration(seconds) {
      if (seconds < 60) return `${seconds}s`
      if (seconds < 3600) return `${Math.round(seconds / 60)}m`
      return `${(seconds / 3600).toFixed(1)}h`
    },
    barHeight(n) {
      return `${Math.round((n / this.maxBar) * 100)}%`
    },
    barTitle(d) {
      return `${d.date}: ${d.created} ${this.$t('ZSPCreatedShort')}, ${d.failed} ${this.$t('ZSPFailedShort')}`
    },
    accountLabel(a) {
      return AccountLabelMapper[a] || a
    },
    formatTime(value) {
      return value ? new Date(value).toLocaleString() : '-'
    },
    convert(row, force = false) {
      const message = force
        ? this.$t('ZSPConvertNoPolicy', { name: row.name })
        : this.$t('ZSPConvertConfirm', { name: row.name, accounts: row.accounts.join(', ') })
      ElMessageBox.confirm(message, this.$t('ZSPConvert'), { type: 'warning' })
        .then(() =>
          this.$axios.post(
            '/api/v1/accounts/jit-dashboard/convert/',
            { permission: row.id, force },
            { disableFlashErrorMsg: true }
          )
        )
        .then((res) => {
          if (!res) return
          this.$message.success(
            this.$t('ZSPConverted', { policy: res.policy || this.$t('JITNoAccount') })
          )
          this.load(true)
        })
        .catch((err) => {
          const data = err?.response?.data
          if (data?.code === 'no_policy') {
            this.convert(row, true)
          } else if (data?.detail) {
            this.$message.error(data.detail)
          }
        })
    }
  }
}
</script>

<style scoped>
.zsp-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.zsp-intro {
  flex: 1;
}

.zsp-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.zsp-card {
  text-align: center;
}

.zsp-score {
  grid-row: span 2;
}

.zsp-ring {
  position: relative;
  display: inline-block;
  width: 128px;
  height: 128px;
}

.zsp-ring-track,
.zsp-ring-value {
  fill: none;
  stroke-width: 10;
}

.zsp-ring-track {
  stroke: var(--el-border-color-lighter);
}

.zsp-ring-value {
  stroke-linecap: round;
}

.zsp-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.zsp-score-value {
  font-size: 26px;
  font-weight: 600;
}

.zsp-score-label,
.zsp-metric-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.zsp-score-help,
.zsp-metric-sub {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.zsp-metric {
  font-size: 26px;
  font-weight: 600;
  line-height: 36px;
}

.zsp-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

@media (max-width: 1100px) {
  .zsp-grid {
    grid-template-columns: 1fr;
  }
}

.zsp-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 140px;
}

.zsp-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.zsp-bar-stack {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column-reverse;
}

.zsp-bar-ok {
  background: var(--el-color-primary);
  border-radius: 2px 2px 0 0;
}

.zsp-bar-failed {
  background: var(--el-color-danger);
}

.zsp-bar-label {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 10px;
}

.zsp-top {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.zsp-standing-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.zsp-standing-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: normal;
}

.zsp-tag {
  margin: 0 4px 4px 0;
}
</style>
