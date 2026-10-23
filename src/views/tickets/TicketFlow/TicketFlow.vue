<template>
  <div>
    <GenericListPage
      ref="GenericListPage"
      :header-actions="headerActions"
      :table-config="tableConfig"
      :create-drawer="createDrawer"
      :detail-drawer="detailDrawer"
    />
    <JITApprovalChannels v-model:visible="channelsVisible" />
  </div>
</template>

<script lang="jsx">
import { GenericListPage } from '@/layout/components'
import { DetailFormatter } from '@/components/Table/TableFormatters'
import { getTicketFlowLabel } from '@/views/tickets/const'
import JITApprovalChannels from '@/views/accounts/JIT/JITApprovalChannels.vue'

export default {
  name: 'TicketFlow',
  components: {
    GenericListPage,
    JITApprovalChannels
  },
  data() {
    const vm = this
    const isOwnFlow = (row) => {
      const currentOrg = vm.$store.getters.currentOrg
      return currentOrg.is_root || row.org_id === currentOrg.id
    }
    return {
      channelsVisible: false,
      createDrawer: () => import('@/views/tickets/TicketFlow/FlowCreateUpdate'),
      detailDrawer: () => import('@/views/tickets/TicketFlow/Detail'),
      tableConfig: {
        url: '/api/v1/tickets/flows/',
        permissions: {
          resource: 'ticketflow'
        },
        columnsExclude: ['rules'],
        columnsShow: {
          min: ['name', 'approval_level', 'actions'],
          default: [
            'name',
            'approval_level',
            'jit_policies',
            'created_by',
            'org_name',
            'date_created',
            'date_updated',
            'actions'
          ]
        },
        columnsMeta: {
          org_name: {
            formatter: function (row) {
              const currentOrg = vm.$store.getters.currentOrg
              return currentOrg['is_root'] ? row.org_name : currentOrg.name
            }
          },
          jit_policies: {
            label: 'Linked JIT Rules',
            minWidth: '220px',
            formatter: (row) => {
              const policies = row.jit_policies || []
              if (!policies.length) {
                return <span style="color: var(--el-text-color-secondary)">-</span>
              }
              return (
                <span>
                  {policies.map((p) => (
                    <el-tag
                      key={p.id}
                      size="small"
                      type={p.via_default ? 'info' : 'primary'}
                      effect="plain"
                      style="margin: 0 4px 2px 0; cursor: pointer"
                      onClick={() => vm.$router.push('/pam/automations/jit-accounts')}
                    >
                      {p.name}
                      {p.auto_approve ? ` (Auto ≤${p.auto_approve_max_hours}h)` : ''}
                      {p.via_default ? ' (Default)' : ''}
                    </el-tag>
                  ))}
                </span>
              )
            }
          },
          name: {
            formatter: DetailFormatter,
            formatterArgs: {
              drawer: true,
              permissions: 'tickets.view_ticketflow',
              getRoute: ({ row }) => ({
                name: 'FlowDetail',
                params: {
                  id: row.id
                }
              }),
              getDrawerTitle: ({ row }) => {
                return getTicketFlowLabel(row, vm.$t)
              },
              getTitle: function ({ row }) {
                return getTicketFlowLabel(row, vm.$t)
              }
            }
          },
          actions: {
            prop: 'actions',
            formatterArgs: {
              hasClone: false,
              hasDelete: true,
              canDelete: ({ row }) => {
                return vm.$hasPerm('tickets.delete_ticketflow') && isOwnFlow(row)
              },
              canUpdate: () => {
                return vm.$hasPerm('tickets.change_ticketflow')
              }
            }
          }
        }
      },
      headerActions: {
        hasLeftActions: true,
        hasBulkDelete: true,
        createRoute: { name: 'TicketFlowCreate' },
        hasSearch: false,
        hasImport: false,
        extraActions: [
          {
            name: 'ApprovalChannels',
            title: this.$t('JITChannelsButton') || 'Approval Channels & SLA',
            type: 'default',
            has: () =>
              this.$hasPerm('tickets.view_ticketflow') || this.$hasPerm('accounts.view_jitpolicy'),
            can: true,
            callback: () => {
              this.channelsVisible = true
            }
          }
        ]
      }
    }
  }
}
</script>
