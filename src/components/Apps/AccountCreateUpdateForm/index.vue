<template>
  <AutoDataForm
    v-bind="$data"
    v-if="!loading"
    ref="AutoDataForm"
    :class="addTemplate ? '' : 'account-add'"
    :submit-btn-text="submitBtnText"
    @submit="confirm"
  />
</template>

<script>
import AutoDataForm from '@/components/Form/AutoDataForm/index.vue'
import { Select2 } from '@/components/Form/FormFields'
import { encryptPassword } from '@/utils/session-encrypt'
import {
  accountFieldsMeta,
  getSecretTypeOptions
} from '@/components/Apps/AccountCreateUpdateForm/const'

// XPAM: "read from an existing vault" — the password stays in the customer's vault
const externalRefForm = (account) => {
  const ref = (account && account.secret_ref) || {}
  const source = account && account.secret_source
  return {
    secret_source: (source && (source.value || source)) || 'xpam',
    ref_connection: ref.connection || '',
    ref_path: ref.path || '',
    ref_field: ref.field || ''
  }
}

const withExternalSecret = (vm, meta) => {
  const external = (formValue) =>
    (formValue.secret_source?.value || formValue.secret_source) === 'external'
  for (const name of [
    'password',
    'ssh_key',
    'token',
    'access_key',
    'passphrase',
    'api_key',
    'secret_reset',
    'push_now'
  ]) {
    const field = meta[name] || (meta[name] = {})
    const original = field.hidden
    field.hidden = (formValue) =>
      external(formValue) || (typeof original === 'function' ? original(formValue) : !!original)
  }
  meta.secret_source = {
    label: vm.$t('Secret'),
    type: 'radio-group',
    options: [
      { label: vm.$t('Kept by XPAM'), value: 'xpam' },
      { label: vm.$t('SecretSourceExternal'), value: 'external' }
    ]
  }
  meta.ref_connection = {
    label: vm.$t('VaultConnection'),
    component: Select2,
    el: {
      multiple: false,
      url: '/api/v1/accounts/vault-connections/?is_active=true',
      ajax: { transformOption: (item) => ({ label: item.name, value: item.id }) }
    },
    hidden: (formValue) => !external(formValue)
  }
  meta.ref_path = {
    label: vm.$t('Path'),
    type: 'input',
    helpText: vm.$t('SecretRefHelp'),
    hidden: (formValue) => !external(formValue)
  }
  meta.ref_field = {
    label: vm.$t('Field'),
    type: 'input',
    hidden: (formValue) => !external(formValue)
  }
  return meta
}

export default {
  name: 'AccountCreateForm',
  components: {
    AutoDataForm
  },
  props: {
    asset: {
      type: Object,
      default: null
    },
    platform: {
      type: Object,
      default: null
    },
    account: {
      type: Object,
      default: () => ({})
    },
    // 默认组件密码加密
    encryptPassword: {
      type: Boolean,
      default: true
    },
    addTemplate: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: true,
      isDisabled: false,
      usernameChanged: false,
      submitBtnText: this.$t('Confirm'),
      iPlatform: {
        automation: {},
        su_enabled: false,
        protocols: [
          {
            name: 'ssh',
            secret_types: [
              'password',
              'ssh_key',
              'ssh_certificate',
              'token',
              'access_key',
              'api_key'
            ]
          }
        ]
      },
      url: '/api/v1/accounts/accounts/',
      form: Object.assign(
        { on_invalid: 'error', secret_source: 'xpam' },
        this.account || {},
        externalRefForm(this.account)
      ),
      encryptedFields: ['secret'],
      fields: [
        [
          this.$t('Basic'),
          ['name', 'username', 'privileged', 'su_from', 'su_from_username', 'template']
        ],
        [this.$t('Asset'), ['nodes', 'assets']],
        [
          this.$t('Secret'),
          [
            'secret_source',
            'ref_connection',
            'ref_path',
            'ref_field',
            'secret_type',
            'password',
            'ssh_key',
            'token',
            'access_key',
            'passphrase',
            'api_key',
            'secret_reset'
          ]
        ],
        [this.$t('Other'), ['push_now', 'params', 'on_invalid', 'is_active', 'comment']]
      ],
      fieldsMeta: withExternalSecret(this, accountFieldsMeta(this)),
      hasSaveContinue: false
    }
  },
  watch: {
    '$route.query': {
      handler(nv, ov) {
        if (nv && (nv.flag === 'move' || nv.flag === 'copy')) {
          this.isDisabled = true
        }
      },
      immediate: true
    }
  },
  async mounted() {
    try {
      await this.getPlatform()
      this.setSecretTypeOptions()
      this.getDefaultAssets()
    } finally {
      this.loading = false
    }
  },
  methods: {
    async getDefaultAssets() {
      const assetId = this.$route.query.asset_id
      if (assetId && !this.form.name) {
        this.form.assets = [assetId]
      }
    },
    async getPlatform() {
      if (this.platform) {
        this.iPlatform = this.platform
      }
      if (!this.asset || !this.asset.platform) {
        return
      }
      const platformId = this.asset.platform.id
      this.iPlatform = await this.$axios.get(`/api/v1/assets/platforms/${platformId}/`)
    },
    setSecretTypeOptions() {
      const choices = getSecretTypeOptions(this)
      const secretTypes = []
      this.iPlatform.protocols?.forEach((p) => {
        secretTypes.push(...p['secret_types'])
      })
      if (!this.form?.secret_type) {
        this.form.secret_type = secretTypes[0]
      }
      this.fieldsMeta.secret_type.options = choices.filter((item) => {
        return secretTypes.indexOf(item.value) > -1
      })
    },
    confirm(form) {
      // XPAM: a password read from an existing vault — nothing to send but where it is
      if (form.secret_source === 'external') {
        form.secret_ref = {
          connection: form.ref_connection,
          path: form.ref_path,
          field: form.ref_field || ''
        }
        form.secret_reset = false
        form.push_now = false
      }
      delete form.ref_connection
      delete form.ref_path
      delete form.ref_field
      if (typeof form.secret_source === 'object' && form.secret_source) {
        form.secret_source = form.secret_source.value
      }
      const secretType = form.secret_type || 'password'
      form.secret = form[secretType]
      form.secret = this.encryptPassword ? encryptPassword(form.secret) : form.secret

      // 如果不删除会明文显示
      delete form[secretType]

      if (!form.secret) {
        delete form['secret']
      }
      if (this.account?.name) {
        if (this.account.payload && this.account.payload === 'pam_account_clone') {
          this.$emit('add', form)
        } else {
          this.$emit('edit', form)
        }
      } else {
        this.$emit('add', form)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.account-add {
  :deep(.el-form-item) {
    //margin-bottom: 5px;

    .help-block {
      //margin-bottom: 5px;
    }
  }

  :deep(.form-group-header) {
    .hr-line-dashed {
      //margin: 5px 0;
    }

    h3 {
      margin-bottom: 10px;
    }
  }
}
</style>
