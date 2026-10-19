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
          'features',
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
            'features',
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
          features: {
            label: this.$t('JITFeatures'),
            minWidth: '240px',
            formatter: (row) => {
              const tags = []
              if (row.jit_only) tags.push(['danger', this.$t('JITOnlyShort')])
              if (row.auto_approve) {
                tags.push(['success', this.$t('JITAutoShort', { h: row.auto_approve_max_hours })])
              }
              if (row.approvals_required > 1) {
                tags.push(['warning', this.$t('JITTwoApproversShort')])
              }
              if (row.require_mfa) tags.push(['warning', 'MFA'])
              if (row.credential_type?.value === 'ssh_key') {
                tags.push(['info', this.$t('JITSSHKey')])
              }
              if ((row.command_groups || []).length) {
                tags.push(['info', this.$t('JITCommandsShort')])
              }
              if (row.self_service) tags.push(['', this.$t('JITSelfServiceShort')])
              return (
                <span>
                  {tags.map(([type, text]) => (
                    <el-tag size="small" type={type} style="margin: 0 4px 2px 0">
                      {text}
                    </el-tag>
                  ))}
                </span>
              )
            }
          },
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
