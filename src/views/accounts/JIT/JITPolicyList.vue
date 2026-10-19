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
          'priority',
          'scope',
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
            'priority',
            'scope',
            'mode',
            'username_mode',
            'privileged',
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
          priority: { width: '100px' },
          scope: {
            label: this.$t('JITAppliesTo'),
            minWidth: '260px',
            formatter: (row) => {
              const scope = row.scope?.value
              const linked = row.permissions_amount
                ? ` + ${row.permissions_amount} ${this.$t('JITLinkedShort')}`
                : ''
              if (scope === 'linked') {
                return <span>{`${row.permissions_amount} ${this.$t('JITLinkedShort')}`}</span>
              }
              const tag =
                scope === 'requests' ? (
                  <el-tag size="small" type="success">
                    {this.$t('JITApprovedRequests')}
                  </el-tag>
                ) : (
                  <el-tag size="small">{this.$t('JITAllPermissions')}</el-tag>
                )
              return (
                <span>
                  {tag} {this.ruleText(row.users, 'users')} · {this.ruleText(row.assets, 'assets')}
                  {linked}
                </span>
              )
            }
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
          exclude: ['mode', 'username_mode', 'scope']
        }
      }
    }
  },
  methods: {
    ruleText(value, kind) {
      const type = value?.type
      if (type === 'all') {
        return kind === 'users' ? this.$t('JITAllUsers') : this.$t('JITAllAssets')
      }
      if (type === 'ids') {
        const n = value.ids?.length || 0
        return `${n} ${kind === 'users' ? this.$t('Users') : this.$t('Assets')}`
      }
      if (type === 'attrs') {
        const names = (value.attrs || []).map((a) => a.name).join(', ')
        return `${kind === 'users' ? this.$t('Users') : this.$t('Assets')}: ${names}`
      }
      return '-'
    }
  }
}
</script>

<style scoped>
.jit-intro {
  margin-bottom: 12px;
}
</style>
