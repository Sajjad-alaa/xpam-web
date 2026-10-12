<template>
  <Page v-bind="$attrs">
    <div v-if="!loading">
      <el-alert
        v-if="licenseData.is_valid === false"
        type="error"
        :title="licenseData.status === 'Expired' ? 'License Expired' : 'License Invalid'"
        :description="
          licenseData.remark ||
          'Your subscription is inactive. Web Terminal (Luna) and asset connections are suspended until a valid license is imported.'
        "
        show-icon
        style="margin-bottom: 15px"
      />
      <el-alert v-else-if="publicSettings.XPACK_ENABLED" type="info">
        {{ $t('ImportLicenseTip') }}
      </el-alert>
      <TwoCol>
        <DetailCard :items="detailItems" :title="cardTitle" />
        <template #right>
          <QuickActions :actions="displayActions" type="primary" />
        </template>
      </TwoCol>
      <Dialog
        v-model:visible="dialogLicenseImport"
        :title="$tc('ImportLicense')"
        top="20vh"
        width="600px"
        @cancel="dialogLicenseImport = false"
        @confirm="importLicense"
      >
        <div style="padding-bottom: 10px">
          {{ $t('LicenseFile') }} (.lic) or Emergency Clock Unlock Token:
        </div>
        <input type="file" @change="fileChange" />
      </Dialog>
    </div>
  </Page>
</template>

<script lang="jsx">
import Page from '@/layout/components/Page'
import { Dialog, QuickActions } from '@/components'
import DetailCard from '@/components/Cards/DetailCard/index'
import { importLicense } from '@/api/settings'
import { mapGetters } from 'vuex'
import TwoCol from '@/layout/components/Page/TwoColPage.vue'
export default {
  name: 'License',
  components: {
    TwoCol,
    Page,
    DetailCard,
    QuickActions,
    Dialog
  },
  props: {
    object: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      loading: true,
      dialogLicenseImport: false,
      licenseData: {},
      licenseFile: {},
      quickActions: [
        {
          title: this.$t('ImportLicense'),
          attrs: {
            type: 'primary',
            label: this.$t('Import'),
            disabled: false
          },
          callbacks: {
            click: this.importAction
          }
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['publicSettings', 'hasValidLicense', 'hasTicketLicense']),
    displayActions() {
      const actions = [...this.quickActions]
      if (this.licenseData?.status === 'Invalid (Clock Tampering)') {
        actions.push({
          title: 'Unlock System Clock',
          attrs: {
            type: 'warning',
            label: 'Apply Unlock Token',
            disabled: false
          },
          callbacks: {
            click: this.importAction
          }
        })
      }
      return actions
    },
    cardTitle() {
      return ''
    },
    detailItems() {
      const hasTicket = Boolean(this.licenseData?.has_ticket)
      const userLimit = this.licenseData?.user_limit ?? 2
      const assetCount = this.licenseData?.asset_count ?? 1
      const edition =
        this.licenseData?.edition ||
        (hasTicket ? `${this.$t('Ticket')} ${this.$t('Edition')}` : 'Standard Edition')
      return [
        {
          key: this.$t('Edition'),
          value: edition
        },
        {
          key: 'Installation ID',
          value:
            this.licenseData?.current_installation_id ||
            this.licenseData?.installation_id ||
            'Auto-detecting...'
        },
        {
          key: this.$t('Users'),
          value: String(userLimit)
        },
        {
          key: this.$t('AssetsOfNumber'),
          value: String(assetCount)
        },
        {
          key: this.$t('Status'),
          value:
            this.licenseData?.status ||
            (this.licenseData?.is_valid !== false ? this.$t('Valid') : 'Invalid')
        },
        {
          key: this.$t('SerialNumber'),
          value: this.licenseData?.serial_no || 'JMS-DEF-U2-A1-001'
        },
        {
          key: this.$t('Corporation'),
          value: this.licenseData?.corporation || 'XPAM'
        },
        {
          key: this.$t('Expired'),
          value: this.licenseData?.date_expired || this.$t('Never')
        },
        {
          key: this.$t('License'),
          value: hasTicket ? 'Ticket Enabled' : 'No Ticket'
        },
        ...(this.licenseData?.is_valid === false && this.licenseData?.remark
          ? [
              {
                key: this.$t('Remark') || 'Alert',
                value: this.licenseData?.remark
              }
            ]
          : [])
      ]
    }
  },
  mounted() {
    this.quickActions[0].attrs.disabled = false
    if (this.publicSettings.XPACK_ENABLED) {
      this.$axios
        .get('/api/v1/xpack/license/detail')
        .then((res) => {
          this.licenseData = res
        })
        .finally(() => {
          this.loading = false
        })
    } else {
      this.loading = false
    }
  },
  methods: {
    importAction: function () {
      this.dialogLicenseImport = true
    },
    importLicense() {
      if (this.licenseFile['file'] === undefined) {
        return
      }
      const formData = new FormData()
      formData.append('file', this.licenseFile['file'])
      importLicense(formData)
        .then((res) => {
          if (res?.status) {
            this.$message.success(res.msg || this.$t('ImportSuccess'))
            this.dialogLicenseImport = false
            setTimeout(() => location.reload(), 500)
          } else {
            this.$message.error(res?.msg || 'Import failed')
          }
        })
        .catch((err) => {
          const msg = err?.response?.data?.msg || err?.message || 'Import failed'
          this.$message.error(msg)
        })
    },
    fileChange(e) {
      this.licenseFile['file'] = e.target.files[0]
    }
  }
}
</script>

<style scoped></style>
