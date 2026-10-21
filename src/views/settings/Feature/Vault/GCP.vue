<template>
  <BaseKV :config="$data" :title="$tc('GoogleSecretManager')" />
</template>

<script>
import BaseKV from './Base.vue'

export default {
  name: 'GoogleSecretManager',
  components: {
    BaseKV
  },
  data() {
    const vm = this
    return {
      url: `/api/v1/settings/setting/?category=gcp_sm`,
      hasDetailInMsg: false,
      visible: false,
      moreButtons: [
        {
          title: this.$t('Test'),
          loading: false,
          callback: function (value, form, btn) {
            btn.loading = true
            vm.$axios
              .post('/api/v1/settings/vault/gcp/testing/', value)
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
      encryptedFields: ['VAULT_GCP_CREDENTIALS'],
      fields: [
        [
          this.$t('AccountStorage'),
          ['VAULT_GCP_PROJECT', 'VAULT_GCP_CREDENTIALS', 'VAULT_GCP_LOCATIONS']
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
