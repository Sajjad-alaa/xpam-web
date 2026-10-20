<template>
  <el-dialog
    :model-value="visible"
    :title="$t('JITWizardTitle')"
    width="760px"
    append-to-body
    destroy-on-close
    @update:model-value="(v) => !v && close()"
  >
    <el-steps :active="step" finish-status="success" simple class="wiz-steps">
      <el-step :title="$t('JITWizStart')" />
      <el-step :title="$t('JITWho')" />
      <el-step :title="$t('JITWhere')" />
      <el-step :title="$t('JITWizHow')" />
      <el-step :title="$t('JITWizHowLong')" />
    </el-steps>

    <!-- 0: template -->
    <div v-if="step === 0" class="wiz-body">
      <p class="wiz-q">{{ $t('JITWizStartQ') }}</p>
      <div class="wiz-cards">
        <div
          v-for="t of templates"
          :key="t.key"
          class="wiz-card"
          :class="{ active: template === t.key }"
          @click="pick(t)"
        >
          <el-icon :size="22"><component :is="t.icon" /></el-icon>
          <div class="wiz-card-title">{{ t.title }}</div>
          <div class="wiz-card-sub">{{ t.sub }}</div>
        </div>
      </div>
    </div>

    <!-- 1: who -->
    <div v-if="step === 1" class="wiz-body">
      <p class="wiz-q">{{ $t('JITWizWhoQ') }}</p>
      <JSONManyToManySelect
        v-bind="userMeta.el"
        :value="form.users"
        @input="(v) => (form.users = v)"
      />
    </div>

    <!-- 2: where -->
    <div v-if="step === 2" class="wiz-body">
      <p class="wiz-q">{{ $t('JITWizWhereQ') }}</p>
      <JSONManyToManySelect
        v-bind="assetMeta.el"
        :value="form.assets"
        @input="(v) => (form.assets = v)"
      />
      <p class="wiz-hint">{{ $t('JITWhereHelp') }}</p>
    </div>

    <!-- 3: how do they get in -->
    <div v-if="step === 3" class="wiz-body">
      <p class="wiz-q">{{ $t('JITWizHowQ') }}</p>
      <div class="wiz-cards">
        <div
          v-for="o of approvalOptions"
          :key="o.key"
          class="wiz-card"
          :class="{ active: approval === o.key }"
          @click="approval = o.key"
        >
          <el-icon :size="22"><component :is="o.icon" /></el-icon>
          <div class="wiz-card-title">{{ o.title }}</div>
          <div class="wiz-card-sub">{{ o.sub }}</div>
        </div>
      </div>
      <div v-if="approval !== 'instant'" class="wiz-approvers">
        <p class="wiz-q">{{ $t('JITWizWhoApproves') }}</p>
        <el-radio-group v-model="approverMode">
          <el-radio value="flow">{{ $t('JITWizApproverFlow') }}</el-radio>
          <el-radio value="people">{{ $t('JITWizApproverPeople') }}</el-radio>
        </el-radio-group>
        <JSONManyToManySelect
          v-if="approverMode === 'people'"
          v-bind="approverMeta.el"
          :value="form.approvers"
          class="wiz-approver-select"
          @input="(v) => (form.approvers = v)"
        />
      </div>
      <div class="wiz-switches">
        <el-switch v-model="form.privileged" :active-text="$t('JITWizAdminRights')" />
        <el-switch v-model="form.require_mfa" :active-text="$t('JITWizMFA')" />
      </div>
    </div>

    <!-- 4: how long + name -->
    <div v-if="step === 4" class="wiz-body">
      <p class="wiz-q">{{ $t('JITWizHowLongQ') }}</p>
      <el-radio-group v-model="form.max_hours" class="wiz-hours">
        <el-radio-button v-for="h of [1, 2, 4, 8]" :key="h" :value="h">{{ h }} h</el-radio-button>
      </el-radio-group>
      <el-input-number
        v-model="form.max_hours"
        :min="1"
        :max="720"
        :value-on-clear="2"
        class="wiz-custom"
      />
      <p class="wiz-q wiz-name-q">{{ $t('JITWizName') }}</p>
      <el-input v-model="form.name" :placeholder="$t('Name')" maxlength="128" />
      <el-alert type="success" :closable="false" class="wiz-summary" :title="summary" />
      <el-alert
        v-if="broad"
        type="warning"
        :closable="false"
        show-icon
        class="wiz-summary"
        :title="$t('JITWizBroadWarning')"
      />
      <p class="wiz-hint">{{ $t('JITWizDefaults') }}</p>
    </div>

    <template #footer>
      <div class="wiz-footer">
        <el-button link type="primary" @click="advanced">{{ $t('JITWizAdvanced') }}</el-button>
        <span>
          <el-button v-if="step > 0" @click="step--">{{ $t('JITWizBack') }}</el-button>
          <el-button v-if="step < 4" type="primary" :disabled="!canNext" @click="step++">
            {{ $t('JITWizNext') }}
          </el-button>
          <el-button v-else type="primary" :loading="saving" :disabled="!form.name" @click="save">
            {{ $t('JITWizCreate') }}
          </el-button>
        </span>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { markRaw } from 'vue'
import { Lightning, Stamp, Lock, EditPen, Avatar, UserFilled } from '@element-plus/icons-vue'
import JSONManyToManySelect from '@/components/Form/FormFields/JSONManyToManySelect/index.vue'
import { assetJSONSelectMeta } from '@/views/assets/const'
import { userJSONSelectMeta } from '@/views/users/const'

export default {
  name: 'JITRuleWizard',
  components: { JSONManyToManySelect },
  props: { visible: { type: Boolean, default: false } },
  emits: ['update:visible', 'created', 'advanced'],
  data() {
    const vm = this
    return {
      step: 0,
      saving: false,
      template: 'dev',
      approval: 'instant',
      userMeta: userJSONSelectMeta(vm),
      approverMeta: userJSONSelectMeta(vm),
      approverMode: 'flow',
      assetMeta: assetJSONSelectMeta(vm),
      form: {
        name: '',
        users: { type: 'ids', ids: [] },
        assets: { type: 'ids', ids: [] },
        privileged: false,
        require_mfa: false,
        device_role: 'read_only',
        max_hours: 2,
        approvers: { type: 'ids', ids: [] }
      },
      templates: [
        {
          key: 'dev',
          icon: markRaw(Lightning),
          title: vm.$t('JITTplDev'),
          sub: vm.$t('JITTplDevSub'),
          set: {
            approval: 'instant',
            max_hours: 2,
            privileged: false,
            require_mfa: false,
            device_role: 'read_only'
          }
        },
        {
          key: 'ops',
          icon: markRaw(Stamp),
          title: vm.$t('JITTplOps'),
          sub: vm.$t('JITTplOpsSub'),
          set: {
            approval: 'one',
            max_hours: 8,
            privileged: true,
            require_mfa: false,
            device_role: 'operator'
          }
        },
        {
          key: 'admin',
          icon: markRaw(Lock),
          title: vm.$t('JITTplAdmin'),
          sub: vm.$t('JITTplAdminSub'),
          set: {
            approval: 'two',
            max_hours: 1,
            privileged: true,
            require_mfa: true,
            device_role: 'admin'
          }
        },
        {
          key: 'blank',
          icon: markRaw(EditPen),
          title: vm.$t('JITTplBlank'),
          sub: vm.$t('JITTplBlankSub'),
          set: {}
        }
      ],
      approvalOptions: [
        {
          key: 'instant',
          icon: markRaw(Lightning),
          title: vm.$t('JITWizInstant'),
          sub: vm.$t('JITWizInstantSub')
        },
        {
          key: 'one',
          icon: markRaw(Avatar),
          title: vm.$t('JITWizOne'),
          sub: vm.$t('JITWizOneSub')
        },
        {
          key: 'two',
          icon: markRaw(UserFilled),
          title: vm.$t('JITWizTwo'),
          sub: vm.$t('JITWizTwoSub')
        }
      ]
    }
  },
  computed: {
    canNext() {
      if (this.step === 1) return this.chosen(this.form.users)
      if (this.step === 2) return this.chosen(this.form.assets)
      if (this.step === 3 && this.approval !== 'instant' && this.approverMode === 'people') {
        return this.chosen(this.form.approvers)
      }
      return true
    },
    broad() {
      return this.form.users?.type === 'all' || this.form.assets?.type === 'all'
    },
    summary() {
      const how = this.approvalOptions.find((o) => o.key === this.approval)?.title || ''
      return this.$t('JITWizSummary', {
        how,
        hours: this.form.max_hours,
        rights: this.form.privileged ? this.$t('JITWizAdminRights') : this.$t('JITWizNormalRights'),
        mfa: this.form.require_mfa ? ' · MFA' : ''
      })
    }
  },
  watch: {
    visible(v) {
      if (v) this.reset()
    }
  },
  methods: {
    chosen(value) {
      if (!value?.type) return false
      if (value.type === 'all') return true
      if (value.type === 'ids') return (value.ids || []).length > 0
      return (value.attrs || []).length > 0
    },
    reset() {
      this.step = 0
      this.template = 'dev'
      this.approval = 'instant'
      this.approverMode = 'flow'
      this.form = {
        name: '',
        users: { type: 'ids', ids: [] },
        assets: { type: 'ids', ids: [] },
        privileged: false,
        require_mfa: false,
        device_role: 'read_only',
        max_hours: 2,
        approvers: { type: 'ids', ids: [] }
      }
    },
    pick(t) {
      this.template = t.key
      const { approval, ...rest } = t.set
      // start from the defaults: going back and choosing another template must not keep the old values
      const keep = {
        users: this.form.users,
        assets: this.form.assets,
        approvers: this.form.approvers
      }
      this.form = {
        name: '',
        privileged: false,
        require_mfa: false,
        device_role: 'read_only',
        max_hours: 2,
        ...keep
      }
      this.approval = approval || 'instant'
      Object.assign(this.form, rest)
      if (t.key !== 'blank') this.form.name = t.title
      this.step = 1
    },
    payload() {
      const auto = this.approval === 'instant'
      return {
        name: this.form.name.trim(),
        scope: 'all',
        users: this.form.users,
        assets: this.form.assets,
        // specific users and servers win over broad rules
        priority:
          20 +
          (this.form.users?.type === 'all' ? 20 : 0) +
          (this.form.assets?.type === 'all' ? 20 : 0),
        mode: 'per_session',
        username_mode: 'same_as_user',
        username_prefix: 'xpam-',
        privileged: this.form.privileged,
        // network devices: Developers read only, Operations operator, Administrators administrator
        device_role: this.form.device_role,
        require_mfa: this.form.require_mfa,
        jit_only: true,
        self_service: true,
        require_reason: true,
        max_hours: this.form.max_hours,
        auto_approve: auto,
        auto_approve_max_hours: this.form.max_hours,
        approvals_required: this.approval === 'two' ? 2 : 1,
        approvers:
          this.approval !== 'instant' && this.approverMode === 'people' ? this.form.approvers : {},
        end_sessions_on_expiry: true,
        expiry_warning_minutes: 15,
        is_active: true
      }
    },
    save() {
      this.saving = true
      this.$axios
        .post('/api/v1/accounts/jit-policies/', this.payload())
        .then(() => {
          this.$message.success(this.$t('JITWizCreated'))
          this.$emit('created')
          this.close()
        })
        .finally(() => {
          this.saving = false
        })
    },
    advanced() {
      this.$emit('advanced')
      this.close()
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.wiz-steps {
  margin-bottom: 16px;
}

.wiz-body {
  min-height: 230px;
}

.wiz-q {
  margin: 4px 0 12px;
  font-weight: 600;
}

.wiz-name-q {
  margin-top: 18px;
}

.wiz-hint {
  margin-top: 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.wiz-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.wiz-card {
  padding: 14px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s;
}

.wiz-card:hover,
.wiz-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.wiz-card-title {
  margin-top: 6px;
  font-weight: 600;
}

.wiz-card-sub {
  margin-top: 4px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.wiz-switches {
  display: flex;
  gap: 24px;
  margin-top: 18px;
}

.wiz-approvers {
  margin-top: 16px;
}

.wiz-approver-select {
  margin-top: 8px;
}

.wiz-custom {
  margin-left: 12px;
}

.wiz-summary {
  margin-top: 14px;
}

.wiz-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
