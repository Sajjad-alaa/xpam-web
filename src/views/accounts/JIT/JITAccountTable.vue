<template>
  <GenericListTable ref="listTable" :header-actions="headerActions" :table-config="tableConfig" />
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
        hasExport: false,
        hasMoreActions: false
      }
    }
  },
  methods: {
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
          this.$axios.post(`/api/v1/accounts/jit-accounts/${row.id}/remove/`).then((res) => {
            this.$message.success(res?.msg || this.$t('JITRemoving'))
            setTimeout(() => this.$refs.listTable?.reloadTable?.(), 1500)
          })
        })
        .catch(() => {})
    }
  }
}
</script>
