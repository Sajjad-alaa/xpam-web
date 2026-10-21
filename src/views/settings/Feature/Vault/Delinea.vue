<template>
  <BaseKV :config="$data" :title="$tc('DelineaSecretServer')" />
</template>

<script>
import BaseKV from './Base.vue'

export default {
  name: 'DelineaSecretServer',
  components: {
    BaseKV
  },
  data() {
    const vm = this
    return {
      url: `/api/v1/settings/setting/?category=delinea`,
      hasDetailInMsg: false,
      visible: false,
      moreButtons: [
        {
          title: this.$t('Test'),
          loading: false,
          callback: function (value, form, btn) {
            btn.loading = true
            vm.$axios
              .post('/api/v1/settings/vault/delinea/testing/', value)
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
      encryptedFields: ['VAULT_DELINEA_PASSWORD'],
      fields: [
        [
          this.$t('AccountStorage'),
          [
            'VAULT_DELINEA_URL',
            'VAULT_DELINEA_USERNAME',
            'VAULT_DELINEA_PASSWORD',
            'VAULT_DELINEA_DOMAIN',
            'VAULT_DELINEA_FOLDER_ID',
            'VAULT_DELINEA_TEMPLATE_ID',
            'VAULT_DELINEA_FIELD',
            'VAULT_DELINEA_SITE_ID',
            'VAULT_DELINEA_CA_FILE'
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
