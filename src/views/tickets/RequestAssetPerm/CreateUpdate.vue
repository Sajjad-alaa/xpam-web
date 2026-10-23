<template>
  <GenericCreateUpdatePage
    v-bind="$data"
    v-if="!loading"
    :create-success-next-route="createSuccessNextRoute"
    :perform-submit="performSubmit"
  />
</template>

<script>
import ProtocolsSelect from '@/components/Form/FormFields/AllOrSpec.vue'
import Select2 from '@/components/Form/FormFields/Select2'
import { GenericCreateUpdatePage } from '@/layout/components'
import store from '@/store'
import { getDaysFuture } from '@/utils/common/time'
import RequestAccountField from './RequestAccountField.vue'
import ApprovalPreview from './ApprovalPreview.vue'
import CcUsers from '@/views/tickets/components/CcUsers'
import { getTicketFlowLabel } from '@/views/tickets/const'
import { mapGetters, mapState } from 'vuex'

export default {
  components: {
    GenericCreateUpdatePage
  },
  data() {
    const now = new Date()
    const time = store.getters.publicSettings['TICKET_AUTHORIZE_DEFAULT_TIME']
    const unit = store.getters.publicSettings['TICKET_AUTHORIZE_DEFAULT_TIME_UNIT']
    const dividend = unit === 'hour' ? 24 : 1
    const date_expired = getDaysFuture(time / dividend, new Date()).toISOString()
    const date_start = now.toISOString()
    return {
      // 工单创建 隐藏提示信息中的跳转连接
      hasDetailInMsg: false,
      loading: true,
      flowOptions: [],
      latestJitPreview: null,
      jitSelectionKey: '',
      initial: {
        ips_or_not: true,
        apply_date_expired: date_expired,
        apply_date_start: date_start,
        apply_assets: [],
        org_id: '',
        flow_id: '',
        cc_users: [],
        apply_actions: [this.$t('All')],
        apply_protocols: ['all']
      },
      fields: [
        [this.$t('Basic'), ['title', 'org_id', 'flow_id', 'cc_users']],
        [
          this.$t('RequestPerm'),
          [
            'apply_nodes',
            'apply_assets',
            'apply_accounts',
            'apply_actions',
            'apply_protocols',
            'apply_date_start',
            'apply_date_expired'
          ]
        ],
        [this.$t('Other'), ['comment', 'jit_route']]
      ],
      fieldsMeta: {
        title: {
          el: {
            type: 'input'
          }
        },
        type: {
          hidden: () => true,
          el: {
            disabled: true
          }
        },
        apply_actions: {
          label: this.$t('Actions'),
          helpText: this.$t('ActionsTips')
        },
        // XPAM: the protocols asked for (the granted access is limited to them)
        apply_protocols: {
          label: this.$t('Protocols'),
          helpText: this.$t('RequestProtocolsHelp'),
          component: ProtocolsSelect,
          el: {
            resource: this.$t('Protocols'),
            select2: {
              url: '/api/v1/assets/protocols/',
              ajax: { transformOption: (item) => ({ label: item.label, value: item.value }) }
            }
          }
        },
        apply_nodes: {
          label: this.$t('Node'),
          component: Select2,
          el: {
            value: [],
            ajax: {
              url: '',
              transformOption: (item) => {
                return { label: `${item.full_value}`, value: item.id }
              }
            },
            clearable: true
          }
        },
        apply_assets: {
          type: 'assetSelect',
          label: this.$t('Asset'),
          component: Select2,
          el: {
            value: [],
            ajax: {
              url: '',
              transformOption: (item) => {
                return { label: item.name + '(' + item.address + ')', value: item.id }
              }
            }
          }
        },
        apply_accounts: {
          // XPAM: servers covered by a just-in-time rule need no account choice
          component: RequestAccountField,
          el: {
            nodes: [],
            assets: [],
            oid: ''
          },
          hidden: (formValue) => {
            this.fieldsMeta.apply_accounts.el.assets = formValue.apply_assets
            this.fieldsMeta.apply_accounts.el.nodes = formValue.apply_nodes
          }
        },
        org_id: {
          label: this.$t('Organization'),
          component: Select2,
          el: {
            multiple: false,
            disabled: false,
            options: []
          },
          hidden: (form) => {
            const fieldsMeta = this.fieldsMeta
            fieldsMeta.apply_assets.el.ajax.url = `/api/v1/tickets/apply-assets/suggestions/?oid=${form['org_id']}`
            fieldsMeta.apply_nodes.el.ajax.url = `/api/v1/tickets/apply-nodes/suggestions/?oid=${form['org_id']}`
            fieldsMeta.apply_accounts.el.oid = form['org_id']
          },
          on: {
            change: async ([event], updateForm) => {
              updateForm({
                flow_id: '',
                cc_users: [],
                apply_nodes: [],
                apply_assets: [],
                apply_system_users: []
              })
              const flow = await this.loadFlowOptions(event)
              updateForm({
                flow_id: flow?.id || '',
                cc_users: flow?.cc_users || []
              })
            }
          }
        },
        flow_id: {
          component: Select2,
          label: this.$t('TicketFlow'),
          helpText: '',
          el: {
            multiple: false,
            clearable: false,
            disabled: true,
            options: []
          },
          on: {
            change: ([event], updateForm) => {
              const flow = this.flowOptions.find((item) => item.id === event)
              updateForm({ cc_users: flow?.cc_users || [] })
            }
          }
        },
        // XPAM: before sending — approved at once by a just-in-time rule, or why it waits and who approves
        jit_route: {
          label: this.$t('JITPreviewLabel'),
          component: ApprovalPreview,
          el: {
            assets: [],
            nodes: [],
            accounts: [],
            protocols: [],
            actions: [],
            dateStart: '',
            dateExpired: '',
            reason: '',
            flowId: '',
            onPreview: (preview, updateForm) => this.handleJitPreview(preview, updateForm)
          },
          hidden: (form) => {
            this.currentFormRef = form
            Object.assign(this.fieldsMeta.jit_route.el, {
              assets: form.apply_assets || [],
              nodes: form.apply_nodes || [],
              accounts: form.apply_accounts || [],
              protocols: form.apply_protocols || [],
              actions: (form.apply_actions || []).map((a) => (a === this.$t('All') ? 'all' : a)),
              dateStart: form.apply_date_start || '',
              dateExpired: form.apply_date_expired || '',
              reason: (form.comment || '').trim(),
              flowId: form.flow_id || ''
            })
            return false
          }
        },
        cc_users: {
          component: CcUsers,
          label: this.$t('CcUsers'),
          el: {
            value: []
          }
        }
      },
      cleanFormValue(value) {
        const apply_actions = value['apply_actions'] || []
        apply_actions.forEach((item, index) => {
          if (item === this.$t('All')) {
            apply_actions[index] = 'all'
          }
        })
        if (
          this.latestJitPreview &&
          this.latestJitPreview.covered &&
          (!value.apply_accounts || value.apply_accounts.length < 1)
        ) {
          value.apply_accounts = ['@JIT']
        }

        Object.keys(value).forEach((item, index, arr) => {
          if (['apply_accounts', 'apply_assets', 'apply_nodes'].includes(item)) {
            if (value[item].length < 1) {
              delete value[item]
            }
          }
        })
        if (!value.flow_id) {
          delete value.flow_id
        }
        delete value.cc_users
        delete value.jit_route
        return value
      },
      url: '/api/v1/tickets/apply-asset-tickets/?state=pending',
      createSuccessNextRoute: {
        name: 'MyTicketList'
      }
    }
  },
  computed: {
    ...mapState({
      workbenchOrgs: (state) => state.users.noRootWorkbenchOrgs
    }),
    ...mapGetters(['currentOrg'])
  },
  async mounted() {
    this.fieldsMeta.org_id.el.options = this.workbenchOrgs.map((item) => ({
      label: item.name,
      value: item.id
    }))

    const currentOrgId = this.currentOrg?.id || ''
    const userAllOrgIds = this.workbenchOrgs.map((i) => i.id) || []
    if (userAllOrgIds.includes(currentOrgId)) {
      this.initial.org_id = currentOrgId
    } else {
      this.initial.org_id = userAllOrgIds[0]
    }

    const flow = await this.loadFlowOptions(this.initial.org_id)
    this.initial.flow_id = flow?.id || ''
    this.initial.cc_users = flow?.cc_users || []

    this.loading = false
  },
  methods: {
    async loadFlowOptions(orgId) {
      this.flowOptions = []
      this.fieldsMeta.flow_id.el.options = []
      this.fieldsMeta.flow_id.el.disabled = true
      if (!orgId) {
        return null
      }
      try {
        const flows = await this.$axios.get('/api/v1/tickets/flows/options/', {
          params: { type: 'apply_asset', org_id: orgId }
        })
        this.flowOptions = flows
        this.fieldsMeta.flow_id.el.options = flows.map((flow) => ({
          label: getTicketFlowLabel(flow, this.$t),
          value: flow.id
        }))
        this.fieldsMeta.flow_id.el.disabled = flows.length <= 1
        return flows[0] || null
      } catch (error) {
        return null
      }
    },
    handleJitPreview(preview, updateForm) {
      this.latestJitPreview = preview
      const form = this.currentFormRef
      const selectionKey = form
        ? [...(form.apply_assets || []), ...(form.apply_nodes || [])].sort().join(',')
        : ''
      if (!selectionKey || !preview || !preview.covered) {
        if (!selectionKey) this.jitSelectionKey = ''
        this.fieldsMeta.flow_id.el.disabled = this.flowOptions.length <= 1
        this.fieldsMeta.flow_id.helpText = ''
        return
      }

      const patch = {}
      if (preview.policy_locks_flow) {
        if (preview.policy_flow_id && form && form.flow_id !== preview.policy_flow_id) {
          patch.flow_id = preview.policy_flow_id
          const matched = this.flowOptions.find((f) => f.id === preview.policy_flow_id)
          if (matched) {
            patch.cc_users = matched.cc_users || []
          }
        }
        this.fieldsMeta.flow_id.el.disabled = true
        const rules = (preview.policies || preview.rules || []).join(', ')
        this.fieldsMeta.flow_id.helpText = rules
          ? `Automatically selected by JIT Policy: ${rules}`
          : ''
      } else {
        this.fieldsMeta.flow_id.el.disabled = this.flowOptions.length <= 1
        this.fieldsMeta.flow_id.helpText = ''
      }

      if (form) {
        const targetHours = preview.auto_approve_hours || preview.max_hours || 0
        const startMs = new Date(form.apply_date_start || Date.now()).getTime()
        const endMs = new Date(form.apply_date_expired || Date.now()).getTime()
        const askedHours = (endMs - startMs) / 3600000
        const exceedsMax = preview.max_hours > 0 && askedHours > preview.max_hours + 0.02
        if (targetHours > 0 && (this.jitSelectionKey !== selectionKey || exceedsMax)) {
          this.jitSelectionKey = selectionKey
          const now = new Date()
          const end = new Date(now.getTime() + targetHours * 3600 * 1000)
          patch.apply_date_start = now.toISOString()
          patch.apply_date_expired = end.toISOString()
        } else if (this.jitSelectionKey !== selectionKey) {
          this.jitSelectionKey = selectionKey
        }
        if (
          Array.isArray(preview.allowed_actions) &&
          preview.allowed_actions.length &&
          !preview.allowed_actions.includes('all')
        ) {
          const curActions = form.apply_actions || []
          if (curActions.includes('all') || curActions.includes(this.$t('All'))) {
            patch.apply_actions = [...preview.allowed_actions]
          }
        }
        if (
          Array.isArray(preview.allowed_protocols) &&
          preview.allowed_protocols.length &&
          !preview.allowed_protocols.includes('all')
        ) {
          const curProtos = form.apply_protocols || []
          if (curProtos.includes('all')) {
            patch.apply_protocols = [...preview.allowed_protocols]
          }
        }
      }

      if (Object.keys(patch).length > 0) {
        if (form) Object.assign(form, patch)
        if (typeof updateForm === 'function') updateForm(patch)
      }
    },
    async performSubmit(validValues) {
      let preview = this.latestJitPreview
      if (
        !preview &&
        ((validValues.apply_assets && validValues.apply_assets.length) ||
          (validValues.apply_nodes && validValues.apply_nodes.length))
      ) {
        try {
          preview = await this.$axios.post(
            '/api/v1/accounts/jit-access/preview/',
            {
              assets: validValues.apply_assets || [],
              nodes: validValues.apply_nodes || [],
              accounts:
                validValues.apply_accounts && validValues.apply_accounts.length
                  ? validValues.apply_accounts
                  : ['@JIT'],
              date_start: validValues.apply_date_start,
              date_expired: validValues.apply_date_expired,
              reason: validValues.comment || ''
            },
            { disableFlashErrorMsg: true }
          )
        } catch (e) {
          preview = null
        }
      }
      if (preview && preview.covered) {
        if (!validValues.apply_accounts || !validValues.apply_accounts.length) {
          validValues.apply_accounts = ['@JIT']
        }
        if (preview.policy_locks_flow && preview.policy_flow_id) {
          validValues.flow_id = preview.policy_flow_id
        }
        const targetHours = preview.auto_approve_hours || preview.max_hours || 0
        const startMs = new Date(validValues.apply_date_start || Date.now()).getTime()
        const endMs = new Date(validValues.apply_date_expired || Date.now()).getTime()
        const askedHours = (endMs - startMs) / 3600000
        if (targetHours > 0 && preview.max_hours > 0 && askedHours > preview.max_hours + 0.02) {
          const start = new Date()
          const end = new Date(start.getTime() + targetHours * 3600 * 1000)
          validValues.apply_date_start = start.toISOString()
          validValues.apply_date_expired = end.toISOString()
        }
      }
      const res = await this.$axios['post'](
        `/api/v1/tickets/apply-asset-tickets/open/`,
        validValues
      )
      if (res && res.apply_jit_auto) {
        this.$message.success(
          `Approved automatically by JIT Policy "${res.apply_jit_auto}" — access is active now!`
        )
      }
      return res
    }
  }
}
</script>

<style lang="scss" scoped></style>
