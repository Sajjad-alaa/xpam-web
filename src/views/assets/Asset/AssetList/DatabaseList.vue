<template>
  <BaseList v-bind="config" />
</template>

<script>
import BaseList from './components/BaseList'

export default {
  components: {
    BaseList
  },
  data() {
    return {
      config: {
        category: 'database',
        url: '/api/v1/assets/databases/',
        // XPAM: no Cloud Sync button (that upstream enterprise feature has no API in XPAM)
        helpMessage: this.$t('DatabaseConnectivityTestHelpMessage')
      }
    }
  }
}
</script>
