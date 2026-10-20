<template>
  <BaseAssetCreateUpdate v-bind="$data" />
</template>

<script>
import BaseAssetCreateUpdate from './BaseAssetCreateUpdate'

export default {
  name: 'DeviceCreateUpdate',
  components: { BaseAssetCreateUpdate },
  data() {
    return {
      url: '/api/v1/assets/devices/',
      addFieldsMeta: {
        accounts: {
          // XPAM: account push, discovery and just-in-time accounts sign in with the device's admin account
          helpText: this.$t('DeviceAccountsHelp')
        }
      }
    }
  }
}
</script>

<style></style>
