<template>
  <IBox>
    <GenericCreateUpdateForm v-bind="$data" class="form" />
  </IBox>
</template>

<script>
import GenericCreateUpdateForm from '@/layout/components/GenericCreateUpdateForm/index.vue'
import SMSCustom from './SMSCustom.vue'
import SMSFileCustom from './SMSFileCustom.vue'
import { IBox } from '@/components'

// XPAM: only the custom providers are offered; the China-only ones (Alibaba Cloud, Tencent Cloud,
// Huawei Cloud, CMPP v2.0) are not (the API offers the same list)

export default {
  name: 'Auth',
  components: {
    GenericCreateUpdateForm,
    IBox
  },
  data() {
    return {
      url: '/api/v1/settings/setting/?category=sms',
      fields: [
        [this.$t('Basic'), ['SMS_ENABLED', 'SMS_BACKEND', 'SMS_CODE_LENGTH']],
        [this.$t('Provider'), ['SMSCustom', 'SMSFileCustom']]
      ],
      fieldsMeta: {
        SMSCustom: {
          label: this.$t('Custom'),
          component: SMSCustom,
          hidden: (form) => {
            return form['SMS_BACKEND'] !== 'custom'
          }
        },
        SMSFileCustom: {
          label: this.$t('Custom'),
          component: SMSFileCustom,
          hidden: (form) => {
            return form['SMS_BACKEND'] !== 'custom_file'
          }
        }
      },
      submitMethod() {
        return 'patch'
      },
      cleanFormValue(data) {
        // 这个页面不去提交auth这些
        const removeFields = ['SET_UP']
        for (const i of removeFields) {
          delete data[i]
        }
        return data
      }
    }
  },
  methods: {}
}
</script>

<style scoped>
.form :deep(.form-buttons) {
  padding-top: 30px;
}
</style>
