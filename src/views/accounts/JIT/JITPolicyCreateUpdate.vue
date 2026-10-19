<template>
  <GenericCreateUpdatePage v-bind="$data" />
</template>

<script>
import GenericCreateUpdatePage from '@/layout/components/GenericCreateUpdatePage'
import { ResourceSelect } from '@/components/Form/FormFields'
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
        users: { type: 'all' },
        assets: { type: 'all' },
        priority: 50,
        is_active: true,
        permissions: []
      },
      fields: [
        [vm.$t('Basic'), ['name', 'priority', 'is_active']],
        [vm.$t('JITRules'), ['scope', 'users', 'assets', 'permissions']],
        [vm.$t('JITLifetime'), ['mode']],
        [vm.$t('JITAccountName'), ['username_mode', 'specific_username', 'username_prefix']],
        [vm.$t('JITRights'), ['privileged']],
        [vm.$t('JITLinux'), ['linux_shell', 'linux_groups']],
        [vm.$t('JITWindows'), ['windows_groups']],
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
        return value
      },
      createSuccessNextRoute: { name: 'JITAccessIndex' },
      updateSuccessNextRoute: { name: 'JITAccessIndex' }
    }
  }
}
</script>
