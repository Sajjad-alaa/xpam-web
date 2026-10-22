<template>
  <Page>
    <div v-if="$hasPerm('rbac.view_console')">
      <Announcement />
      <ProtectionStatus class="protection-status" />
      <ConsoleReport :nav="false" :only-charts="true" />
    </div>
    <Page403 v-else />
  </Page>
</template>

<script>
import { Announcement } from '@/components'
import { Page } from '@/layout/components'
import Page403 from '@/views/403'
import ConsoleReport from '@/views/reports/console/index.vue'
import ProtectionStatus from '@/views/settings/HA/ProtectionStatus.vue'

export default {
  name: 'Dashboard',
  components: {
    Page,
    Announcement,
    Page403,
    ConsoleReport,
    ProtectionStatus
  },
  data() {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.protection-status {
  margin-bottom: 12px;
}
</style>
