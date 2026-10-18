<template>
  <div>
    <el-alert type="info" :closable="false" show-icon class="jit-intro">
      {{ $t('JITIntro') }}
    </el-alert>
    <GenericListTable
      ref="listTable"
      :create-drawer="createDrawer"
      :header-actions="headerActions"
      :resource="$t('JITPolicy')"
      :table-config="tableConfig"
    />
  </div>
</template>

<script lang="jsx">
import { ActionsFormatter } from '@/components/Table/TableFormatters'
import { GenericListTable } from '@/layout/components'

export default {
  name: 'JITPolicyList',
  components: {
    GenericListTable
  },
  data() {
    return {
      createDrawer: () => import('@/views/accounts/JIT/JITPolicyCreateUpdate.vue'),
      tableConfig: {
        url: '/api/v1/accounts/jit-policies/',
        permissions: { app: 'accounts', resource: 'jitpolicy' },
        columns: [
          'name',
          'mode',
          'username_mode',
          'privileged',
          'permissions_amount',
          'live_accounts_amount',
          'is_active',
          'comment',
          'actions'
        ],
        columnsShow: {
          min: ['name', 'actions'],
          default: [
            'name',
            'mode',
            'username_mode',
            'privileged',
            'permissions_amount',
            'live_accounts_amount',
            'is_active',
            'actions'
          ]
        },
        columnsMeta: {
          mode: {
            formatter: (row) => <span>{row.mode?.label}</span>
          },
          username_mode: {
            formatter: (row) => {
              const label = row.username_mode?.label
              if (row.username_mode?.value === 'specific') {
                return (
                  <span>
                    {label}: {row.specific_username}
                  </span>
                )
              }
              return (
                <span>{row.username_prefix ? `${label} (${row.username_prefix}…)` : label}</span>
              )
            }
          },
          privileged: {
            width: '150px',
            formatterArgs: { showText: false, showFalse: false }
          },
          permissions_amount: {
            width: '120px',
            formatter: (row) => (
              <span>
                {row.mode?.value === 'approved_window'
                  ? this.$t('JITApprovedRequests')
                  : row.permissions_amount}
              </span>
            )
          },
          live_accounts_amount: { width: '130px' },
          actions: {
            formatter: ActionsFormatter,
            formatterArgs: {
              hasUpdate: true,
              hasDelete: true,
              hasClone: false
            }
          }
        }
      },
      headerActions: {
        hasRefresh: true,
        hasImport: false,
        hasExport: false,
        hasMoreActions: false,
        searchConfig: {
          exclude: ['mode', 'username_mode']
        }
      }
    }
  }
}
</script>

<style scoped>
.jit-intro {
  margin-bottom: 12px;
}
</style>
