<template>
  <div>
    <el-alert v-if="locked" type="warning" :closable="false" :title="$t('VaultLockedText')" />
    <el-alert type="info">
      <template #default>
        <div v-sanitize="helpText" />
      </template>
    </el-alert>
    <IBox>
      <GenericCreateUpdateForm v-bind="$data" />
    </IBox>
  </div>
</template>

<script>
import { GenericCreateUpdateForm } from '@/layout/components'
import IBox from '@/components/Common/IBox/index.vue'
import { openTaskPage } from '@/utils/jms/index'
import { Select2 } from '@/components/Form/FormFields'
import store from '@/store'
import OpenBaoKV from './OpenBao.vue'
import HashiCorpKV from './HCP.vue'
import AzureKV from './Azure.vue'
import AwsSM from './Aws.vue'
import CyberArk from './CyberArk.vue'
import Delinea from './Delinea.vue'
import GoogleSM from './GCP.vue'

export default {
  components: {
    IBox,
    GenericCreateUpdateForm
  },
  data() {
    const vm = this
    return {
      locked: false,
      url: '/api/v1/settings/setting/?category=vault',
      hasReset: false,
      helpText: this.$t('VaultHelpText'),
      moreButtons: [
        {
          title: this.$t('Sync'),
          loading: false,
          disabled: !store.getters.publicSettings['VAULT_ENABLED'],
          callback: function (value, form, btn) {
            vm.runVaultTask('/api/v1/settings/vault/sync/', value, btn)
          }
        },
        {
          title: this.$t('RestoreToDatabase'),
          type: 'warning',
          plain: true,
          loading: false,
          disabled: !store.getters.publicSettings['VAULT_ENABLED'],
          hidden: () => vm.locked,
          callback: function (value, form, btn) {
            vm.$confirm(vm.$t('RestoreVaultConfirm'), vm.$t('RestoreToDatabase'), {
              confirmButtonText: vm.$t('Confirm'),
              cancelButtonText: vm.$t('Cancel'),
              type: 'warning'
            }).then(() => {
              vm.runVaultTask('/api/v1/settings/vault/restore/', value, btn)
            })
          }
        }
      ],
      fields: [
        [
          this.$t('Basic'),
          ['VAULT_ENABLED', 'VAULT_BACKEND', 'VAULT_MIRROR', 'HISTORY_ACCOUNT_CLEAN_LIMIT']
        ],
        [this.$t('Provider'), ['OPENBAO', 'HCP', 'AZURE', 'AWS', 'CYBERARK', 'DELINEA', 'GCP']]
      ],
      fieldsMeta: {
        HISTORY_ACCOUNT_CLEAN_LIMIT: {
          el: {
            autocomplete: 'new-password'
          }
        },
        VAULT_ENABLED: {
          disabled: true
        },
        VAULT_MIRROR: {
          label: this.$t('VaultMirror'),
          helpText: this.$t('VaultMirrorHelp'),
          component: Select2,
          el: {
            multiple: false,
            clearable: true,
            url: '/api/v1/accounts/vault-connections/?is_active=true',
            ajax: { transformOption: (item) => ({ label: item.name, value: item.id }) }
          },
          hidden: (formValue) => !formValue.VAULT_ENABLED
        },
        VAULT_BACKEND: {
          label: this.$t('Provider'),
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] === 'local'
          },
          disabled: true
        },
        OPENBAO: {
          label: this.$t('OpenBao'),
          component: OpenBaoKV,
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] !== 'openbao'
          }
        },
        HCP: {
          label: this.$t('HashicorpVault'),
          component: HashiCorpKV,
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] !== 'hcp'
          }
        },
        AZURE: {
          label: this.$t('AzureKeyVault'),
          component: AzureKV,
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] !== 'azure'
          }
        },
        AWS: {
          label: this.$t('AmazonSecretsManager'),
          component: AwsSM,
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] !== 'aws'
          }
        },
        CYBERARK: {
          label: this.$t('CyberArkConjur'),
          component: CyberArk,
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] !== 'cyberark'
          }
        },
        DELINEA: {
          label: this.$t('DelineaSecretServer'),
          component: Delinea,
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] !== 'delinea'
          }
        },
        GCP: {
          label: this.$t('GoogleSecretManager'),
          component: GoogleSM,
          hidden: (formValue) => {
            return !formValue.VAULT_ENABLED || formValue['VAULT_BACKEND'] !== 'gcp'
          }
        }
      },
      submitMethod() {
        return 'patch'
      }
    }
  },
  mounted() {
    this.$axios.get('/api/v1/settings/setting/?category=vault').then((res) => {
      this.locked = !!res['VAULT_LOCKED']
    })
  },
  methods: {
    runVaultTask(url, value, btn) {
      btn.loading = true
      this.$axios
        .post(url, value)
        .then((res) => {
          openTaskPage(res['task'])
        })
        .catch(() => {
          this.$log.error('err occur')
        })
        .finally(() => {
          btn.loading = false
        })
    }
  }
}
</script>

<style scoped></style>
