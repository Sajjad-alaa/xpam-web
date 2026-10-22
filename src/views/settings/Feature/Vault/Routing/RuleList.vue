<template>
  <div>
    <el-alert type="info" :closable="false" show-icon :title="$t('VaultRulesHelp')" />
    <GenericListTable
      ref="listTable"
      :create-drawer="createDrawer"
      :header-actions="headerActions"
      :resource="$t('VaultStorageRule')"
      :table-config="tableConfig"
    />
  </div>
</template>

<script>
import { GenericListTable } from '@/layout/components'

export default {
  name: 'VaultRuleList',
  components: { GenericListTable },
  data() {
    const name = (v) => (v && v.name) || this.$t('VaultConfigured')
    return {
      createDrawer: () => import('./RuleCreateUpdate.vue'),
      tableConfig: {
        url: '/api/v1/accounts/vault-rules/',
        permissions: {
          add: 'settings.change_vault',
          change: 'settings.change_vault',
          delete: 'settings.change_vault',
          view: 'settings.view_setting'
        },
        columns: [
          'name',
          'org_name',
          'priority',
          'username',
          'connection',
          'mirror',
          'is_active',
          'comment',
          'actions'
        ],
        columnsShow: {
          min: ['name', 'actions'],
          default: [
            'name',
            'org_name',
            'priority',
            'username',
            'connection',
            'mirror',
            'is_active',
            'actions'
          ]
        },
        columnsMeta: {
          connection: { formatter: (row) => name(row.connection) },
          mirror: { formatter: (row) => (row.mirror ? row.mirror.name : '-') },
          actions: { formatterArgs: { hasClone: false } }
        }
      },
      headerActions: { hasImport: false, hasExport: false, hasMoreActions: false }
    }
  }
}
</script>
