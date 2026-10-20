<template>
  <BaseAssetCreateUpdate v-bind="$data" />
</template>

<script>
import BaseAssetCreateUpdate from './BaseAssetCreateUpdate'

export default {
  name: 'WebCreateUpdate',
  components: { BaseAssetCreateUpdate },
  data() {
    return {
      url: '/api/v1/assets/webs/',
      addFields: [
        [this.$t('Basic'), ['allowed_urls', 'verify_cert']],
        [
          this.$t('WebSignInOptional'),
          [
            'autofill',
            'username_selector',
            'password_selector',
            'submit_selector',
            'success_selector',
            'interactive_selector',
            'script'
          ],
          1
        ]
      ],
      addFieldsMeta: {
        verify_cert: {
          label: this.$t('WebVerifyCert'),
          helpText: this.$t('WebVerifyCertHelp')
        },
        allowed_urls: {
          hidden: () => !this.$hasLicense(),
          label: this.$t('WebAllowedSites'),
          helpText: this.$t('WebAllowedSitesHelp'),
          required: false,
          default: []
        },
        protocols: {
          hidden: (formValue) => {
            const address = formValue['address']
            if (!address) return
            // no scheme means https:// (the server adds it)
            let port = address.startsWith('http://') ? 80 : 443
            try {
              const url = new URL(address)
              if (url.port) {
                port = url.port
              }
            } catch (e) {
              // pass
            }
            const protocols = formValue['protocols']?.[0] || {}
            protocols.port = port
          }
        },
        username_selector: {
          hidden: (formValue) => formValue['autofill'] !== 'basic'
        },
        password_selector: {
          hidden: (formValue) => formValue['autofill'] !== 'basic'
        },
        submit_selector: {
          hidden: (formValue) => formValue['autofill'] !== 'basic'
        },
        interactive_selector: {
          required: false,
          rules: [],
          hidden: (formValue) => !this.$hasLicense() || formValue['autofill'] !== 'basic'
        },
        success_selector: {
          required: false,
          rules: [],
          hidden: (formValue) => !this.$hasLicense() || formValue['autofill'] !== 'basic'
        },
        script: {
          helpText: this.$t('WebScriptStepsHelp'),
          hidden: (formValue) => !this.$hasLicense() || formValue['autofill'] !== 'script'
        }
      }
    }
  }
}
</script>

<style></style>
