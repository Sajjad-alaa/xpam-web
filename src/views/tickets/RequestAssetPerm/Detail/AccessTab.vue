<template>
  <div v-loading="loading && !data" class="access">
    <el-alert
      v-if="data && !data.state"
      type="info"
      :closable="false"
      show-icon
      :title="$t('TicketAccessNone')"
    />
    <template v-if="data && data.state">
      <el-card shadow="never">
        <div class="access-head">
          <el-tag :type="stateType" effect="dark">{{ stateText }}</el-tag>
          <span v-if="data.state === 'active'" class="access-left">
            {{ $t('TicketAccessTimeLeft', { time: leftText }) }}
          </span>
          <div class="access-actions">
            <el-button v-if="data.can.extend" size="small" @click="extend">
              {{ $t('TicketAccessExtend') }}
            </el-button>
            <el-button v-if="data.can.end" size="small" type="warning" @click="endNow">
              {{ $t('TicketAccessEndNow') }}
            </el-button>
            <el-button v-if="data.can.revoke" size="small" type="danger" @click="revoke">
              {{ $t('TicketAccessRevoke') }}
            </el-button>
          </div>
        </div>
        <div class="access-row">
          <span>{{ $t('DateStart') }}</span
          ><span>{{ dateText(data.date_start) }}</span>
        </div>
        <div class="access-row">
          <span>{{ $t('DateExpired') }}</span>
          <span>
            {{ dateText(data.date_expired) }}
            <template v-if="data.state === 'ended'">
              ({{ $t('TicketAccessPlanned', { date: dateText(data.planned_end) }) }})
            </template>
          </span>
        </div>
        <div class="access-row">
          <span>{{ $tc('Asset') }}</span>
          <span>{{ data.assets.map((a) => `${a.name} (${a.address})`).join(', ') || '-' }}</span>
        </div>
        <div class="access-row">
          <span>{{ $t('Protocols') }}</span>
          <span>{{
            data.protocols.includes('all') ? $t('AllProtocols') : data.protocols.join(', ')
          }}</span>
        </div>
        <div class="access-row">
          <span>{{ $tc('Action') }}</span
          ><span>{{ data.actions.join(', ') || '-' }}</span>
        </div>
      </el-card>

      <el-card shadow="never">
        <template #header>{{ $t('TicketAccessAccounts') }}</template>
        <el-table :data="data.accounts" size="small" :empty-text="$t('NoData')">
          <el-table-column prop="username" :label="$t('Username')" />
          <el-table-column prop="asset" :label="$tc('Asset')" />
          <el-table-column prop="status" :label="$t('Status')" width="120" />
          <el-table-column :label="$t('DateExpired')" width="180">
            <template #default="{ row }">{{ dateText(row.date_expired) }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>{{ $t('TicketAccessSessions') }}</template>
        <el-table :data="data.sessions" size="small" :empty-text="$t('NoData')">
          <el-table-column :label="$t('DateStart')" width="180">
            <template #default="{ row }">
              <router-link
                v-if="$hasPerm('terminal.view_session')"
                :to="{ name: 'SessionDetail', params: { id: row.id } }"
                >{{ dateText(row.date_start) }}</router-link
              >
              <span v-else>{{ dateText(row.date_start) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="asset" :label="$tc('Asset')" />
          <el-table-column prop="account" :label="$tc('Account')" />
          <el-table-column prop="protocol" :label="$t('Protocols')" width="100" />
          <el-table-column prop="remote_addr" :label="$t('RemoteAddr')" width="140" />
          <el-table-column :label="$t('Status')" width="110">
            <template #default="{ row }">
              <el-tag :type="row.is_finished ? 'info' : 'success'" size="small">
                {{ row.is_finished ? $t('Finished') : $t('TicketAccessOnline') }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>
  </div>
</template>

<script>
// XPAM: the access an approved request gave — its state and time left, what it allows, its just-in-time accounts
// and sessions; the requester can end or extend it, an approver or administrator can revoke it
import { toSafeLocalDateStr } from '@/composables/useDateTime'

export default {
  name: 'AccessTab',
  props: {
    object: { type: Object, default: () => ({}) }
  },
  data() {
    return { data: null, loading: false, now: Date.now() }
  },
  computed: {
    url() {
      return `/api/v1/tickets/apply-asset-tickets/${this.$route.params.id}/access/`
    },
    stateText() {
      return (
        {
          active: this.$t('TicketAccessActive'),
          scheduled: this.$t('TicketAccessScheduled'),
          ended: this.$t('TicketAccessEnded'),
          expired: this.$t('TicketAccessExpired')
        }[this.data?.state] || '-'
      )
    },
    stateType() {
      return (
        { active: 'success', scheduled: 'primary', ended: 'warning', expired: 'info' }[
          this.data?.state
        ] || 'info'
      )
    },
    leftText() {
      const end = new Date(this.data?.date_expired).getTime()
      const s = Math.max(0, Math.floor((end - this.now) / 1000))
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      return h ? `${h} h ${m} min` : `${m} min`
    }
  },
  mounted() {
    this.load()
    this.timer = setInterval(() => {
      this.now = Date.now()
      if (this.data?.state === 'active' && new Date(this.data.date_expired).getTime() <= this.now) {
        this.load()
      }
    }, 30000)
  },
  beforeUnmount() {
    clearInterval(this.timer)
  },
  methods: {
    load() {
      this.loading = true
      this.$axios
        .get(this.url)
        .then((data) => {
          this.data = data
          this.now = Date.now()
        })
        .catch(() => {})
        .finally(() => {
          this.loading = false
        })
    },
    dateText(value) {
      return value ? toSafeLocalDateStr(value) : '-'
    },
    extend() {
      // (an extension is a new request, made where the requester asks for access)
      window.open('/workspace/access', '_blank')
    },
    endNow() {
      this.$confirm(this.$t('TicketAccessEndConfirm'), this.$t('TicketAccessEndNow'), {
        type: 'warning'
      })
        .then(() => this.$axios.post(`${this.url}end/`, {}))
        .then(() => {
          this.$message.success(this.$t('TicketAccessEndedNow'))
          this.load()
        })
        .catch(() => {})
    },
    revoke() {
      this.$prompt(this.$t('TicketAccessRevokeConfirm'), this.$t('TicketAccessRevoke'), {
        type: 'warning',
        inputPlaceholder: this.$t('TicketAccessRevokeReason'),
        confirmButtonText: this.$t('TicketAccessRevoke')
      })
        .then(({ value }) => this.$axios.post(`${this.url}revoke/`, { reason: value || '' }))
        .then((res) => {
          this.$message.success(this.$t('TicketAccessRevoked', { n: res.sessions_ended || 0 }))
          this.load()
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped>
.access {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.access-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.access-left {
  color: var(--el-text-color-secondary);
}

.access-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.access-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 6px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.access-row span:first-child {
  color: var(--el-text-color-secondary);
}
</style>
