<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'
import { ResourceSelect } from '@/components/Form/FormFields'
import WeekCronSelect from '@/components/Form/FormFields/WeekCronSelect.vue'
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
        require_mfa: false,
        end_sessions_on_expiry: true,
        expiry_warning_minutes: 15,
        command_groups: [],
        command_action: 'reject',
        credential_type: 'password',
        db_privilege: 'read_only'
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
            'approvals_required',
            'approvers',
            'auto_approve',
            'auto_approve_max_hours',
            'auto_approve_time_period'
          ]
        ],
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
        [vm.$t('JITDevices'), ['device_create_commands', 'device_remove_commands']],
        [vm.$t('JITRemoval'), ['remove_home']],
        [vm.$t('Other'), ['comment']]
      ],
      fieldsMeta: {
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
        approvers: {
          ...userJSONSelectMeta(vm),
          label: vm.$t('JITApprovers'),
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
