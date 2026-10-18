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
        activeMenu: 'JITPolicyList',
        submenu: [
          {
            title: this.$t('JITPolicies'),
            name: 'JITPolicyList',
            hidden: !this.$hasPerm('accounts.view_jitpolicy'),
            component: () => import('@/views/accounts/JIT/JITPolicyList.vue')
          },
          {
            title: this.$t('JITLiveAccounts'),
            name: 'JITLiveAccountList',
            hidden: !this.$hasPerm('accounts.view_jitaccount'),
            component: () => import('@/views/accounts/JIT/JITLiveAccountList.vue')
          },
          {
            title: this.$t('JITHistory'),
            name: 'JITHistoryAccountList',
            hidden: !this.$hasPerm('accounts.view_jitaccount'),
            component: () => import('@/views/accounts/JIT/JITHistoryAccountList.vue')
          }
        ]
      }
    }
  }
}
</script>
