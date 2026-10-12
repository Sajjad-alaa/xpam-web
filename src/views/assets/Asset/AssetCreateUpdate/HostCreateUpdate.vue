<template>
  <BaseAssetCreateUpdate v-bind="$data" />
</template>

<script>
import BaseAssetCreateUpdate from './BaseAssetCreateUpdate'

const REMOTE_APP_PLATFORM = 'Windows-RemoteApp'

const platformIdOf = (value) => value?.pk ?? value?.id ?? value?.value ?? value

export default {
  name: 'HostCreateUpdate',
  components: { BaseAssetCreateUpdate },
  data() {
    // RemoteApp fields only apply to the Windows-RemoteApp platform
    const notRemoteApp = (form) =>
      !this.remoteAppPlatformId ||
      String(platformIdOf(form?.platform)) !== String(this.remoteAppPlatformId)
    return {
      url: '/api/v1/assets/hosts/',
      remoteAppPlatformId: null,
      addFields: [[this.$t('RemoteApp'), ['remote_app', 'remote_app_dir', 'remote_app_args'], 2]],
      addFieldsMeta: {
        remote_app: {
          label: this.$t('RemoteAppProgram'),
          helpText: this.$t('RemoteAppProgramHelpText'),
          el: { placeholder: '||qgis-bin   or   C:\\Program Files\\App\\app.exe' },
          hidden: notRemoteApp
        },
        remote_app_dir: {
          label: this.$t('RemoteAppWorkingDirectory'),
          el: { placeholder: 'C:\\Program Files\\App' },
          hidden: notRemoteApp
        },
        remote_app_args: {
          label: this.$t('RemoteAppArguments'),
          el: { placeholder: this.$t('RemoteAppArgumentsPlaceholder') },
          hidden: notRemoteApp
        }
      }
    }
  },
  async created() {
    try {
      const platform = await this.$axios.get(`/api/v1/assets/platforms/${REMOTE_APP_PLATFORM}/`, {
        disableFlashErrorMsg: true
      })
      this.remoteAppPlatformId = platform?.id ?? null
    } catch {
      this.remoteAppPlatformId = null
    }
  }
}
</script>
