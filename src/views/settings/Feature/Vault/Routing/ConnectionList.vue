<template>
  <div>
    <el-alert type="info" :closable="false" show-icon :title="$t('VaultConnectionsHelp')" />
    <GenericListTable
      ref="listTable"
      :create-drawer="createDrawer"
      :header-actions="headerActions"
      :resource="$t('VaultConnection')"
      :table-config="tableConfig"
    />
  </div>
</template>

<script>
import { ActionsFormatter } from '@/components/Table/TableFormatters'
import { GenericListTable } from '@/layout/components'

export default {
  name: 'VaultConnectionList',
  components: { GenericListTable },
  data() {
    const vm = this
    const editable = (row) => !row.managed && !vm.locked
    return {
      locked: false,
      createDrawer: () => import('./ConnectionCreateUpdate.vue'),
      tableConfig: {
        url: '/api/v1/accounts/vault-connections/',
        columns: ['name', 'type', 'managed', 'is_active', 'comment', 'actions'],
        columnsShow: {
          min: ['name', 'actions'],
          default: ['name', 'type', 'managed', 'is_active', 'actions']
        },
        columnsMeta: {
          type: { formatter: (row) => row.type?.label || row.type },
          actions: {
            formatter: ActionsFormatter,
            formatterArgs: {
              hasClone: false,
              canUpdate: ({ row }) => editable(row),
              canDelete: ({ row }) => editable(row),
              extraActions: [
                {
                  name: 'test',
                  title: vm.$t('Test'),
                  type: 'primary',
                  callback: ({ row }) => {
                    vm.$axios
                      .post(`/api/v1/accounts/vault-connections/${row.id}/test/`)
                      .then((res) => vm.$message.success(res.msg))
                  }
                }
              ]
            }
          }
        }
      },
      headerActions: {
        hasImport: false,
        hasExport: false,
        hasMoreActions: false,
        canCreate: () => !vm.locked,
        extraActions: [
          {
            name: 'move',
            title: vm.$t('VaultApplyRulesNow'),
            type: 'primary',
            callback: () => {
              vm.$axios.post('/api/v1/accounts/vault-connections/move/').then(() => {
                vm.$message.success(vm.$t('VaultApplyRulesStarted'))
              })
            }
          }
        ]
      }
    }
  },
  mounted() {
    this.$axios.get('/api/v1/settings/setting/?category=vault').then((res) => {
      this.locked = !!res['VAULT_LOCKED']
    })
  }
}
</script>
