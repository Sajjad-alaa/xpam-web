<template>
  <GenericCreateUpdatePage
    v-bind="$data"
    :fields="fields"
    :fields-meta="fieldsMeta"
    :initial="initial"
    :url="url"
  />
</template>

<script>
import { GenericCreateUpdatePage } from '@/layout/components'
import ResourceSelect from '@/components/Form/FormFields/ResourceSelect'
import Select2 from '@/components/Form/FormFields/Select2'
import NodeSelect from '@/components/Form/FormFields/NodeSelect'
import AccountFormatter from './components/AccountFormatter'
import { AllAccount } from '../const'
import ProtocolsSelect from '@/components/Form/FormFields/AllOrSpec.vue'

function normalizeResourceIds(values) {
  if (!Array.isArray(values)) {
    return []
  }
  return values
    .map((item) => {
      if (item && typeof item === 'object') {
        return item.id ?? item.pk ?? item.value
      }
      return item
    })
    .filter((item) => item !== undefined && item !== null && item !== '')
}

export default {
  name: 'AccountFormatter',
  components: {
    GenericCreateUpdatePage
  },
  data() {
    const nodesInitial = []
    if (this.$route.query['node_id']) {
      nodesInitial.push(this.$route.query.node_id)
    }
    const assetsInitial = []
    if (this.$route.query['asset_id']) {
      assetsInitial.push(this.$route.query.asset_id)
    }
    const jitEnabled = Boolean(
      this.$hasTicketLicense &&
      this.$hasTicketLicense() &&
      this.$store?.getters?.publicSettings?.['TICKETS_ENABLED']
    )
    return {
      initial: {
        nodes: nodesInitial,
        assets: assetsInitial,
        accounts: [AllAccount]
      },
      fields: [
        [this.$t('Basic'), ['name']],
        // [this.$t('Resource'), ['users', 'user_groups']],
        [this.$t('User'), ['users', 'user_groups']],
        [this.$t('Asset'), ['assets', 'nodes']],
        [this.$t('Account'), ['accounts']],
        ...(jitEnabled ? [[this.$t('JITAccess'), ['jit_disabled', 'jit_policy']]] : []),
        [this.$t('Protocol'), ['protocols']],
        [this.$t('Action'), ['actions']],
        [this.$t('Other'), ['is_active', 'date_start', 'date_expired', 'comment']]
      ],
      url: '/api/v1/perms/asset-permissions/',
      createSuccessNextRoute: { name: 'AssetPermissionDetail' },
      fieldsMeta: {
        users: {
          type: 'resourceSelect',
          component: ResourceSelect,
          rules: [
            {
              required: false
            }
          ],
          el: {
            value: [],
            url: '/api/v1/users/users/?fields_size=mini',
            resourceName: this.$t('Users')
          }
        },
        user_groups: {
          type: 'resourceSelect',
          component: ResourceSelect,
          rules: [
            {
              required: false
            }
          ],
          el: {
            value: [],
            url: '/api/v1/users/groups/?fields_size=mini',
            resourceName: this.$t('UserGroups')
          }
        },
        assets: {
          type: 'resourceSelect',
          component: ResourceSelect,
          rules: [
            {
              required: false
            }
          ],
          el: {
            value: [],
            url: '/api/v1/assets/assets/?fields_size=mini',
            resourceName: this.$t('Assets'),
            nodeFilter: {
              treeUrl: '/api/v1/assets/nodes/children/tree/?asset_amount=0&all=all',
              typeTreeUrl: '/api/v1/assets/nodes/category/tree/?count_resource=none',
              includeDescendants: true
            }
          }
        },
        nodes: {
          type: 'nodeSelect',
          component: NodeSelect,
          rules: [
            {
              required: false
            }
          ],
          el: {
            value: [],
            url: '/api/v1/assets/nodes/?fields_size=mini',
            treeUrl: '/api/v1/assets/nodes/children/tree/?asset_amount=0&all=all',
            resourceName: this.$t('Nodes')
          }
        },
        protocols: {
          component: ProtocolsSelect,
          el: {
            resource: this.$t('Protocols'),
            select2: {
              url: '/api/v1/assets/protocols/',
              ajax: {
                transformOption: (item) => {
                  return { label: item.label, value: item.value }
                }
              }
            }
          }
        },
        jit_disabled: {
          label: this.$t('JITDisabled'),
          helpText: this.$t('JITDisabledHelp')
        },
        jit_policy: {
          component: Select2,
          hidden: (form) => form.jit_disabled,
          helpText: this.$t('JITPermissionPolicyHelp'),
          el: {
            multiple: false,
            clearable: true,
            ajax: {
              url: '/api/v1/accounts/jit-policies/?for_permission=1&is_active=true',
              transformOption: (item) => {
                return { label: `${item.name} (${item.mode?.label || ''})`, value: item.id }
              }
            }
          }
        },
        accounts: {
          type: 'input',
          component: AccountFormatter,
          el: {
            enableExcludeAccounts: true,
            enableNoneAccount: true,
            assets: [],
            nodes: []
          },
          hidden: (formValue) => {
            this.fieldsMeta.accounts.el.assets = normalizeResourceIds(formValue.assets)
            this.fieldsMeta.accounts.el.nodes = formValue.nodes
          }
        },
        actions: {
          label: this.$t('Action'),
          helpText: this.$t('ActionsTips'),
          el: {
            expandAll: true
          }
        },
        date_start: {},
        date_expired: {},
        comment: {},
        is_active: {
          type: 'checkbox'
        }
      },
      cleanFormValue(value) {
        if (!Array.isArray(value.accounts)) {
          value.accounts = value.accounts ? value.accounts.split(',') : []
        }
        // a hidden just-in-time policy is not kept when just-in-time accounts are turned off
        if (value.jit_disabled) value.jit_policy = null
        return value
      }
    }
  }
}
</script>

<style lang="scss" scoped>
:deep(.el-tree) {
  padding: 5px 0;
}
</style>
