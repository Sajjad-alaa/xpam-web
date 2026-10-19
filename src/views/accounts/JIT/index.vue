<template>
  <TabPage v-model:active-menu="config.activeMenu" :submenu="config.submenu" />
</template>

<script>
import { TabPage } from '@/layout/components'

export default {
  name: 'JITAccessIndex',
  components: {
    TabPage
  },
  data() {
    return {
      config: {
        activeMenu: this.$hasPerm('accounts.view_jitaccount') ? 'JITDashboard' : 'JITPolicyList',
        submenu: [
          {
            title: this.$t('ZSPOverview'),
            name: 'JITDashboard',
            hidden: !this.$hasPerm('accounts.view_jitaccount'),
            component: () => import('@/views/accounts/JIT/JITDashboard.vue')
          },
          {
            title: this.$t('JITPolicies'),
            name: 'JITPolicyList',
            hidden: !this.$hasPerm('accounts.view_jitpolicy'),
            component: () => import('@/views/accounts/JIT/JITPolicyList.vue')
          },
          {
            title: this.$t('JITAccountsTab'),
            name: 'JITAccounts',
            hidden: !this.$hasPerm('accounts.view_jitaccount'),
            component: () => import('@/views/accounts/JIT/JITAccounts.vue')
          }
        ]
      }
    }
  }
}
</script>
