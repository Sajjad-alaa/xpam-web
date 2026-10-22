<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'
import { Select2 } from '@/components/Form/FormFields'

const SYSTEM_ORG = '00000000-0000-0000-0000-000000000004'
const nodesUrl = (org) => `/api/v1/assets/nodes/?fields_size=mini&oid=${org || ''}`

const connectionSelect = (vm, label, helpText) => ({
  label,
  helpText,
  component: Select2,
  el: {
    multiple: false,
    clearable: true,
    url: '/api/v1/accounts/vault-connections/?is_active=true',
    ajax: {
      transformOption: (item) => ({
        label: `${item.name} (${item.type?.label || item.type})`,
        value: item.id
      })
    }
  }
})

export default {
  name: 'VaultRuleCreateUpdate',
  components: { GenericCreateUpdatePage },
  data() {
    const vm = this
    return {
      url: '/api/v1/accounts/vault-rules/',
      hasDetailInMsg: false,
      initial: { priority: 50, is_active: true, nodes: [], platforms: [], username: '' },
      fields: [
        [this.$t('Basic'), ['org_id', 'name', 'priority']],
        [this.$t('VaultRuleMatch'), ['nodes', 'platforms', 'username']],
        [this.$t('VaultRuleTarget'), ['connection', 'mirror']],
        [this.$t('Other'), ['is_active', 'comment']]
      ],
      fieldsMeta: {
        // System settings: the rule belongs to an organization (its asset groups are that organization's)
        org_id: {
          label: this.$t('Organization'),
          component: Select2,
          rules: [{ required: true, message: this.$t('Required'), trigger: 'change' }],
          el: {
            multiple: false,
            clearable: false,
            url: '/api/v1/orgs/orgs/?fields_size=mini',
            ajax: {
              transformOption: (item) => ({ label: item.name, value: item.id }),
              filterOption: (item) => item.value !== SYSTEM_ORG
            }
          },
          on: {
            change: ([org], updateForm) => {
              vm.fieldsMeta.nodes.el.url = nodesUrl(org)
              updateForm({ nodes: [] })
            }
          }
        },
        nodes: {
          label: this.$t('Nodes'),
          component: Select2,
          el: {
            multiple: true,
            value: [],
            url: nodesUrl(''),
            ajax: {
              transformOption: (item) => ({
                label: item.full_value || item.value || item.name,
                value: item.id
              })
            }
          }
        },
        platforms: {
          component: Select2,
          el: { multiple: true, url: '/api/v1/assets/platforms/?fields_size=mini' }
        },
        connection: connectionSelect(vm, this.$t('Vault'), this.$t('VaultRuleConnectionHelp')),
        mirror: connectionSelect(vm, this.$t('VaultMirror'), this.$t('VaultMirrorHelp'))
      },
      afterGetFormValue(value) {
        vm.fieldsMeta.nodes.el.url = nodesUrl(value.org_id)
        vm.fieldsMeta.org_id.el.disabled = !!value.id
        return value
      },
      cleanFormValue(value) {
        for (const key of ['connection', 'mirror']) {
          const v = value[key]
          value[key] = v && typeof v === 'object' ? v.id || v.pk || null : v || null
        }
        return value
      }
    }
  }
}
</script>
