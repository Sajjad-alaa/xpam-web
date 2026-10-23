<template>
  <div class="cd-widget-body">
    <div v-if="!allowed" class="cd-widget-denied">
      <i class="fa fa-lock" />
      <span>{{ $t('NoPermission') || 'You do not have permission to view this widget' }}</span>
    </div>

    <ProtectionStatus v-else-if="widget === 'protection_status'" :key="renderKey" />

    <RealTimeSummary
      v-else-if="widget === 'console_realtime'"
      :key="renderKey"
      class="dashboard-panel"
    />

    <ConsoleDataSummary v-else-if="widget === 'console_data_summary'" :key="renderKey" />

    <UserAssetActivity
      v-else-if="widget === 'console_user_asset_activity'"
      :key="renderKey"
      class="dashboard-panel"
    />

    <ConsoleAssetProportion
      v-else-if="widget === 'console_asset_proportion'"
      :key="renderKey"
      url="/api/v1/index/?total_count_type_to_assets_amount=1"
      class="dashboard-panel"
    />

    <RankSummary v-else-if="widget === 'console_rank_summary'" :key="renderKey" />

    <div v-else-if="widget === 'jit_zsp_overview'" :key="renderKey" class="cd-jit-overview">
      <JITDashboard />
    </div>

    <div
      v-else-if="widget === 'jit_standing_converter'"
      :key="renderKey"
      class="cd-jit-standing-only"
    >
      <JITDashboard />
    </div>

    <PamDataSummary v-else-if="widget === 'pam_data_summary'" :key="renderKey" />

    <MissionSummery
      v-else-if="widget === 'pam_mission_summary'"
      :key="renderKey"
      class="dashboard-panel"
    />

    <AccountSecretSummary
      v-else-if="widget === 'pam_secret_rotation'"
      :key="renderKey"
      class="dashboard-panel cd-pam-secret"
    />

    <RiskSummary
      v-else-if="widget === 'pam_risk_summary'"
      :key="renderKey"
      class="dashboard-panel"
    />

    <PamAssetProportion
      v-else-if="widget === 'pam_account_proportion'"
      :key="renderKey"
      url="/api/v1/accounts/pam-dashboard/?total_count_type_to_accounts=1"
      class="dashboard-panel"
    />

    <AuditCardSummary
      v-else-if="widget === 'audit_card_summary'"
      :key="renderKey"
      :days="String(days)"
    />

    <el-row v-else-if="widget === 'audit_session_charts'" :key="renderKey" :gutter="12">
      <el-col :md="12" :sm="24">
        <AuditDataSummary class="dashboard-panel" :days="String(days)" />
      </el-col>
      <el-col :md="12" :sm="24">
        <AuditRightSummary class="dashboard-panel" :days="String(days)" />
      </el-col>
    </el-row>

    <AuditTrendSummary
      v-else-if="widget === 'audit_trend_summary'"
      :key="renderKey"
      :days="String(days)"
    />
  </div>
</template>

<script>
import ProtectionStatus from '@/views/settings/HA/ProtectionStatus.vue'
import RealTimeSummary from '@/components/Dashboard/RealTimeSummary.vue'
import ConsoleDataSummary from '@/views/reports/console/DataSummary.vue'
import UserAssetActivity from '@/views/reports/console/UserAssetActivity.vue'
import ConsoleAssetProportion from '@/views/reports/console/AssetProportionSummary.vue'
import RankSummary from '@/views/reports/console/RankSummary.vue'
import JITDashboard from '@/views/accounts/JIT/JITDashboard.vue'
import PamDataSummary from '@/views/reports/pam/Dashboard/DataSummary.vue'
import MissionSummery from '@/views/reports/pam/Dashboard/MissionSummery.vue'
import AccountSecretSummary from '@/views/reports/pam/ChangeSecret/AccountSummary.vue'
import RiskSummary from '@/views/reports/pam/Dashboard/RiskSummary.vue'
import PamAssetProportion from '@/views/reports/pam/Dashboard/AssetProportionSummary.vue'
import AuditCardSummary from '@/views/reports/audits/components/CardSummary.vue'
import AuditDataSummary from '@/views/reports/audits/components/DataSummary.vue'
import AuditRightSummary from '@/views/reports/audits/components/RightSummary.vue'
import AuditTrendSummary from '@/views/reports/audits/components/TrendSummary.vue'

export default {
  name: 'CustomDashboardWidget',
  components: {
    ProtectionStatus,
    RealTimeSummary,
    ConsoleDataSummary,
    UserAssetActivity,
    ConsoleAssetProportion,
    RankSummary,
    JITDashboard,
    PamDataSummary,
    MissionSummery,
    AccountSecretSummary,
    RiskSummary,
    PamAssetProportion,
    AuditCardSummary,
    AuditDataSummary,
    AuditRightSummary,
    AuditTrendSummary
  },
  props: {
    widget: { type: String, required: true },
    days: { type: [Number, String], default: 7 },
    refreshKey: { type: Number, default: 0 },
    allowed: { type: Boolean, default: true }
  },
  computed: {
    renderKey() {
      return `${this.widget}_${this.days}_${this.refreshKey}`
    }
  }
}
</script>

<style lang="scss" scoped>
.cd-widget-body {
  width: 100%;
}

.cd-widget-denied {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  padding: 20px;
  border-radius: 8px;
  background: var(--page-background-color, #fff);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.cd-jit-overview :deep(.zsp-standing) {
  display: none;
}

.cd-jit-standing-only :deep(.zsp-head),
.cd-jit-standing-only :deep(.zsp-cards),
.cd-jit-standing-only :deep(.zsp-grid) {
  display: none;
}

.cd-pam-secret :deep(.echarts) {
  height: 16rem;
}
</style>
