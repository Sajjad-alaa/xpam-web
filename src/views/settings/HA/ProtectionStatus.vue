<template>
  <el-card v-if="data" shadow="never" class="protection">
    <div class="protection-grid">
      <div v-if="showHa" class="protection-item">
        <div class="protection-head">
          <b>{{ $t('HighAvailability') }}</b>
          <el-tag :type="haType" effect="dark" size="small">{{ haText }}</el-tag>
        </div>
        <template v-if="ha.enabled">
          <div class="protection-row">
            <span>{{ $t('HATopology') }}</span>
            <span
              >{{
                ha.topology === 'active-active' ? $t('HAActiveActive') : $t('HAActivePassive')
              }}
              · {{ ha.servers }}</span
            >
          </div>
          <div class="protection-row">
            <span>{{ $t('HAPrimary') }}</span
            ><span>{{ ha.primary || '-' }}</span>
          </div>
          <div class="protection-row">
            <span>{{ $t('HAThisServer') }}</span
            ><span>{{ ha.this_node }} ({{ roleText }})</span>
          </div>
          <div class="protection-row">
            <span>{{ $t('HASyncStandby') }}</span>
            <el-tag :type="ha.standby_in_sync ? 'success' : 'danger'" size="small">
              {{ ha.standby_in_sync ? $t('Yes') : $t('No') }}
            </el-tag>
          </div>
          <div
            v-if="ha.witness_reachable !== null && ha.witness_reachable !== undefined"
            class="protection-row"
          >
            <span>{{ $t('HAWitness') }}</span>
            <el-tag :type="ha.witness_reachable ? 'success' : 'danger'" size="small">
              {{ ha.witness_reachable ? $t('HAReachable') : $t('HANotReachable') }}
            </el-tag>
          </div>
        </template>
        <p v-else class="protection-help">{{ $t('ProtectionHAOffHelp') }}</p>
        <el-link v-if="link" type="primary" @click="go('/settings/high-availability')">
          {{ ha.enabled ? $t('ProtectionDetails') : $t('ProtectionHowToEnable') }}
        </el-link>
      </div>

      <div v-if="showVault" class="protection-item">
        <div class="protection-head">
          <b>Vault</b>
          <el-tag :type="vaultType" effect="dark" size="small">{{ vaultText }}</el-tag>
        </div>
        <div class="protection-row">
          <span>{{ $t('ProtectionXpamSecrets') }}</span>
          <el-tag :type="vault.secrets_from_vault ? 'success' : 'warning'" size="small">
            {{ vault.secrets_from_vault ? $t('ProtectionInVault') : $t('ProtectionOnServer') }}
          </el-tag>
        </div>
        <div class="protection-row">
          <span>{{ $t('ProtectionAccountSecrets') }}</span>
          <span v-if="vault.account_storage">
            {{ vault.account_storage_name }}
            <el-tag
              v-if="vault.check && vault.check.ok !== null"
              :type="vault.check.ok ? 'success' : 'danger'"
              size="small"
              :title="vault.check.error"
            >
              {{ vault.check.ok ? $t('HAReachable') : $t('HANotReachable') }}
            </el-tag>
          </span>
          <span v-else>{{ $t('ProtectionInDatabase') }}</span>
        </div>
        <div v-if="vault.keep_db_copy" class="protection-row">
          <span>{{ $t('ProtectionDbCopy') }}</span
          ><span>{{ $t('ProtectionDbCopyOn') }}</span>
        </div>
        <div class="protection-row">
          <span>{{ $t('ProtectionDataKey') }}</span
          ><span>{{ dataKeyText }}</span>
        </div>
        <div v-if="vault.locked" class="protection-row">
          <span>{{ $t('ProtectionSettings') }}</span
          ><span>{{ $t('ProtectionManagedOnServer') }}</span>
        </div>
        <p v-if="!vault.enabled" class="protection-help">
          {{ $t('ProtectionVaultOffHelp') }}
          <code>xpamctl vault local</code> · <code>xpamctl vault connect &lt;bundle&gt;</code>
        </p>
        <el-link
          v-if="link && $hasPerm('settings.change_vault')"
          type="primary"
          @click="go('/settings/features?tab=Vault')"
        >
          {{ vault.enabled ? $t('ProtectionDetails') : $t('ProtectionHowToEnable') }}
        </el-link>
      </div>
    </div>
  </el-card>
</template>

<script>
// XPAM: high availability and Vault on or off, at a glance (dashboard, High availability, Account storage)
export default {
  name: 'ProtectionStatus',
  props: {
    // show the links to the settings pages
    link: { type: Boolean, default: true },
    // (a page that shows one of them in detail leaves it out)
    showHa: { type: Boolean, default: true },
    showVault: { type: Boolean, default: true }
  },
  data() {
    return { data: null }
  },
  computed: {
    ha() {
      return this.data?.ha || {}
    },
    vault() {
      return this.data?.vault || {}
    },
    haText() {
      if (!this.ha.enabled) return this.$t('ProtectionOff')
      return this.ha.alerts || !this.ha.agent_reporting
        ? this.$t('ProtectionAttention')
        : this.$t('ProtectionOn')
    },
    haType() {
      if (!this.ha.enabled) return 'warning'
      return this.ha.alerts || !this.ha.agent_reporting ? 'warning' : 'success'
    },
    vaultText() {
      if (!this.vault.enabled) return this.$t('ProtectionOff')
      return this.vault.check?.ok === false
        ? this.$t('ProtectionAttention')
        : this.$t('ProtectionOn')
    },
    vaultType() {
      if (!this.vault.enabled) return 'warning'
      return this.vault.check?.ok === false ? 'danger' : 'success'
    },
    roleText() {
      return { primary: this.$t('HAPrimary'), standby: this.$t('HAStandby') }[this.ha.role] || '-'
    },
    dataKeyText() {
      return (
        {
          transit: this.$t('ProtectionDataKeyTransit'),
          local: this.$t('ProtectionDataKeyLocal'),
          legacy: this.$t('ProtectionDataKeyLegacy')
        }[this.vault.data_key] || '-'
      )
    }
  },
  mounted() {
    if (this.$hasPerm('settings.view_setting')) this.load()
  },
  methods: {
    load() {
      this.$axios
        .get('/api/v1/settings/protection/')
        .then((data) => {
          this.data = data
        })
        .catch(() => {}) // (the card stays hidden)
    },
    go(path) {
      this.$router.push(path)
    }
  }
}
</script>

<style scoped>
.protection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.protection-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.protection-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.protection-help {
  margin: 4px 0 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.protection-help code {
  font-size: 12px;
}
</style>
