<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'
import { ResourceSelect } from '@/components/Form/FormFields'
import WeekCronSelect from '@/components/Form/FormFields/WeekCronSelect.vue'
import ProtocolsSelect from '@/components/Form/FormFields/AllOrSpec.vue'
import JITApprovalFlowSelect from './JITApprovalFlowSelect.vue'
import { assetJSONSelectMeta } from '@/views/assets/const'
import { userJSONSelectMeta } from '@/views/users/const'

export default {
  name: 'JITPolicyCreateUpdate',
  components: {
    GenericCreateUpdatePage
  },
  data() {
    const vm = this
    return {
      url: '/api/v1/accounts/jit-policies/',
      hasDetailInMsg: false,
      initial: {
        mode: 'per_session',
        username_mode: 'same_as_user',
        username_prefix: 'xpam-',
        privileged: false,
        linux_shell: '/bin/bash',
        windows_groups: 'Users,Remote Desktop Users',
        remove_home: true,
        scope: 'all',
        users: { type: 'ids', ids: [] },
        assets: { type: 'ids', ids: [] },
        approvers: { type: 'ids', ids: [] },
        approval_route: 'flow',
        approval_flow: null,
        priority: 50,
        is_active: true,
        permissions: [],
        jit_only: true,
        self_service: true,
        max_hours: 8,
        require_reason: true,
        auto_approve: false,
        auto_approve_max_hours: 4,
        auto_approve_time_period: [],
        approvals_required: 1,
        allow_extension: true,
        extension_approval: 'same',
        extension_max_hours: 0,
        max_extensions: 0,
        require_mfa: false,
        end_sessions_on_expiry: true,
        expiry_warning_minutes: 15,
        command_groups: [],
        command_action: 'reject',
        credential_type: 'password',
        db_privilege: 'read_only',
        device_role: 'read_only',
        protocols: ['all'],
        actions: ['all']
      },
      fields: [
        [vm.$t('Basic'), ['name', 'priority', 'is_active']],
        [vm.$t('JITRules'), ['scope', 'users', 'assets', 'permissions']],
        [
          vm.$t('JITRequestsApproval'),
          [
            'self_service',
            'max_hours',
            'require_reason',
            'auto_approve',
            'auto_approve_max_hours',
            'auto_approve_time_period',
            'approval_route',
            'approval_flow',
            'approvers',
            'approvals_required'
          ]
        ],
        [
          'Session & Access Extensions',
          ['allow_extension', 'extension_approval', 'extension_max_hours', 'max_extensions']
        ],
        // XPAM: what an access through the rule may allow; a request picks among them
        [vm.$t('JITAccessAllows'), ['protocols', 'actions']],
        [vm.$t('JITRights'), ['privileged', 'credential_type']],
        [
          vm.$t('JITSecurity'),
          [
            'require_mfa',
            'end_sessions_on_expiry',
            'expiry_warning_minutes',
            'command_groups',
            'command_action'
          ]
        ],
        [vm.$t('JITLifetime'), ['mode']],
        [vm.$t('JITZeroStanding'), ['jit_only']],
        [vm.$t('JITAccountName'), ['username_mode', 'specific_username', 'username_prefix']],
        [vm.$t('JITLinux'), ['linux_shell', 'linux_groups']],
        [vm.$t('JITWindows'), ['windows_groups']],
        [vm.$t('JITDatabases'), ['db_privilege', 'db_custom_sql']],
        [vm.$t('JITDevices'), ['device_role', 'device_custom_role']],
        [vm.$t('JITDeviceCommands'), ['device_create_commands', 'device_remove_commands']],
        [vm.$t('JITRemoval'), ['remove_home']],
        [vm.$t('Other'), ['comment']]
      ],
      fieldsMeta: {
        protocols: {
          label: vm.$t('JITAllowedProtocols'),
          helpText: vm.$t('JITAllowedProtocolsHelp'),
          component: ProtocolsSelect,
          el: {
            resource: vm.$t('Protocols'),
            select2: {
              url: '/api/v1/assets/protocols/',
              ajax: { transformOption: (item) => ({ label: item.label, value: item.value }) }
            }
          }
        },
        actions: {
          label: vm.$t('JITAllowedActions'),
          helpText: vm.$t('JITAllowedActionsHelp'),
          el: { expandAll: true }
        },
        priority: {
          helpText: vm.$t('JITPriorityHelp')
        },
        scope: {
          type: 'radio-group',
          options: [
            { label: vm.$t('JITScopeAll'), value: 'all' },
            { label: vm.$t('JITScopeRequests'), value: 'requests' },
            { label: vm.$t('JITScopeLinked'), value: 'linked' }
          ],
          helpText: vm.$t('JITScopeHelp')
        },
        users: {
          ...userJSONSelectMeta(vm),
          label: vm.$t('JITWho'),
          hidden: (form) => form.scope === 'linked'
        },
        assets: {
          ...assetJSONSelectMeta(vm),
          label: vm.$t('JITWhere'),
          helpText: vm.$t('JITWhereHelp'),
          hidden: (form) => form.scope === 'linked'
        },
        permissions: {
          component: ResourceSelect,
          label: vm.$t('JITLinkedPermissions'),
          hidden: (form) => form.mode === 'approved_window',
          helpText: vm.$t('JITPermissionsHelp'),
          el: {
            value: [],
            url: '/api/v1/perms/asset-permissions/?fields_size=mini&from_ticket=false'
          }
        },
        mode: {
          type: 'radio-group',
          options: [
            { label: vm.$t('JITModePerSession'), value: 'per_session' },
            { label: vm.$t('JITModeWhileGranted'), value: 'while_granted' },
            { label: vm.$t('JITModeApprovedWindow'), value: 'approved_window' }
          ],
          helpText: vm.$t('JITModeHelp'),
          on: {
            change: ([value], updateForm) => {
              if (value === 'approved_window') {
                updateForm({ scope: 'requests' })
              }
            }
          }
        },
        username_mode: {
          type: 'radio-group',
          options: [
            { label: vm.$t('JITNameSameAsUser'), value: 'same_as_user' },
            { label: vm.$t('JITNameSpecific'), value: 'specific' },
            { label: vm.$t('JITNameRandomFixed'), value: 'random_fixed' },
            {
              label: vm.$t('JITNameRandomSession'),
              value: 'random_session',
              disabled: false
            }
          ],
          helpText: vm.$t('JITNameHelp'),
          on: {
            change: ([value], updateForm) => {
              if (value === 'random_session') {
                updateForm({ mode: 'per_session' })
              }
            }
          }
        },
        specific_username: {
          hidden: (form) => form.username_mode !== 'specific',
          rules: [{ required: true, message: vm.$t('JITSpecificRequired'), trigger: 'blur' }]
        },
        username_prefix: {
          hidden: (form) => form.username_mode === 'specific'
        },
        privileged: {
          helpText: vm.$t('JITRightsHelp')
        },
        linux_groups: {
          helpText: vm.$t('JITLinuxGroupsHelp')
        },
        windows_groups: {
          helpText: vm.$t('JITWindowsGroupsHelp')
        },
        remove_home: {
          helpText: vm.$t('JITRemoveHomeHelp')
        },
        jit_only: {
          helpText: vm.$t('JITOnlyHelp')
        },
        self_service: {
          helpText: vm.$t('JITSelfServiceHelp')
        },
        max_hours: {
          type: 'input-number',
          el: { min: 1, max: 720 },
          helpText: vm.$t('JITMaxHoursHelp')
        },
        require_reason: {
          helpText: vm.$t('JITRequireReasonHelp')
        },
        approvals_required: {
          type: 'radio-group',
          options: [
            { label: vm.$t('JITOneApprover'), value: 1 },
            { label: vm.$t('JITTwoApprovers'), value: 2 }
          ],
          helpText: vm.$t('JITApprovalsHelp'),
          on: {
            change: ([value], updateForm) => {
              if (value === 2) updateForm({ auto_approve: false })
            }
          }
        },
        // XPAM: who approves what the rule does not approve by itself — an approval flow, or people
        approval_route: {
          type: 'radio-group',
          label: vm.$t('JITApprovalRoute'),
          options: [
            { label: vm.$t('JITRouteFlow'), value: 'flow' },
            { label: vm.$t('JITRouteApprovers'), value: 'approvers' }
          ],
          helpText: vm.$t('JITApprovalRouteHelp')
        },
        approval_flow: {
          label: vm.$t('JITApprovalFlow'),
          component: JITApprovalFlowSelect,
          hidden: (form) => form.approval_route !== 'flow',
          helpText: vm.$t('JITApprovalFlowHelp')
        },
        approvers: {
          ...userJSONSelectMeta(vm),
          label: vm.$t('JITApprovers'),
          hidden: (form) => form.approval_route !== 'approvers',
          helpText: vm.$t('JITApproversHelp')
        },
        auto_approve: {
          hidden: (form) => form.approvals_required === 2,
          helpText: vm.$t('JITAutoApproveHelp')
        },
        auto_approve_max_hours: {
          type: 'input-number',
          el: { min: 1, max: 720 },
          hidden: (form) => !form.auto_approve || form.approvals_required === 2,
          helpText: vm.$t('JITAutoApproveHoursHelp')
        },
        auto_approve_time_period: {
          component: WeekCronSelect,
          hidden: (form) => !form.auto_approve || form.approvals_required === 2,
          helpText: vm.$t('JITAutoApproveWindowHelp')
        },
        allow_extension: {
          label: 'Allow session / access extensions',
          helpText:
            'Allow users to request additional time before their active JIT access window expires'
        },
        extension_approval: {
          type: 'radio-group',
          label: 'Extension approval policy',
          options: [
            { label: 'Same as initial request', value: 'same' },
            { label: 'Approve extensions automatically', value: 'auto' },
            { label: 'Always require manual approval', value: 'manual' }
          ],
          hidden: (form) => !form.allow_extension,
          helpText:
            'Choose whether extension requests follow the rule’s initial approval policy, auto-approve, or always require manual approval via the configured Flow/Approvers'
        },
        extension_max_hours: {
          type: 'input-number',
          label: 'Longest single extension (hours)',
          el: { min: 0, max: 720 },
          hidden: (form) => !form.allow_extension,
          helpText: '0 = use Longest access (max_hours) limit'
        },
        max_extensions: {
          type: 'input-number',
          label: 'Max extensions per access',
          el: { min: 0, max: 50 },
          hidden: (form) => !form.allow_extension,
          helpText:
            '0 = unlimited extensions; set e.g. 1 or 2 to cap how many times a user can extend'
        },
        credential_type: {
          type: 'radio-group',
          options: [
            { label: vm.$t('Password'), value: 'password' },
            { label: vm.$t('JITSSHKey'), value: 'ssh_key' }
          ],
          helpText: vm.$t('JITCredentialHelp')
        },
        require_mfa: {
          helpText: vm.$t('JITRequireMFAHelp')
        },
        end_sessions_on_expiry: {
          helpText: vm.$t('JITEndSessionsHelp')
        },
        expiry_warning_minutes: {
          type: 'input-number',
          el: { min: 0, max: 240 },
          helpText: vm.$t('JITWarnHelp')
        },
        command_groups: {
          component: ResourceSelect,
          helpText: vm.$t('JITCommandGroupsHelp'),
          el: {
            value: [],
            url: '/api/v1/acls/command-groups/?fields_size=mini'
          }
        },
        command_action: {
          type: 'radio-group',
          options: [
            { label: vm.$t('JITCommandReject'), value: 'reject' },
            { label: vm.$t('JITCommandWarn'), value: 'warning' }
          ],
          hidden: (form) => !(form.command_groups || []).length
        },
        db_privilege: {
          type: 'radio-group',
          options: [
            { label: vm.$t('JITDBReadOnly'), value: 'read_only' },
            { label: vm.$t('JITDBReadWrite'), value: 'read_write' },
            { label: vm.$t('JITDBAdmin'), value: 'admin' },
            { label: vm.$t('JITDBCustom'), value: 'custom' }
          ],
          helpText: vm.$t('JITDBHelp')
        },
        db_custom_sql: {
          el: {
            type: 'textarea',
            rows: 4,
            placeholder: "GRANT SELECT ON app.* TO '{username}'@'%';"
          },
          hidden: (form) => form.db_privilege !== 'custom',
          helpText: vm.$t('JITDBCustomHelp')
        },
        device_role: {
          label: vm.$t('JITDeviceRole'),
          type: 'radio-group',
          options: [
            { label: vm.$t('JITDeviceReadOnly'), value: 'read_only' },
            { label: vm.$t('JITDeviceOperator'), value: 'operator' },
            { label: vm.$t('JITDeviceAdmin'), value: 'admin' },
            { label: vm.$t('JITDeviceCustom'), value: 'custom' }
          ],
          helpText: vm.$t('JITDeviceRoleHelp')
        },
        device_custom_role: {
          label: vm.$t('JITDeviceCustomRole'),
          el: { placeholder: 'prof_readonly / 5 / network-operator' },
          hidden: (form) => form.device_role !== 'custom',
          helpText: vm.$t('JITDeviceCustomHelp')
        },
        device_create_commands: {
          el: {
            type: 'textarea',
            rows: 5,
            placeholder:
              'enable\n{login_password}\nconfigure terminal\nusername {username} privilege 15 secret {password}\nend\nwrite memory'
          },
          helpText: vm.$t('JITDeviceCreateHelp')
        },
        device_remove_commands: {
          el: {
            type: 'textarea',
            rows: 4,
            placeholder:
              'enable\n{login_password}\nconfigure terminal\nno username {username}\nend\nwrite memory'
          },
          helpText: vm.$t('JITDeviceRemoveHelp')
        }
      },
      cleanFormValue(value) {
        if (value.mode === 'approved_window') {
          value.permissions = []
          if (value.scope === 'all') value.scope = 'requests'
        }
        if (value.username_mode !== 'specific') {
          value.specific_username = ''
        }
        if (value.approvals_required === 2) {
          value.auto_approve = false
        }
        if (value.approval_route === 'approvers') {
          value.approval_flow = null
        } else if (value.approval_flow && typeof value.approval_flow === 'object') {
          value.approval_flow = value.approval_flow.id
        }
        if (
          Array.isArray(value.auto_approve_time_period) &&
          value.auto_approve_time_period.every((item) => item.value === '')
        ) {
          value.auto_approve_time_period = []
        }
        return value
      },
      createSuccessNextRoute: { name: 'JITAccessIndex' },
      updateSuccessNextRoute: { name: 'JITAccessIndex' }
    }
  }
}
</script>
