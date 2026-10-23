<template>
  <Page>
    <div v-if="$hasPerm('rbac.view_console')">
      <Announcement />
      <MultiDashboardHost section-scope="console" :builtin-title="$t('ConsoleDashboard')">
        <ProtectionStatus class="protection-status" />
        <ConsoleReport :nav="false" :only-charts="true" />
      </MultiDashboardHost>
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
import MultiDashboardHost from '@/components/Dashboard/MultiDashboardHost.vue'

export default {
  name: 'Dashboard',
  components: {
    Page,
    Announcement,
    Page403,
    ConsoleReport,
    ProtectionStatus,
    MultiDashboardHost
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
