<template>
  <transition name="slide-down">
    <div
      v-if="visible && currentAlert"
      class="admin-top-banner"
      :class="[`banner--${currentAlert.level}`, { 'is-multiline': isMobile }]"
      @mouseenter="pauseCycle"
      @mouseleave="resumeCycle"
    >
      <div class="banner-inner">
        <!-- Left: Status Indicator & Icon & Content -->
        <div class="banner-content">
          <span class="pulse-dot" :class="`pulse-${currentAlert.level}`" />

          <div class="banner-icon-wrap">
            <el-icon
              v-if="currentAlert.level === 'danger'"
              :size="18"
              class="banner-icon icon-danger"
            >
              <CircleCloseFilled />
            </el-icon>
            <el-icon v-else :size="18" class="banner-icon icon-warning">
              <WarningFilled />
            </el-icon>
          </div>

          <!-- Dynamic Badge Tag -->
          <span class="banner-badge" :class="`badge--${currentAlert.level}`">
            <template v-if="currentAlert.category === 'license'">
              <span v-if="currentAlert.id === 'license_expired'">EXPIRED</span>
              <span v-else-if="currentAlert.days_remaining === 0">EXPIRES TODAY</span>
              <span v-else-if="currentAlert.days_remaining === 1">1 DAY LEFT</span>
              <span v-else>{{ currentAlert.days_remaining }} DAYS LEFT</span>
            </template>
            <template v-else-if="currentAlert.category === 'log_shipment'">
              SIEM UNREACHABLE
            </template>
            <template v-else> ALERT </template>
          </span>

          <!-- Alert Title & Message -->
          <div class="banner-text">
            <strong class="banner-title">{{ currentAlert.title }}:</strong>
            <span class="banner-message">{{ currentAlert.message }}</span>
          </div>
        </div>

        <!-- Right: Actions & Multiple Alert Switcher & Close -->
        <div class="banner-actions">
          <!-- Multi-Alert Pagination / Counter -->
          <div v-if="filteredAlerts.length > 1" class="alert-counter">
            <button class="counter-nav-btn" title="Previous alert" @click.stop="prevAlert">
              <el-icon :size="12"><ArrowLeft /></el-icon>
            </button>
            <span class="counter-text">{{ currentIndex + 1 }}/{{ filteredAlerts.length }}</span>
            <button class="counter-nav-btn" title="Next alert" @click.stop="nextAlert">
              <el-icon :size="12"><ArrowRight /></el-icon>
            </button>
          </div>

          <!-- Action Button -->
          <button
            v-if="currentAlert.action_label && currentAlert.action_path"
            class="banner-action-btn"
            @click.stop="handleAction(currentAlert.action_path)"
          >
            <span>{{ currentAlert.action_label }}</span>
            <el-icon :size="12" class="btn-arrow"><Right /></el-icon>
          </button>

          <!-- Dismiss Button -->
          <button
            class="banner-dismiss-btn"
            title="Dismiss notification"
            @click.stop="dismissAlert(currentAlert.id)"
          >
            <el-icon :size="14"><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { computed, defineComponent, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  ArrowLeft,
  ArrowRight,
  CircleCloseFilled,
  Close,
  Right,
  WarningFilled
} from '@element-plus/icons-vue'
import request from '@/utils/request'
import { hasPermission } from '@/utils/jms/permission'

const SESSION_DISMISSED_KEY = 'xpam_dismissed_admin_alerts'

export default defineComponent({
  name: 'AdminTopBanner',
  components: {
    CircleCloseFilled,
    WarningFilled,
    Close,
    Right,
    ArrowLeft,
    ArrowRight
  },
  setup() {
    const store = useStore()
    const router = useRouter()

    const rawAlerts = ref([])
    const currentIndex = ref(0)
    const isPaused = ref(false)
    const dismissedIds = ref(new Set())
    let pollTimer = null
    let cycleTimer = null

    // Load dismissed IDs from sessionStorage
    try {
      const stored = sessionStorage.getItem(SESSION_DISMISSED_KEY)
      if (stored) {
        dismissedIds.value = new Set(JSON.parse(stored))
      }
    } catch (e) {
      // ignore
    }

    // Administrator Check: Strictly restricted to system/super administrators
    const isAdmin = computed(() => {
      const user = store.getters.currentUser
      return Boolean(
        store.getters.currentUserIsSuperAdmin ||
        store.getters.isSystemAdmin ||
        store.getters.currentUserIsAdmin ||
        user?.is_superuser ||
        user?.is_staff ||
        hasPermission('settings.view_setting')
      )
    })

    const isMobile = computed(() => store.getters.isMobile)

    // Filter alerts that haven't been dismissed in this session
    const filteredAlerts = computed(() => {
      if (!isAdmin.value) return []
      return rawAlerts.value.filter((a) => !dismissedIds.value.has(a.id))
    })

    const currentAlert = computed(() => {
      if (filteredAlerts.value.length === 0) return null
      const idx = currentIndex.value % filteredAlerts.value.length
      return filteredAlerts.value[idx]
    })

    const visible = computed(() => {
      return isAdmin.value && filteredAlerts.value.length > 0
    })

    const fetchAlerts = async () => {
      if (!isAdmin.value) return
      try {
        const res = await request({
          url: '/api/v1/xpack/admin/banner-alerts/',
          method: 'get'
        })
        const items = res?.alerts || (res?.data && res.data.alerts) || []
        rawAlerts.value = items

        // Reset index if out of bounds
        if (currentIndex.value >= filteredAlerts.value.length) {
          currentIndex.value = 0
        }
      } catch (err) {
        // Silently handle if user lacks permissions or endpoint unavailable
        rawAlerts.value = []
      }
    }

    const nextAlert = () => {
      if (filteredAlerts.value.length <= 1) return
      currentIndex.value = (currentIndex.value + 1) % filteredAlerts.value.length
    }

    const prevAlert = () => {
      if (filteredAlerts.value.length <= 1) return
      currentIndex.value =
        (currentIndex.value - 1 + filteredAlerts.value.length) % filteredAlerts.value.length
    }

    const pauseCycle = () => {
      isPaused.value = true
    }

    const resumeCycle = () => {
      isPaused.value = false
    }

    const handleAction = (path) => {
      if (path) {
        router.push(path)
      }
    }

    const dismissAlert = (alertId) => {
      if (!alertId) return
      dismissedIds.value.add(alertId)
      try {
        sessionStorage.setItem(
          SESSION_DISMISSED_KEY,
          JSON.stringify(Array.from(dismissedIds.value))
        )
      } catch (e) {
        // ignore
      }
      if (currentIndex.value >= filteredAlerts.value.length) {
        currentIndex.value = 0
      }
    }

    onMounted(() => {
      if (isAdmin.value) {
        fetchAlerts()
        // Poll every 45 seconds for real-time status updates
        pollTimer = setInterval(fetchAlerts, 45000)

        // Rotate alerts if multiple every 8 seconds
        cycleTimer = setInterval(() => {
          if (!isPaused.value && filteredAlerts.value.length > 1) {
            nextAlert()
          }
        }, 8000)
      }
    })

    onBeforeUnmount(() => {
      if (pollTimer) clearInterval(pollTimer)
      if (cycleTimer) clearInterval(cycleTimer)
    })

    return {
      isAdmin,
      isMobile,
      visible,
      filteredAlerts,
      currentAlert,
      currentIndex,
      nextAlert,
      prevAlert,
      pauseCycle,
      resumeCycle,
      handleAction,
      dismissAlert
    }
  }
})
</script>

<style lang="scss" scoped>
.admin-top-banner {
  position: relative;
  z-index: 1005;
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  padding: 6px 16px;
  font-size: 13px;
  line-height: 1.4;
  color: #ffffff;
  user-select: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  // Danger Gradient: Expired License
  &.banner--danger {
    background: linear-gradient(90deg, #dc2626 0%, #b91c1c 45%, #991b1b 100%);
    box-shadow: 0 2px 10px rgba(220, 38, 38, 0.35);
    border-bottom: 1px solid rgba(254, 202, 202, 0.28);
  }

  // Warning Gradient: Expiring Soon (10 days countdown) or Unreachable Destinations
  &.banner--warning {
    background: linear-gradient(90deg, #d97706 0%, #b45309 45%, #92400e 100%);
    box-shadow: 0 2px 10px rgba(217, 119, 6, 0.32);
    border-bottom: 1px solid rgba(253, 230, 138, 0.28);
  }

  .banner-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
  }

  .banner-content {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 10px;
  }

  // Pulsing Dot
  .pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    display: inline-block;

    &.pulse-danger {
      background-color: #fee2e2;
      box-shadow: 0 0 0 0 rgba(254, 226, 226, 0.7);
      animation: pulse-danger-anim 2s infinite;
    }

    &.pulse-warning {
      background-color: #fef3c7;
      box-shadow: 0 0 0 0 rgba(254, 243, 199, 0.7);
      animation: pulse-warning-anim 2s infinite;
    }
  }

  .banner-icon-wrap {
    display: flex;
    align-items: center;
    flex-shrink: 0;

    .banner-icon {
      color: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
    }
  }

  // High-contrast Pill Badge
  .banner-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    flex-shrink: 0;

    &.badge--danger {
      background: rgba(255, 255, 255, 0.95);
      color: #b91c1c;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }

    &.badge--warning {
      background: rgba(255, 255, 255, 0.95);
      color: #92400e;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
  }

  // Text
  .banner-text {
    display: flex;
    align-items: center;
    gap: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;

    .banner-title {
      font-weight: 600;
      color: #ffffff;
      flex-shrink: 0;
    }

    .banner-message {
      color: rgba(255, 255, 255, 0.92);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // Right Side Actions
  .banner-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  // Carousel Navigation
  .alert-counter {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 2px 6px;
    border-radius: 14px;

    .counter-text {
      font-size: 11px;
      font-weight: 600;
      padding: 0 2px;
    }

    .counter-nav-btn {
      background: none;
      border: none;
      color: #ffffff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2px;
      border-radius: 50%;
      opacity: 0.8;
      transition: all 0.2s ease;

      &:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }

  // Action Button
  .banner-action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    color: #ffffff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    backdrop-filter: blur(4px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    .btn-arrow {
      transition: transform 0.2s ease;
    }

    &:hover {
      background: #ffffff;
      border-color: #ffffff;
      color: #1e293b;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

      .btn-arrow {
        transform: translateX(2px);
      }
    }

    &:active {
      transform: scale(0.97);
    }
  }

  // Dismiss Button
  .banner-dismiss-btn {
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.15);
    color: #ffffff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    opacity: 0.85;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      background: rgba(0, 0, 0, 0.35);
      border-color: rgba(255, 255, 255, 0.35);
      transform: scale(1.08);
    }

    &:active {
      transform: scale(0.92);
    }
  }

  // Mobile layout adjustment
  &.is-multiline {
    padding: 8px 12px;

    .banner-inner {
      flex-direction: column;
      align-items: flex-start;
      gap: 6px;
    }

    .banner-content {
      width: 100%;
      flex-wrap: wrap;
    }

    .banner-text {
      white-space: normal;
    }

    .banner-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

// Animations
@keyframes pulse-danger-anim {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(254, 226, 226, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(254, 226, 226, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(254, 226, 226, 0);
  }
}

@keyframes pulse-warning-anim {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(254, 243, 199, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 6px rgba(254, 243, 199, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(254, 243, 199, 0);
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
  max-height: 0;
}
</style>
