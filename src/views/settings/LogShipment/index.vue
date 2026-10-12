<template>
  <Page>
    <div class="log-shipment-container">
      <!-- Section 1: Global Log Shipment Master Switch & Health Overview -->
      <IBox :title="$t('LogShipment') || 'Log Shipment to SIEM / Rsyslog'" class="section-card">
        <div class="master-switch-row">
          <div class="master-switch-info">
            <div class="switch-title-row">
              <span class="master-title">{{
                $t('EnableLogShipment') || 'Enable Log Shipment'
              }}</span>
              <el-tag :type="enabled ? 'success' : 'info'" size="small">
                {{ enabled ? $t('Active') || 'Active' : $t('Disabled') || 'Disabled' }}
              </el-tag>
              <el-tag
                v-if="enabled"
                size="small"
                type="success"
                effect="plain"
                class="live-monitoring-badge"
              >
                <span class="live-pulse-dot" />
                {{ $t('RealtimeMonitoringActive') || 'Live Health Monitor (10s)' }}
              </el-tag>
            </div>
            <div class="master-desc">
              {{
                $t('LogShipmentDesc') ||
                'Automatically ship audit logs (User Logins, Administrative Operations, Session Commands, Host Sessions) to multiple SIEM or Rsyslog endpoints with non-blocking asynchronous delivery and circuit breaker protection.'
              }}
            </div>
          </div>
          <div class="master-switch-control">
            <el-button type="primary" size="default" class="m-r-md" @click="openCreateDialog">
              <i class="fa fa-plus m-r-xs" />
              {{ $t('AddDestination') || 'Add Destination' }}
            </el-button>
            <el-switch
              v-model="enabled"
              size="large"
              :loading="savingGlobal"
              @change="handleGlobalToggle"
            />
          </div>
        </div>

        <!-- Metrics Overview -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-icon total">
              <i class="fa fa-cubes" />
            </div>
            <div class="metric-body">
              <div class="metric-value">{{ destinations.length }}</div>
              <div class="metric-label">{{ $t('TotalDestinations') || 'Total Destinations' }}</div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon healthy">
              <i class="fa fa-check-circle" />
            </div>
            <div class="metric-body">
              <div class="metric-value">{{ healthyCount }}</div>
              <div class="metric-label">{{ $t('HealthyEndpoints') || 'Healthy & Online' }}</div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon unreachable">
              <i class="fa fa-exclamation-triangle" />
            </div>
            <div class="metric-body">
              <div class="metric-value" :class="{ 'has-warning': unreachableCount > 0 }">
                {{ unreachableCount }}
              </div>
              <div class="metric-label">
                {{ $t('UnreachableEndpoints') || 'Unreachable / Warning' }}
              </div>
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-icon shield">
              <i class="fa fa-shield" />
            </div>
            <div class="metric-body">
              <div class="metric-value">{{ $t('Resilient') || 'Active' }}</div>
              <div class="metric-label">
                {{ $t('FaultTolerantEngine') || 'Circuit Breaker Spooling' }}
              </div>
            </div>
          </div>
        </div>
      </IBox>

      <!-- Section 2: Destinations Management -->
      <IBox :title="$t('ShipmentDestinations') || 'Configured Destinations'" class="section-card">
        <template #tools>
          <div class="header-action-tools">
            <el-button
              size="small"
              type="primary"
              plain
              :loading="checkingHealthAll"
              @click="runRealtimeHealthCheck"
            >
              <i class="fa fa-heartbeat m-r-xs" />
              {{ $t('RealtimeHealthCheck') || 'Run Realtime Check' }}
            </el-button>
            <el-button size="small" :loading="loading" @click="fetchData">
              <i class="fa fa-refresh m-r-xs" />
              {{ $t('RefreshStatus') || 'Refresh Status' }}
            </el-button>
            <el-button type="primary" size="small" @click="openCreateDialog">
              <i class="fa fa-plus m-r-xs" />
              {{ $t('AddDestination') || 'Add Destination' }}
            </el-button>
          </div>
        </template>

        <!-- Empty State -->
        <div v-if="!loading && destinations.length === 0" class="empty-destinations">
          <div class="empty-icon-wrap">
            <i class="fa fa-server" />
          </div>
          <div class="empty-title">
            {{ $t('NoDestinationsConfigured') || 'No Log Shipment Destinations' }}
          </div>
          <div class="empty-desc">
            {{
              $t('NoDestinationsTip') ||
              'Configure one or multiple SIEM or rsyslog servers (e.g. Splunk, QRadar, Wazuh, Logstash) to start streaming security logs in real-time.'
            }}
          </div>
          <el-button type="primary" class="m-t-md" @click="openCreateDialog">
            <i class="fa fa-plus m-r-xs" />
            {{ $t('AddFirstDestination') || 'Add First Destination' }}
          </el-button>
        </div>

        <!-- Destinations Cards Grid -->
        <div v-else class="destinations-grid">
          <div
            v-for="dest in destinations"
            :key="dest.id"
            class="dest-card"
            :class="{
              'is-disabled': !dest.enabled,
              'is-unreachable': dest.enabled && dest.status === 'unreachable'
            }"
          >
            <!-- Card Header -->
            <div class="dest-card-header">
              <div class="dest-name-row">
                <span class="dest-name">{{ dest.name }}</span>
                <span
                  class="status-indicator"
                  :class="getStatusClass(dest)"
                  :title="getStatusTitle(dest)"
                >
                  <span class="status-dot" />
                  {{ getStatusLabel(dest) }}
                </span>
                <span
                  v-if="dest.enabled && dest.status === 'healthy' && dest.latency_ms"
                  class="badge-latency"
                  title="Network Round-Trip Latency"
                >
                  <i class="fa fa-bolt m-r-xs" />{{ dest.latency_ms }} ms
                </span>
              </div>
              <div class="dest-switch">
                <el-switch
                  v-model="dest.enabled"
                  size="small"
                  @change="handleDestinationEnableToggle(dest)"
                />
              </div>
            </div>

            <!-- Card Address & Protocol Badges -->
            <div class="dest-badges-row">
              <span class="badge-address">
                <i class="fa fa-map-marker m-r-xs" />
                {{ dest.host }}:{{ dest.port }}
              </span>
              <el-tag
                size="small"
                :type="
                  dest.protocol === 'TLS'
                    ? 'success'
                    : dest.protocol === 'TCP'
                      ? 'primary'
                      : 'warning'
                "
              >
                {{ dest.protocol }}
              </el-tag>
              <el-tag size="small" type="info">
                {{ dest.format }}
              </el-tag>
              <el-tag size="small" type="info" class="hidden-xs">
                {{ dest.facility }}.{{ dest.severity }}
              </el-tag>
            </div>

            <!-- Subscribed Log Types -->
            <div class="dest-logs-row">
              <span class="log-label">{{ $t('SubscribedLogs') || 'Subscribed:' }}</span>
              <div class="log-pills">
                <template v-if="dest.log_types && dest.log_types.length > 0">
                  <span v-for="lt in dest.log_types" :key="lt" class="log-pill">
                    {{ getLogTypeLabel(lt) }}
                  </span>
                </template>
                <span v-else class="log-pill all">{{
                  $t('AllAuditLogs') || 'All Audit Logs'
                }}</span>
              </div>
            </div>

            <!-- Unreachable Warning Notice -->
            <div v-if="dest.enabled && dest.status === 'unreachable'" class="unreachable-notice">
              <div class="notice-header">
                <div class="notice-title">
                  <i class="fa fa-exclamation-triangle" />
                  {{ $t('EndpointUnreachable') || 'Destination Unreachable & Offline' }}
                </div>
                <el-button
                  size="small"
                  type="warning"
                  plain
                  :loading="testingId === dest.id"
                  class="recheck-btn"
                  @click="handleTestDestination(dest)"
                >
                  <i class="fa fa-refresh m-r-xs" />
                  {{ $t('Recheck') || 'Recheck' }}
                </el-button>
              </div>
              <div class="notice-detail">
                {{ dest.last_error || 'Connection timed out, refused or DNS failed' }}
              </div>
              <div class="notice-cooldown">
                <i class="fa fa-shield m-r-xs" />
                {{
                  $t('CircuitBreakerCooldownNotice') ||
                  'Circuit breaker active: logs are safely spooled in-memory until endpoint recovers.'
                }}
                <span v-if="dest.spooled_count" class="spooled-count"
                  >({{ dest.spooled_count }} spooled)</span
                >
              </div>
              <div v-if="dest.last_checked_at" class="notice-time">
                <i class="fa fa-clock-o m-r-xs" /> {{ $t('Checked') || 'Checked:' }}
                {{ dest.last_checked_at }}
              </div>
            </div>

            <!-- Healthy Notice -->
            <div v-else-if="dest.enabled && dest.status === 'healthy'" class="healthy-notice">
              <div class="healthy-header">
                <span class="healthy-text">
                  <i class="fa fa-check-circle m-r-xs" />
                  {{ $t('EndpointHealthy') || 'Reachable & Healthy' }}
                </span>
                <span v-if="dest.last_checked_at" class="checked-time">
                  <i class="fa fa-clock-o m-r-xs" /> {{ dest.last_checked_at }}
                </span>
              </div>
              <div v-if="dest.last_sent_at" class="healthy-sent">
                <i class="fa fa-paper-plane-o m-r-xs" />
                {{ $t('LastShippedAt') || 'Last shipped:' }} {{ dest.last_sent_at }}
              </div>
            </div>

            <!-- Card Actions Footer -->
            <div class="dest-card-footer">
              <el-button
                size="small"
                :loading="testingId === dest.id"
                @click="handleTestDestination(dest)"
              >
                <i class="fa fa-plug m-r-xs" />
                {{ $t('TestConnection') || 'Test Connection' }}
              </el-button>
              <div class="right-actions">
                <el-button size="small" @click="openEditDialog(dest)">
                  <i class="fa fa-pencil" />
                </el-button>
                <el-popconfirm
                  :title="
                    $t('ConfirmDeleteDestination') ||
                    'Are you sure you want to delete this destination?'
                  "
                  @confirm="handleDeleteDestination(dest)"
                >
                  <template #reference>
                    <el-button size="small" type="danger" plain>
                      <i class="fa fa-trash" />
                    </el-button>
                  </template>
                </el-popconfirm>
              </div>
            </div>
          </div>

          <!-- Add Destination Card in Grid -->
          <div class="dest-card dest-card-add" @click="openCreateDialog">
            <div class="dest-add-inner">
              <div class="dest-add-icon">
                <i class="fa fa-plus" />
              </div>
              <div class="dest-add-title">{{ $t('AddDestination') || 'Add Destination' }}</div>
              <div class="dest-add-desc">
                {{ $t('ConfigureAnotherEndpoint') || 'Configure another SIEM or Syslog endpoint' }}
              </div>
            </div>
          </div>
        </div>
      </IBox>

      <!-- Section 3: Add / Edit Destination Dialog -->
      <el-dialog
        v-model="dialogVisible"
        :title="
          isEditing
            ? $t('EditDestination') || 'Edit Log Shipment Destination'
            : $t('AddDestination') || 'Add Log Shipment Destination'
        "
        width="650px"
        destroy-on-close
      >
        <el-form
          ref="destFormRef"
          :model="form"
          :rules="formRules"
          label-position="top"
          class="dest-form"
        >
          <el-row :gutter="16">
            <el-col :span="24">
              <el-form-item :label="$t('DestinationName') || 'Destination Name'" prop="name">
                <el-input
                  v-model="form.name"
                  :placeholder="
                    $t('DestinationNamePlaceholder') ||
                    'e.g. Splunk Production Cluster, Internal Rsyslog 01'
                  "
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="16">
              <el-form-item :label="$t('HostAddress') || 'Server Host / IP'" prop="host">
                <el-input
                  v-model="form.host"
                  :placeholder="$t('HostPlaceholder') || 'e.g. 192.168.1.100 or siem.corp.internal'"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('Port') || 'Port'" prop="port">
                <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="$t('Protocol') || 'Transport Protocol'" prop="protocol">
                <el-select v-model="form.protocol" style="width: 100%">
                  <el-option
                    v-for="p in meta.protocols"
                    :key="p.value"
                    :label="p.label"
                    :value="p.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('LogFormat') || 'Syslog / SIEM Format'" prop="format">
                <el-select v-model="form.format" style="width: 100%">
                  <el-option
                    v-for="f in meta.formats"
                    :key="f.value"
                    :label="f.label"
                    :value="f.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item :label="$t('SyslogFacility') || 'Syslog Facility'" prop="facility">
                <el-select v-model="form.facility" style="width: 100%">
                  <el-option
                    v-for="fac in meta.facilities"
                    :key="fac.value"
                    :label="fac.label"
                    :value="fac.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('SyslogSeverity') || 'Default Severity'" prop="severity">
                <el-select v-model="form.severity" style="width: 100%">
                  <el-option
                    v-for="s in meta.severities"
                    :key="s.value"
                    :label="s.label"
                    :value="s.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('SubscribedLogCategories') || 'Subscribed Log Categories'">
            <el-checkbox-group v-model="form.log_types" class="log-types-checkbox-grid">
              <el-checkbox v-for="lt in meta.log_types" :key="lt.value" :value="lt.value">
                {{ lt.label }}
              </el-checkbox>
            </el-checkbox-group>
            <div class="form-tip">
              {{
                $t('SubscribedLogsTip') ||
                'Select the types of events to stream. If none selected, all logs are shipped.'
              }}
            </div>
          </el-form-item>

          <el-row v-if="form.protocol === 'TLS'" :gutter="16">
            <el-col :span="24">
              <el-form-item>
                <el-checkbox v-model="form.verify_ssl">
                  {{
                    $t('VerifySSLCert') ||
                    'Verify TLS / SSL Certificate (uncheck for internal self-signed SIEMs)'
                  }}
                </el-checkbox>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item>
            <el-checkbox v-model="form.enabled">
              {{ $t('EnableThisDestination') || 'Enable this destination' }}
            </el-checkbox>
          </el-form-item>

          <!-- In-Dialog Probe Test Result Banner -->
          <div
            v-if="probeResult"
            class="probe-result-banner"
            :class="probeResult.ok ? 'is-success' : 'is-error'"
          >
            <div class="probe-header">
              <i :class="probeResult.ok ? 'fa fa-check-circle' : 'fa fa-times-circle'" />
              <span>{{
                probeResult.ok
                  ? $t('ConnectionSuccess') || 'Connection Verified'
                  : $t('ConnectionFailed') || 'Connection Failed / Unreachable'
              }}</span>
              <span v-if="probeResult.latency_ms" class="probe-latency"
                >({{ probeResult.latency_ms }} ms)</span
              >
            </div>
            <div class="probe-msg">{{ probeResult.message || probeResult.error }}</div>
          </div>
        </el-form>

        <template #footer>
          <div class="dialog-footer-actions">
            <el-button :loading="probing" @click="handleProbeInDialog">
              <i class="fa fa-plug m-r-xs" />
              {{ $t('TestReachabilityNow') || 'Test Reachability' }}
            </el-button>
            <div class="right-footer-btns">
              <el-button @click="dialogVisible = false">{{ $t('Cancel') || 'Cancel' }}</el-button>
              <el-button type="primary" :loading="saving" @click="handleSaveDestination">
                {{ $t('SaveDestination') || 'Save Destination' }}
              </el-button>
            </div>
          </div>
        </template>
      </el-dialog>
    </div>
  </Page>
</template>

<script>
import { IBox } from '@/components'
import { Page } from '@/layout/components'
import {
  getLogShipmentSettings,
  updateLogShipmentSettings,
  testLogShipmentProbe,
  testDestinationById,
  checkLogShipmentHealth
} from '@/api/logShipment'

export default {
  name: 'LogShipmentSettings',
  components: {
    IBox,
    Page
  },
  data() {
    return {
      loading: true,
      savingGlobal: false,
      saving: false,
      probing: false,
      testingId: null,
      checkingHealthAll: false,
      monitoringTimer: null,
      enabled: false,
      destinations: [],
      meta: {
        protocols: [
          { value: 'UDP', label: 'UDP (Fast, Stateless)' },
          { value: 'TCP', label: 'TCP (Reliable, Connection-oriented)' },
          { value: 'TLS', label: 'TCP + TLS (Encrypted Syslog)' }
        ],
        formats: [
          { value: 'RFC5424', label: 'RFC 5424 (Structured IETF Syslog)' },
          { value: 'RFC3164', label: 'RFC 3164 (Standard BSD Syslog)' },
          { value: 'CEF', label: 'CEF (Common Event Format for SIEM)' },
          { value: 'JSON', label: 'JSON (Elasticsearch / Wazuh / OpenSearch)' }
        ],
        facilities: [
          { value: 'user', label: 'user' },
          { value: 'local0', label: 'local0' },
          { value: 'local1', label: 'local1' },
          { value: 'local2', label: 'local2' },
          { value: 'local3', label: 'local3' },
          { value: 'local4', label: 'local4' },
          { value: 'local5', label: 'local5' },
          { value: 'local6', label: 'local6' },
          { value: 'local7', label: 'local7' },
          { value: 'auth', label: 'auth' },
          { value: 'daemon', label: 'daemon' }
        ],
        severities: [
          { value: 'info', label: 'info' },
          { value: 'notice', label: 'notice' },
          { value: 'warning', label: 'warning' },
          { value: 'err', label: 'err' },
          { value: 'debug', label: 'debug' }
        ],
        log_types: [
          { value: 'login_log', label: 'User Login Logs' },
          { value: 'operation_log', label: 'Administrative & Resource Operation Logs' },
          { value: 'session_command_log', label: 'Session Command Execution Logs' },
          { value: 'host_session_log', label: 'Asset Host Session Connections' },
          { value: 'password_change_log', label: 'Password Change Logs' },
          { value: 'ftp_log', label: 'FTP / SFTP File Transfer Logs' }
        ]
      },
      dialogVisible: false,
      isEditing: false,
      editingIndex: -1,
      probeResult: null,
      form: {
        id: '',
        name: '',
        host: '',
        port: 514,
        protocol: 'UDP',
        format: 'RFC5424',
        facility: 'user',
        severity: 'info',
        log_types: ['login_log', 'operation_log', 'session_command_log', 'host_session_log'],
        verify_ssl: false,
        enabled: true
      },
      formRules: {
        name: [{ required: true, message: 'Please enter a destination name', trigger: 'blur' }],
        host: [
          { required: true, message: 'Please enter server hostname or IP address', trigger: 'blur' }
        ],
        port: [{ required: true, message: 'Please enter port', trigger: 'change' }]
      }
    }
  },
  computed: {
    healthyCount() {
      return this.destinations.filter((d) => d.enabled && d.status === 'healthy').length
    },
    unreachableCount() {
      return this.destinations.filter((d) => d.enabled && d.status === 'unreachable').length
    }
  },
  async mounted() {
    await this.fetchData()
    if (this.enabled) {
      await this.runRealtimeHealthCheck()
    }
    this.startRealtimeMonitoring()
  },
  beforeUnmount() {
    this.stopRealtimeMonitoring()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        const res = await getLogShipmentSettings()
        if (res) {
          this.enabled = !!res.enabled
          this.destinations = res.destinations || []
          if (res.meta) {
            this.meta = { ...this.meta, ...res.meta }
          }
        }
      } catch (e) {
        this.$message.error('Failed to load log shipment settings')
      } finally {
        this.loading = false
      }
    },
    async handleGlobalToggle(val) {
      this.savingGlobal = true
      try {
        const res = await updateLogShipmentSettings({
          enabled: val,
          destinations: this.destinations
        })
        if (res?.destinations) {
          this.destinations = res.destinations
        }
        if (val) {
          this.$message.success('Log shipment enabled. Performing realtime health check...')
          await this.runRealtimeHealthCheck()
          this.startRealtimeMonitoring()
        } else {
          this.$message.info('Log shipment disabled')
          this.stopRealtimeMonitoring()
        }
      } catch (e) {
        this.enabled = !val
        this.$message.error('Failed to update status')
      } finally {
        this.savingGlobal = false
      }
    },
    async handleDestinationEnableToggle(dest) {
      try {
        await updateLogShipmentSettings({
          enabled: this.enabled,
          destinations: this.destinations
        })
        if (dest.enabled) {
          this.testingId = dest.id
          try {
            const hcRes = await testDestinationById(dest.id)
            if (hcRes?.ok) {
              dest.status = 'healthy'
              dest.latency_ms = hcRes.latency_ms || 1.0
              dest.last_error = ''
              dest.last_checked_at = new Date().toLocaleTimeString()
              this.$message.success(
                `Destination '${dest.name}' enabled & reachable (${dest.latency_ms}ms)`
              )
            } else {
              dest.status = 'unreachable'
              dest.last_error = hcRes?.error || 'Destination unreachable'
              dest.last_checked_at = new Date().toLocaleTimeString()
              this.$message.warning(
                `Destination '${dest.name}' enabled, but unreachable: ${dest.last_error}`
              )
            }
          } catch (err) {
            dest.status = 'unreachable'
            dest.last_error = err?.message || 'Connection probe failed'
            this.$message.warning(
              `Destination '${dest.name}' enabled, but unreachable: ${dest.last_error}`
            )
          } finally {
            this.testingId = null
          }
        } else {
          dest.status = 'disabled'
          dest.last_error = ''
          this.$message.info(`Destination '${dest.name}' disabled`)
        }
      } catch (e) {
        dest.enabled = !dest.enabled
        this.$message.error('Failed to update destination')
      }
    },
    async runRealtimeHealthCheck() {
      this.checkingHealthAll = true
      try {
        const res = await checkLogShipmentHealth()
        if (res?.destinations) {
          this.destinations = res.destinations
          if (res.unreachable_count > 0) {
            this.$message.warning(
              `Realtime check complete: ${res.healthy_count} healthy, ${res.unreachable_count} unreachable endpoint(s)`
            )
          } else if (res.healthy_count > 0) {
            this.$message.success(
              `Realtime check complete: All ${res.healthy_count} endpoint(s) healthy & online`
            )
          }
        }
      } catch (err) {
        this.$message.error('Realtime health check failed')
      } finally {
        this.checkingHealthAll = false
      }
    },
    async pollHealthStatus() {
      try {
        const res = await checkLogShipmentHealth()
        if (res?.destinations && Array.isArray(res.destinations)) {
          res.destinations.forEach((updated) => {
            const found = this.destinations.find((d) => d.id === updated.id)
            if (found) {
              found.status = updated.status
              found.latency_ms = updated.latency_ms
              found.last_error = updated.last_error
              found.last_checked_at = updated.last_checked_at
              found.last_sent_at = updated.last_sent_at
              found.spooled_count = updated.spooled_count
              found.is_cooldown = updated.is_cooldown
            }
          })
        }
      } catch (e) {
        // silent polling
      }
    },
    startRealtimeMonitoring() {
      this.stopRealtimeMonitoring()
      this.monitoringTimer = setInterval(() => {
        if (this.enabled && !this.loading && !this.dialogVisible) {
          this.pollHealthStatus()
        }
      }, 10000)
    },
    stopRealtimeMonitoring() {
      if (this.monitoringTimer) {
        clearInterval(this.monitoringTimer)
        this.monitoringTimer = null
      }
    },
    getStatusClass(dest) {
      if (!dest.enabled) return 'is-disabled'
      if (dest.status === 'healthy') return 'is-healthy'
      if (dest.status === 'unreachable') return 'is-unreachable'
      return 'is-unknown'
    },
    getStatusLabel(dest) {
      if (!dest.enabled) return this.$t('Disabled') || 'Disabled'
      if (dest.status === 'healthy') return this.$t('Healthy') || 'Healthy'
      if (dest.status === 'unreachable') return this.$t('Unreachable') || 'Unreachable'
      return this.$t('Standby') || 'Standby'
    },
    getStatusTitle(dest) {
      if (dest.status === 'unreachable' && dest.last_error) {
        return `Unreachable: ${dest.last_error}`
      }
      return ''
    },
    getLogTypeLabel(code) {
      const match = this.meta.log_types.find((lt) => lt.value === code)
      return match ? match.label.replace(' Logs', '').replace(' Execution', '') : code
    },
    openCreateDialog() {
      this.isEditing = false
      this.editingIndex = -1
      this.probeResult = null
      this.form = {
        id: '',
        name: '',
        host: '',
        port: 514,
        protocol: 'UDP',
        format: 'RFC5424',
        facility: 'user',
        severity: 'info',
        log_types: ['login_log', 'operation_log', 'session_command_log', 'host_session_log'],
        verify_ssl: false,
        enabled: true
      }
      this.dialogVisible = true
    },
    openEditDialog(dest) {
      this.isEditing = true
      this.editingIndex = this.destinations.findIndex((d) => d.id === dest.id)
      this.probeResult = null
      this.form = JSON.parse(JSON.stringify(dest))
      this.dialogVisible = true
    },
    async handleProbeInDialog() {
      this.$refs.destFormRef.validate(async (valid) => {
        if (!valid) return
        this.probing = true
        this.probeResult = null
        try {
          const res = await testLogShipmentProbe(this.form)
          this.probeResult = res
        } catch (err) {
          this.probeResult = {
            ok: false,
            error: err?.message || 'Network error while attempting connection probe'
          }
        } finally {
          this.probing = false
        }
      })
    },
    async handleTestDestination(dest) {
      this.testingId = dest.id
      try {
        const res = await testDestinationById(dest.id)
        if (res?.ok) {
          dest.status = 'healthy'
          dest.last_error = ''
          this.$message.success(res.message || `Connected to ${dest.name} in ${res.latency_ms}ms`)
        } else {
          dest.status = 'unreachable'
          dest.last_error = res.error || 'Connection failed'
          this.$message.error(`Unreachable: ${res.error || 'Connection refused or timed out'}`)
        }
      } catch (e) {
        dest.status = 'unreachable'
        dest.last_error = e?.message || 'Connection failed'
        this.$message.error(`Unreachable: ${e?.message || 'Connection test failed'}`)
      } finally {
        this.testingId = null
      }
    },
    async handleSaveDestination() {
      this.$refs.destFormRef.validate(async (valid) => {
        if (!valid) return
        this.saving = true
        try {
          const listCopy = JSON.parse(JSON.stringify(this.destinations))
          if (this.isEditing && this.editingIndex > -1) {
            listCopy[this.editingIndex] = { ...listCopy[this.editingIndex], ...this.form }
          } else {
            const newItem = { ...this.form }
            if (!newItem.id) {
              newItem.id = 'dest_' + Date.now()
            }
            listCopy.push(newItem)
          }

          const res = await updateLogShipmentSettings({
            enabled: this.enabled,
            destinations: listCopy
          })

          if (res?.destinations) {
            this.destinations = res.destinations
          } else {
            await this.fetchData()
          }

          this.$message.success(this.$tc('SaveSuccessMsg') || 'Destination saved successfully')
          this.dialogVisible = false
        } catch (e) {
          const detail = e?.response?.data || e?.data || e?.message || ''
          const detailStr = typeof detail === 'object' ? JSON.stringify(detail) : detail
          this.$message.error('Failed to save destination' + (detailStr ? `: ${detailStr}` : ''))
        } finally {
          this.saving = false
        }
      })
    },
    async handleDeleteDestination(dest) {
      try {
        const updatedList = this.destinations.filter((d) => d.id !== dest.id)
        await updateLogShipmentSettings({
          enabled: this.enabled,
          destinations: updatedList
        })
        this.destinations = updatedList
        this.$message.success('Destination deleted successfully')
      } catch (e) {
        this.$message.error('Failed to delete destination')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.log-shipment-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
}

.section-card {
  border-radius: var(--jms-card-radius, 8px);
}

// Master Switch Row
.master-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 20px;
  border-radius: 8px;
  background-color: var(--el-fill-color-light, rgba(255, 255, 255, 0.04));
  border: 1px solid var(--panel-border-color, var(--el-border-color));
  margin-bottom: 20px;

  .master-switch-info {
    display: flex;
    flex-direction: column;
    gap: 6px;

    .switch-title-row {
      display: flex;
      align-items: center;
      gap: 12px;

      .master-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .live-monitoring-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.3);

        .live-pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: pulse-dot 1.6s infinite;
        }
      }
    }

    .master-desc {
      font-size: 13px;
      line-height: 1.5;
      color: var(--color-text-secondary);
      max-width: 900px;
    }
  }

  .master-switch-control {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }
}

// Metrics Grid
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 8px;
  background-color: var(--page-background-color, #ffffff);
  border: 1px solid var(--panel-border-color, var(--el-border-color));
  box-shadow: var(--jms-card-shadow);

  .metric-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    font-size: 20px;

    &.total {
      background: rgba(56, 189, 248, 0.12);
      color: #38bdf8;
    }
    &.healthy {
      background: rgba(16, 185, 129, 0.12);
      color: #10b981;
    }
    &.unreachable {
      background: rgba(239, 68, 68, 0.12);
      color: #ef4444;
    }
    &.shield {
      background: rgba(99, 102, 241, 0.12);
      color: #6366f1;
    }
  }

  .metric-body {
    display: flex;
    flex-direction: column;

    .metric-value {
      font-size: 22px;
      font-weight: 600;
      color: var(--color-text-primary);
      line-height: 1.2;

      &.has-warning {
        color: #ef4444;
      }
    }

    .metric-label {
      font-size: 12px;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
  }
}

.header-action-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

// Empty Destinations State
.empty-destinations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;

  .empty-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: var(--el-fill-color-light, rgba(255, 255, 255, 0.05));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    color: var(--color-text-secondary);
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 6px;
  }

  .empty-desc {
    font-size: 13px;
    color: var(--color-text-secondary);
    max-width: 500px;
    line-height: 1.5;
  }
}

// Destinations Cards Grid
.destinations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}

.dest-card {
  display: flex;
  flex-direction: column;
  padding: 18px 20px;
  border-radius: 8px;
  background-color: var(--page-background-color, #ffffff);
  border: 1px solid var(--panel-border-color, var(--el-border-color));
  box-shadow: var(--jms-card-shadow);
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    box-shadow: var(--jms-card-shadow-hover);
  }

  &.is-unreachable {
    border-left: 4px solid #ef4444;
  }

  &.is-disabled {
    opacity: 0.75;
  }

  .dest-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .dest-name-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;

      .dest-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .badge-latency {
        font-size: 11px;
        font-weight: 500;
        color: #10b981;
        background: rgba(16, 185, 129, 0.08);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid rgba(16, 185, 129, 0.2);
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        &.is-healthy {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
          .status-dot {
            background: #10b981;
            box-shadow: 0 0 6px #10b981;
          }
        }

        &.is-unreachable {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          .status-dot {
            background: #ef4444;
            box-shadow: 0 0 6px #ef4444;
          }
        }

        &.is-disabled {
          background: rgba(148, 163, 184, 0.12);
          color: #94a3b8;
          .status-dot {
            background: #94a3b8;
          }
        }

        &.is-unknown {
          background: rgba(56, 189, 248, 0.12);
          color: #38bdf8;
          .status-dot {
            background: #38bdf8;
          }
        }
      }
    }
  }

  .dest-badges-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;

    .badge-address {
      display: inline-flex;
      align-items: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--color-text-primary);
      background: var(--el-fill-color-light, rgba(255, 255, 255, 0.05));
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid var(--panel-border-color, var(--el-border-color));
    }
  }

  .dest-logs-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 14px;

    .log-label {
      font-size: 11px;
      font-weight: 500;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .log-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;

      .log-pill {
        font-size: 11px;
        padding: 2px 7px;
        border-radius: 4px;
        background: var(--el-fill-color-light, rgba(255, 255, 255, 0.04));
        color: var(--color-text-primary);
        border: 1px solid var(--panel-border-color, var(--el-border-color));

        &.all {
          color: var(--color-primary);
          border-color: var(--color-primary);
        }
      }
    }
  }

  // Unreachable notice block
  .unreachable-notice {
    padding: 10px 12px;
    border-radius: 6px;
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.25);
    margin-bottom: 14px;

    .notice-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      .recheck-btn {
        padding: 2px 8px;
        height: 22px;
        font-size: 11px;
      }
    }

    .notice-title {
      font-size: 12px;
      font-weight: 600;
      color: #ef4444;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .notice-detail {
      font-size: 11px;
      color: var(--color-text-primary);
      margin-top: 3px;
      word-break: break-all;
    }

    .notice-cooldown {
      font-size: 11px;
      color: var(--color-text-secondary);
      margin-top: 4px;
      font-style: italic;

      .spooled-count {
        font-weight: 600;
        color: #ef4444;
      }
    }

    .notice-time {
      font-size: 10px;
      color: var(--color-text-secondary);
      margin-top: 4px;
    }
  }

  .healthy-notice {
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.2);
    margin-bottom: 14px;

    .healthy-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      .healthy-text {
        font-size: 11px;
        font-weight: 600;
        color: #10b981;
      }

      .checked-time {
        font-size: 10px;
        color: var(--color-text-secondary);
      }
    }

    .healthy-sent {
      font-size: 11px;
      color: var(--color-text-secondary);
      margin-top: 3px;
    }
  }

  .dest-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid var(--panel-border-color, var(--el-border-color));

    .right-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

.dest-card-add {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  border: 2px dashed var(--panel-border-color, var(--el-border-color));
  background-color: var(--page-background-color, #ffffff);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  user-select: none;

  &:hover {
    border-color: var(--color-primary);
    background-color: var(--el-color-primary-light-9, rgba(56, 189, 248, 0.05));
    transform: translateY(-2px);
    box-shadow: var(--jms-card-shadow-hover);

    .dest-add-icon {
      background: var(--color-primary);
      color: #ffffff;
      transform: scale(1.1);
    }

    .dest-add-title {
      color: var(--color-primary);
    }
  }

  .dest-add-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 16px;
  }

  .dest-add-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--el-fill-color-light, rgba(255, 255, 255, 0.08));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    color: var(--color-text-secondary);
    margin-bottom: 12px;
    transition: all 0.25s ease;
  }

  .dest-add-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: 6px;
    transition: color 0.2s ease;
  }

  .dest-add-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    max-width: 240px;
    line-height: 1.4;
  }
}

// Form styles
.dest-form {
  .log-types-checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 8px 16px;
    margin-top: 4px;
  }

  .form-tip {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin-top: 6px;
  }
}

.probe-result-banner {
  padding: 12px 14px;
  border-radius: 6px;
  margin-top: 16px;

  &.is-success {
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  &.is-error {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .probe-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;

    .probe-latency {
      font-size: 12px;
      font-weight: normal;
      opacity: 0.85;
    }
  }

  .probe-msg {
    font-size: 12px;
    margin-top: 4px;
    color: var(--color-text-primary);
  }
}

.dialog-footer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .right-footer-btns {
    display: flex;
    gap: 8px;
  }
}
</style>
