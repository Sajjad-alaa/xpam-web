<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'
import { NodeSelect, Select2 } from '@/components/Form/FormFields'

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
        [this.$t('Basic'), ['name', 'priority']],
        [this.$t('VaultRuleMatch'), ['nodes', 'platforms', 'username']],
        [this.$t('VaultRuleTarget'), ['connection', 'mirror']],
        [this.$t('Other'), ['is_active', 'comment']]
      ],
      fieldsMeta: {
        nodes: {
          component: NodeSelect,
          el: {
            value: [],
            url: '/api/v1/assets/nodes/?fields_size=mini',
            treeUrl: '/api/v1/assets/nodes/children/tree/?asset_amount=0&all=all',
            resourceName: this.$t('Nodes')
          }
        },
        platforms: {
          component: Select2,
          el: { multiple: true, url: '/api/v1/assets/platforms/?fields_size=mini' }
        },
        connection: connectionSelect(vm, this.$t('Vault'), this.$t('VaultRuleConnectionHelp')),
        mirror: connectionSelect(vm, this.$t('VaultMirror'), this.$t('VaultMirrorHelp'))
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
