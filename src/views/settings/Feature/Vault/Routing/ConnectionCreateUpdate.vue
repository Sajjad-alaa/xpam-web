<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'

export default {
  name: 'VaultConnectionCreateUpdate',
  components: { GenericCreateUpdatePage },
  data() {
    return {
      url: '/api/v1/accounts/vault-connections/',
      hasDetailInMsg: false,
      initial: { is_active: true, config: '{}' },
      fields: [
        [this.$t('Basic'), ['name', 'type']],
        [this.$t('Setting'), ['config']],
        [this.$t('Other'), ['is_active', 'comment']]
      ],
      fieldsMeta: {
        config: {
          label: this.$t('Setting'),
          helpText: this.$t('VaultConnectionConfigHelp'),
          component: 'el-input',
          el: { type: 'textarea', rows: 10 }
        }
      },
      afterGetFormValue(value) {
        // passwords and keys come back as ****** and are kept when left so
        value.config = JSON.stringify(value.settings || {}, null, 2)
        return value
      },
      cleanFormValue(value) {
        try {
          value.config =
            typeof value.config === 'string' ? JSON.parse(value.config || '{}') : value.config
        } catch {
          value.config = {}
        }
        return value
      }
    }
  }
}
</script>
