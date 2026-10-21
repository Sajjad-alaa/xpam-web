<template>
  <TabPage v-model:active-menu="activeMenu" :submenu="submenu">
    <keep-alive>
      <component :is="activeMenu" />
    </keep-alive>
  </TabPage>
</template>

<script>
import TabPage from '@/layout/components/TabPage/index.vue'
import Announcement from './Announcement.vue'
import Vault from './Vault/index.vue'
import Ticket from './Ticket.vue'
import Ops from './Ops.vue'
import VirtualApp from './VirtualApp.vue'
import SSHCA from './SSHCA.vue'
import VaultConnections from './Vault/Routing/ConnectionList.vue'
import VaultRules from './Vault/Routing/RuleList.vue'

export default {
  name: 'Feature',
  components: {
    TabPage,
    Announcement,
    Vault,
    Ticket,
    Ops,
    VirtualApp,
    SSHCA,
    VaultConnections,
    VaultRules
  },
  data() {
    return {
      activeMenu: 'Announcement',
      submenu: [
        {
          title: this.$t('Announcement'),
          name: 'Announcement',
          hidden: !this.$hasPerm('settings.change_announcement')
        },
        {
          title: this.$t('Ticket'),
          name: 'Ticket',
          hidden: !this.$store.getters.hasTicketLicense || !this.$hasPerm('settings.change_ticket')
        },
        {
          title: this.$t('JobCenter'),
          name: 'Ops',
          hidden: !this.$hasPerm('settings.change_ops')
        },
        {
          title: this.$t('AccountStorage'),
          name: 'Vault',
          hidden: !this.$hasPerm('settings.change_vault')
        },
        {
          title: this.$t('VaultConnections'),
          name: 'VaultConnections',
          hidden: !this.$hasPerm('settings.change_vault')
        },
        {
          title: this.$t('VaultStorageRules'),
          name: 'VaultRules',
          hidden: !this.$hasPerm('settings.change_vault')
        },
        {
          title: this.$t('OpenBaoSSHCA'),
          name: 'SSHCA',
          hidden: !this.$hasPerm('settings.change_vault')
        },
        {
          title: this.$t('VirtualApps'),
          name: 'VirtualApp',
          hidden: !this.$hasPerm('settings.change_virtualapp')
        }
      ]
    }
  }
}
</script>
