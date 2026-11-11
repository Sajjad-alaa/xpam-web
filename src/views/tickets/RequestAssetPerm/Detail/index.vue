<template>
  <GenericDetailPage
    ref="DetailPage"
    v-bind="config"
    v-model:active-menu="config.activeMenu"
    v-model:object="ticket"
  >
    <component :is="config.activeMenu" :object="ticket" />
  </GenericDetailPage>
</template>

<script>
import { GenericDetailPage, TabPage } from '@/layout/components'
import { onTicketChanged } from '@/utils/ticketEvents'
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
  mounted() {
    // live: this request's state, steps and approvers follow every change without reloading the page
    this.stopTicketEvents = onTicketChanged((event) => {
      if (event.type === 'resync' || (this.ticket?.id && event.id === this.ticket.id)) {
        this.$refs.DetailPage?.getObject()
      }
    })
  },
  beforeUnmount() {
    this.stopTicketEvents?.()
  },
  methods: {
    getObjectName() {
      return this.ticket.title
    }
  }
}
</script>

<style scoped></style>
