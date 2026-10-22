<template>
  <Page>
    <div v-loading="loading && !data" class="ha">
      <ProtectionStatus :link="false" :show-ha="false" />
      <el-alert v-if="data && !data.enabled" type="info" :closable="false" show-icon>
        <template #title>{{ $t('HANotEnabled') }}</template>
        <p class="ha-help">{{ $t('HANotEnabledHelp') }}</p>
        <pre class="ha-cmd">
xpamctl ha init
xpamctl ha init --topology active-passive --servers &lt;this-ip&gt;,&lt;ip-2&gt; --witness &lt;witness-ip&gt; --vault-bundle &lt;xpam-vault-IP-2.enc&gt;
xpamctl ha init --topology active-active --servers &lt;this-ip&gt;,&lt;ip-2&gt;,&lt;ip-3&gt; --vault-bundle &lt;xpam-vault-IP-2.enc&gt;,&lt;xpam-vault-IP-3.enc&gt;</pre>
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
            <div v-if="m.version" class="ha-row">
              <span>{{ $t('Version') }}</span
              ><span>{{ m.version }}</span>
            </div>
            <div v-if="m.server_id" class="ha-row">
              <span>{{ $t('LicenseServerId') }}</span
              ><code>{{ m.server_id }}</code>
            </div>
          </el-card>
        </div>

        <el-card v-if="agent" shadow="never" class="ha-agent">
          <div class="ha-row">
            <span>{{ $t('HATopology') }}</span>
            <el-tag size="small" type="primary">{{ topologyText }}</el-tag>
          </div>
          <div class="ha-row">
            <span>{{ $t('HAServices') }}</span>
            <span>{{ agent.app_running ? $t('HARunning') : $t('HAStopped') }}</span>
          </div>
          <div v-for="(ok, ip) in peers" :key="ip" class="ha-row">
            <span>{{ $t('HAOtherServer') }} ({{ ip }})</span>
            <el-tag :type="ok ? 'success' : 'danger'" size="small">
              {{ ok ? $t('HAReachable') : $t('HANotReachable') }}
            </el-tag>
          </div>
          <div v-if="agent.witness_ip" class="ha-row">
            <span>{{ $t('HAWitness') }} ({{ agent.witness_ip }})</span>
            <el-tag :type="agent.witness_reachable ? 'success' : 'danger'" size="small">
              {{ agent.witness_reachable ? $t('HAReachable') : $t('HANotReachable') }}
            </el-tag>
          </div>
          <div
            v-for="node in (agent.vault && agent.vault.nodes) || []"
            :key="node.addr"
            class="ha-row"
          >
            <span>Vault ({{ node.addr.replace('https://', '') }})</span>
            <el-tag :type="node.state === 'ok' ? 'success' : 'danger'" size="small">
              {{ node.state === 'ok' ? $t('HAReachable') : node.state }}
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

        <el-alert v-if="data.cluster_id" type="info" :closable="false" show-icon>
          <template #title>
            {{ $t('LicenseClusterId') }}: <code>{{ data.cluster_id }}</code>
          </template>
          <p class="ha-help">{{ $t('LicenseClusterHelp') }}</p>
        </el-alert>

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
import ProtectionStatus from './ProtectionStatus.vue'

export default {
  name: 'HighAvailability',
  components: { Page, ProtectionStatus },
  data() {
    return { data: null, loading: false, switching: false, now: Math.floor(Date.now() / 1000) }
  },
  computed: {
    agent() {
      return this.data?.agent
    },
    peers() {
      // every other server: {ip: reachable} (two-server agents of earlier versions: one flag)
      const a = this.agent || {}
      if (a.peers && Object.keys(a.peers).length) return a.peers
      return a.peer_ip ? { [a.peer_ip]: a.peer_reachable } : {}
    },
    topologyText() {
      const t = this.agent?.topology || 'active-passive'
      return t === 'active-active' ? this.$t('HAActiveActive') : this.$t('HAActivePassive')
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
      if (document.hidden && this.data) return // (not while the browser tab is in the background)
      this.loading = true
      this.$axios
        .get('/api/v1/settings/ha/status/')
        .then((data) => {
          this.data = data
          this.now = Math.floor(Date.now() / 1000)
          if (!data.enabled) {
            clearInterval(this.timer) // (nothing changes until 'xpamctl ha init' on the server)
            this.timer = null
          }
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
