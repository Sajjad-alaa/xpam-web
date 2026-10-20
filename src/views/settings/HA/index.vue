<template>
  <Page>
    <div v-loading="loading && !data" class="ha">
      <el-alert v-if="data && !data.enabled" type="info" :closable="false" show-icon>
        <template #title>{{ $t('HANotEnabled') }}</template>
        <p class="ha-help">{{ $t('HANotEnabledHelp') }}</p>
        <pre class="ha-cmd">
xpamctl ha init &lt;this-server-ip&gt; &lt;second-server-ip&gt; &lt;witness-ip&gt;</pre>
      </el-alert>

      <template v-if="data && data.enabled">
        <el-alert v-if="data.error" type="error" :closable="false" show-icon :title="data.error" />
        <el-alert
          v-else-if="!hasSyncStandby"
          type="warning"
          :closable="false"
          show-icon
          :title="$t('HANoSyncStandby')"
        />
        <el-alert v-else type="success" :closable="false" show-icon :title="$t('HAHealthy')" />

        <div class="ha-members">
          <el-card v-for="m of data.members" :key="m.name" shadow="never" class="ha-member">
            <div class="ha-member-head">
              <b>{{ m.name }}</b>
              <el-tag v-if="m.name === data.this_node" size="small" type="info">{{
                $t('HAThisServer')
              }}</el-tag>
            </div>
            <div class="ha-row">
              <span>{{ $t('Address') }}</span
              ><span>{{ m.host }}</span>
            </div>
            <div class="ha-row">
              <span>{{ $t('HARole') }}</span>
              <el-tag :type="roleType(m.role)" size="small">{{ roleText(m.role) }}</el-tag>
            </div>
            <div class="ha-row">
              <span>{{ $t('Status') }}</span
              ><span>{{ m.state }}</span>
            </div>
            <div v-if="m.role !== 'leader'" class="ha-row">
              <span>{{ $t('HALag') }}</span
              ><span>{{ lagText(m.lag) }}</span>
            </div>
          </el-card>
        </div>

        <el-card v-if="agent" shadow="never" class="ha-agent">
          <div class="ha-row">
            <span>{{ $t('HAServices') }}</span>
            <span>{{ agent.app_running ? $t('HARunning') : $t('HAStopped') }}</span>
          </div>
          <div class="ha-row">
            <span>{{ $t('HAOtherServer') }}</span>
            <el-tag :type="agent.peer_reachable ? 'success' : 'danger'" size="small">
              {{ agent.peer_reachable ? $t('HAReachable') : $t('HANotReachable') }}
            </el-tag>
          </div>
          <div class="ha-row">
            <span>{{ $t('HAWitness') }} ({{ agent.witness_ip }})</span>
            <el-tag :type="agent.witness_reachable ? 'success' : 'danger'" size="small">
              {{ agent.witness_reachable ? $t('HAReachable') : $t('HANotReachable') }}
            </el-tag>
          </div>
          <div v-if="agent.file_sync && agent.file_sync.time" class="ha-row">
            <span>{{ $t('HAFileCopy') }}</span>
            <el-tag :type="agent.file_sync.ok ? 'success' : 'danger'" size="small">
              {{ agent.file_sync.ok ? $t('HAOk') : $t('HAFailed') }} ·
              {{ $t('HASecondsAgo', { n: now - agent.file_sync.time }) }}
            </el-tag>
          </div>
          <div v-if="agent.age > 30" class="ha-stale">
            {{ $t('HAAgentStale', { n: agent.age }) }}
          </div>
        </el-card>

        <div class="ha-actions">
          <el-button
            type="primary"
            :disabled="!hasSyncStandby || !$store.getters.currentUserIsSuperAdmin"
            :loading="switching"
            @click="switchover"
          >
            {{ $t('HASwitchover') }}
          </el-button>
          <span class="ha-help">{{ $t('HASwitchoverHelp') }}</span>
        </div>
      </template>
    </div>
  </Page>
</template>

<script>
import Page from '@/layout/components/Page'

export default {
  name: 'HighAvailability',
  components: { Page },
  data() {
    return { data: null, loading: false, switching: false, now: Math.floor(Date.now() / 1000) }
  },
  computed: {
    agent() {
      return this.data?.agent
    },
    hasSyncStandby() {
      return (this.data?.members || []).some(
        (m) => m.role === 'sync_standby' && m.state === 'streaming'
      )
    }
  },
  mounted() {
    this.load()
    this.timer = setInterval(() => this.load(), 10000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    load() {
      this.loading = true
      this.$axios
        .get('/api/v1/settings/ha/status/')
        .then((data) => {
          this.data = data
          this.now = Math.floor(Date.now() / 1000)
        })
        .finally(() => {
          this.loading = false
        })
    },
    roleText(role) {
      return (
        {
          leader: this.$t('HAPrimary'),
          sync_standby: this.$t('HASyncStandby'),
          replica: this.$t('HAStandby')
        }[role] || role
      )
    },
    roleType(role) {
      return { leader: 'success', sync_standby: 'primary' }[role] || 'warning'
    },
    lagText(lag) {
      if (lag === undefined || lag === null || lag === '') return '-'
      if (typeof lag !== 'number') return String(lag)
      return lag === 0 ? this.$t('HAInSync') : `${Math.round(lag / 1024)} KB`
    },
    switchover() {
      this.$confirm(this.$t('HASwitchoverConfirm'), this.$t('HASwitchover'), { type: 'warning' })
        .then(() => {
          this.switching = true
          return this.$axios.post('/api/v1/settings/ha/switchover/', {}).then((res) => {
            this.$message.success(res.detail)
            this.load()
          })
        })
        .catch(() => {})
        .finally(() => {
          this.switching = false
        })
    }
  }
}
</script>

<style scoped>
.ha {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ha-members {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

.ha-member-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.ha-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.ha-help {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.ha-cmd {
  margin: 6px 0 0;
  padding: 6px 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
}

.ha-stale {
  margin-top: 6px;
  color: var(--el-color-danger);
  font-size: 12px;
}

.ha-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
