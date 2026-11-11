<template>
  <GenericDetailPage
    ref="DetailPage"
    v-bind="config"
    v-model:active-menu="config.activeMenu"
    v-model:object="ticket"
    @get-object-done="afterGetTicket"
  >
    <component :is="config.activeMenu" :object="ticket" />
  </GenericDetailPage>
</template>

<script>
import { GenericDetailPage, TabPage } from '@/layout/components'
import { onTicketChanged } from '@/utils/ticketEvents'
import TicketDetail from './TicketDetail'

export default {
  components: {
    GenericDetailPage,
    TicketDetail,
    TabPage
  },
  data() {
    return {
      ticket: {
        title: '',
        user_display: '',
        status: '',
        assignees_display: '',
        date_created: ''
      },
      config: {
        activeMenu: 'TicketDetail',
        submenu: [
          {
            title: this.$t('TicketDetail'),
            name: 'TicketDetail'
          }
        ],
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
    },
    afterGetTicket(ticket) {
      const ticketRouteMapper = {
        apply_asset: 'AssetsTicketDetail',
        login_confirm: 'LoginTicketDetail',
        login_asset_confirm: 'LoginAssetTicketDetail',
        command_confirm: 'CommandConfirmDetail'
      }
      const routeName = ticketRouteMapper[ticket.type.value]
      setTimeout(() => {
        this.$router.push({
          name: routeName,
          params: { id: this.$route.params['id'] }
        })
      })
    }
  }
}
</script>

<style scoped></style>
