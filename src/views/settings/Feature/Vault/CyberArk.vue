<template>
  <BaseKV :config="$data" :title="$tc('CyberArkConjur')" />
</template>

<script>
import BaseKV from './Base.vue'

export default {
  name: 'CyberArkConjur',
  components: {
    BaseKV
  },
  data() {
    const vm = this
    return {
      url: `/api/v1/settings/setting/?category=cyberark`,
      hasDetailInMsg: false,
      visible: false,
      moreButtons: [
        {
          title: this.$t('Test'),
          loading: false,
          callback: function (value, form, btn) {
            btn.loading = true
            vm.$axios
              .post('/api/v1/settings/vault/cyberark/testing/', value)
              .then((res) => {
                vm.$message.success(res['msg'])
              })
              .catch(() => {
                vm.$log.error('err occur')
              })
              .finally(() => {
                btn.loading = false
              })
          }
        }
      ],
      encryptedFields: ['VAULT_CYBERARK_API_KEY'],
      fields: [
        [
          this.$t('AccountStorage'),
          [
            'VAULT_CYBERARK_URL',
            'VAULT_CYBERARK_ACCOUNT',
            'VAULT_CYBERARK_LOGIN',
            'VAULT_CYBERARK_API_KEY',
            'VAULT_CYBERARK_POLICY',
            'VAULT_CYBERARK_CA_FILE'
          ]
        ]
      ],
      fieldsMeta: {},
      submitMethod() {
        return 'patch'
      }
    }
  }
}
</script>

<style scoped></style>
