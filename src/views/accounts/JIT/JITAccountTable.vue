<template>
  <div>
    <GenericListTable ref="listTable" :header-actions="headerActions" :table-config="tableConfig" />
    <el-dialog v-model="trail.visible" :title="trail.title" width="720px" append-to-body>
      <div v-loading="trail.loading" class="jit-trail">
        <el-timeline v-if="trail.events.length">
          <el-timeline-item
            v-for="(e, i) of trail.events"
            :key="i"
            :timestamp="formatTime(e.time)"
            :type="trailTypes[e.kind] || 'info'"
            placement="top"
          >
            <div>{{ e.text }}</div>
            <div v-if="e.reason" class="jit-trail-extra">{{ $t('JITReason') }}: {{ e.reason }}</div>
            <div v-if="e.kind === 'session'" class="jit-trail-extra">
              {{ e.date_end ? formatTime(e.date_end) : $t('JITSessionLive') }}
              <span v-if="e.commands !== null && e.commands !== undefined">
                · {{ $t('JITCommands', { n: e.commands }) }}
              </span>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else-if="!trail.loading" :description="$t('NoData')" />
      </div>
    </el-dialog>
  </div>
</template>

<script lang="jsx">
import { ElMessageBox } from 'element-plus'
import { ActionsFormatter } from '@/components/Table/TableFormatters'
import { GenericListTable } from '@/layout/components'

export default {
  name: 'JITAccountTable',
  components: {
    GenericListTable
  },
  props: {
    state: {
      type: String,
      default: 'live'
    }
  },
  data() {
    const vm = this
    const live = this.state === 'live'
    const kindLabels = {
      host: 'JITTargetHost',
      database: 'JITTargetDatabase',
      device: 'JITTargetDevice'
    }
    const statusTypes = {
      ready: 'success',
      pushing: 'warning',
      pending: 'info',
      removing: 'warning',
      removed: 'info',
      failed: 'danger',
      remove_failed: 'danger'
    }
    return {
      tableConfig: {
        url: `/api/v1/accounts/jit-accounts/?state=${this.state}`,
        permissions: { app: 'accounts', resource: 'jitaccount' },
        columns: [
          'username',
          'user',
          'asset',
          'kind',
          'policy',
          'mode',
          'privileged',
          'status',
          'date_ready',
          live ? 'date_expired' : 'date_removed',
          'error',
          'actions'
        ],
        columnsShow: {
          min: ['username', 'actions'],
          default: [
            'username',
            'user',
            'asset',
            'mode',
            'status',
            'date_ready',
            live ? 'date_expired' : 'date_removed',
            ...(live ? ['actions'] : ['error'])
          ]
        },
        columnsMeta: {
          user: { formatter: (row) => <span>{row.user?.name}</span> },
          asset: { formatter: (row) => <span>{row.asset?.name}</span> },
          kind: {
            label: vm.$t('JITTarget'),
            width: '120px',
            formatter: (row) => <span>{vm.$t(kindLabels[row.kind] || 'JITTargetHost')}</span>
          },
          policy: { formatter: (row) => <span>{row.policy?.name || '-'}</span> },
          mode: { formatter: (row) => <span>{row.mode?.label}</span> },
          privileged: { width: '120px', formatterArgs: { showText: false, showFalse: false } },
          status: {
            width: '140px',
            formatter: (row) => (
              <el-tag size="small" type={statusTypes[row.status?.value] || 'info'}>
                {row.status?.label}
              </el-tag>
            )
          },
          date_expired: {
            formatter: (row) => (
              <span>
                {row.date_expired
                  ? new Date(row.date_expired).toLocaleString()
                  : vm.$t('JITAfterSession')}
              </span>
            )
          },
          error: { showOverflowTooltip: true },
          actions: {
            formatter: ActionsFormatter,
            formatterArgs: {
              hasUpdate: false,
              hasDelete: false,
              hasClone: false,
              extraActions: [
                {
                  name: 'Trail',
                  title: vm.$t('JITTrail'),
                  type: 'primary',
                  can: () => true,
                  callback: ({ row }) => vm.showTrail(row)
                },
                {
                  name: 'RemoveNow',
                  title: vm.$t('JITRemoveNow'),
                  type: 'danger',
                  can: ({ row }) =>
                    live &&
                    vm.$hasPerm('accounts.delete_jitaccount') &&
                    row.status?.value !== 'removing',
                  callback: ({ row }) => vm.removeNow(row)
                }
              ]
            }
          }
        }
      },
      headerActions: {
        hasCreate: false,
        hasRefresh: true,
        hasImport: false,
        hasExport: true,
        hasMoreActions: false
      },
      trail: { visible: false, loading: false, title: '', events: [] },
      trailTypes: {
        request: 'primary',
        approve: 'success',
        ready: 'success',
        session: 'warning',
        remove: 'info'
      }
    }
  },
  methods: {
    formatTime(value) {
      return value ? new Date(value).toLocaleString() : ''
    },
    showTrail(row) {
      this.trail = {
        visible: true,
        loading: true,
        title: `${this.$t('JITTrail')}: ${row.username} @ ${row.asset?.name || ''}`,
        events: []
      }
      this.$axios
        .get(`/api/v1/accounts/jit-accounts/${row.id}/trail/`)
        .then((res) => {
          this.trail.events = res.events || []
        })
        .finally(() => {
          this.trail.loading = false
        })
    },
    removeNow(row) {
      ElMessageBox.confirm(
        this.$t('JITRemoveConfirm', { name: row.username, asset: row.asset?.name }),
        this.$t('JITRemoveNow'),
        {
          type: 'warning',
          confirmButtonClass: 'el-button--danger'
        }
      )
        .then(() => {
          this.$axios
            .post(`/api/v1/accounts/jit-accounts/${row.id}/remove/`)
            .then((res) => {
              this.$message.success(res?.msg || this.$t('JITRemoving'))
              setTimeout(() => this.$refs.listTable?.reloadTable?.(), 1500)
            })
            .catch(() => {}) // (the request layer already shows the error)
        })
        .catch(() => {})
    }
  }
}
</script>

<style scoped>
.jit-trail {
  min-height: 120px;
}

.jit-trail-extra {
  margin-top: 2px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
