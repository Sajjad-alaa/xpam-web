<template>
  <GenericDetailPage
    v-bind="config"
    v-model:active-menu="config.activeMenu"
    v-model:object="ticket"
  >
    <component :is="config.activeMenu" :object="ticket" />
  </GenericDetailPage>
</template>

<script>
import { GenericDetailPage, TabPage } from '@/layout/components'
import TicketDetail from './TicketDetail'
import AccessTab from './AccessTab.vue'

export default {
  components: {
    GenericDetailPage,
    TicketDetail,
    AccessTab,
    TabPage
  },
  data() {
    return {
      ticket: {
        title: '',
        user_display: '',
        type_display: '',
        status: '',
        processor: '',
        date_created: ''
      },
      config: {
        activeMenu: 'TicketDetail',
        url: '',
        submenu: [
          {
            title: this.$t('TicketDetail'),
            name: 'TicketDetail'
          },
          {
            // XPAM: the access the request gave (state, accounts, sessions; end, extend, revoke)
            title: this.$t('TicketAccess'),
            name: 'AccessTab'
          }
        ],
        actions: {
          detailApiUrl: `/api/v1/tickets/apply-asset-tickets/${this.$route.params.id}/`
        },
        getObjectName: this.getObjectName,
        hasRightSide: false
      }
    }
  },
  methods: {
    getObjectName() {
      return this.ticket.title
    }
  }
}
</script>

<style scoped></style>
