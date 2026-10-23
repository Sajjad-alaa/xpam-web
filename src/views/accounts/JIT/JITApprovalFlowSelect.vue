<template>
  <div class="jit-flow-select">
    <div class="jit-flow-row">
      <el-select
        :model-value="selected"
        :placeholder="defaultLabel"
        clearable
        class="jit-flow-dropdown"
        @update:model-value="onChange"
      >
        <el-option v-for="flow of flows" :key="flow.id" :label="label(flow)" :value="flow.id">
          <div class="jit-flow-opt">
            <span>{{ label(flow) }}</span>
            <el-tag size="small" type="info" effect="plain">
              {{ flow.approval_level || (flow.route && flow.route.length) || 1 }}
              {{ (flow.approval_level || 1) > 1 ? 'Levels' : 'Level' }}
            </el-tag>
          </div>
        </el-option>
      </el-select>

      <el-button v-if="canAddFlow" size="default" type="primary" plain @click="openCreateDialog">
        <i class="fa fa-plus" style="margin-right: 4px" />
        New Flow
      </el-button>

      <el-button
        v-if="canChangeFlow && shown && shown.is_org_flow"
        size="default"
        @click="openEditDialog(shown)"
      >
        <i class="fa fa-pencil" style="margin-right: 4px" />
        Edit Flow
      </el-button>
    </div>

    <div v-if="shown" class="jit-flow-route">
      <div class="jit-flow-route-head">
        <span class="jit-flow-route-title">
          <i class="fa fa-sitemap" style="margin-right: 5px" />
          <b>{{ shown.name }}</b>
          <el-tag
            v-if="shown.default"
            size="small"
            type="success"
            effect="plain"
            style="margin-left: 6px"
          >
            {{ $t('JITFlowDefaultTag') }}
          </el-tag>
        </span>
        <span class="jit-flow-level-badge">
          {{ (shown.route && shown.route.length) || shown.approval_level || 1 }}-Step Approval Chain
        </span>
      </div>

      <div v-for="step of shown.route" :key="step.level" class="jit-flow-step-row">
        <span class="jit-flow-level">{{ $t('JITFlowLevel', { n: step.level }) }}</span>
        <span class="jit-flow-approvers">
          {{ step.approvers.join(', ') || '-' }}
          <span v-if="step.more" class="jit-flow-more">
            {{ $t('JITFlowMore', { n: step.more }) }}
          </span>
        </span>
      </div>
      <div v-if="!shown.route || !shown.route.length">{{ $t('JITFlowNoLevels') }}</div>

      <div v-if="shown.cc_users && shown.cc_users.length" class="jit-flow-meta">
        <span><b>CC:</b> {{ shown.cc_users.map((u) => u.name).join(', ') }}</span>
      </div>

      <div v-if="shown.jit_policies && shown.jit_policies.length" class="jit-flow-meta">
        <span>
          <b>Linked JIT Rules:</b>
          <el-tag
            v-for="p of shown.jit_policies"
            :key="p.id"
            size="small"
            effect="plain"
            style="margin-left: 4px"
          >
            {{ p.name }}
          </el-tag>
        </span>
      </div>
    </div>

    <div v-else-if="loaded && !flows.length" class="jit-flow-route">
      {{ $t('JITFlowNone') }}
    </div>

    <!-- Inline Approval Flow Create / Edit Dialog (never leaves the JIT Policy or Wizard!) -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingFlowId ? 'Edit Ticket Approval Flow' : 'Create Ticket Approval Flow'"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <el-form label-position="top" size="default">
        <el-form-item label="Approval Flow Name" required>
          <el-input
            v-model="flowForm.name"
            maxlength="128"
            placeholder="e.g. Production Servers 2-Step Approval"
          />
        </el-form-item>

        <el-form-item label="Number of Approval Levels">
          <el-radio-group v-model="flowForm.approval_level" @change="syncRuleLevels">
            <el-radio-button :value="1">1 Level (Single Approver)</el-radio-button>
            <el-radio-button :value="2">2 Levels (Four-Eyes / Dual Approval)</el-radio-button>
            <el-radio-button :value="3">3 Levels</el-radio-button>
            <el-radio-button :value="4">4 Levels</el-radio-button>
            <el-radio-button :value="5">5 Levels</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <div v-for="(rule, idx) of activeRules" :key="idx" class="jit-inline-level-box">
          <div class="jit-inline-level-title">Level {{ idx + 1 }} Approvers</div>
          <JSONManyToManySelect
            v-bind="userMeta.el"
            :value="rule.users"
            @input="(v) => (rule.users = v)"
          />
        </div>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('Cancel') || 'Cancel' }}</el-button>
        <el-button type="primary" :loading="savingFlow" @click="saveInlineFlow">
          {{ $t('Save') || 'Save & Select Flow' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { JSONManyToManySelect } from '@/components/Form/FormFields'
import { userJSONSelectMeta } from '@/views/users/const'

export default {
  name: 'JITApprovalFlowSelect',
  components: {
    JSONManyToManySelect
  },
  inheritAttrs: false,
  props: {
    value: {
      type: [Object, String],
      default: null
    },
    modelValue: {
      type: [Object, String],
      default: null
    }
  },
  emits: ['input', 'update:modelValue', 'flow-selected'],
  data() {
    return {
      flows: [],
      loaded: false,
      dialogVisible: false,
      savingFlow: false,
      editingFlowId: null,
      userMeta: userJSONSelectMeta(this),
      flowForm: {
        name: '',
        approval_level: 1,
        rules: [1, 2, 3, 4, 5].map((level) => ({ level, users: { type: 'ids', ids: [] } }))
      }
    }
  },
  computed: {
    selected() {
      const v =
        this.modelValue !== null && this.modelValue !== undefined ? this.modelValue : this.value
      return (v && typeof v === 'object' ? v.id : v) || ''
    },
    defaultFlow() {
      return this.flows.find((f) => f.default) || this.flows[0] || null
    },
    defaultLabel() {
      return this.defaultFlow
        ? this.$t('JITFlowDefault', { name: this.defaultFlow.name })
        : this.$t('JITFlowNone')
    },
    shown() {
      return this.flows.find((f) => f.id === this.selected) || this.defaultFlow
    },
    // (approval flows govern every access request: the ticket flow permissions, not the rule ones)
    canAddFlow() {
      return this.$hasPerm('tickets.add_ticketflow')
    },
    canChangeFlow() {
      return this.$hasPerm('tickets.change_ticketflow')
    },
    activeRules() {
      return this.flowForm.rules.slice(0, this.flowForm.approval_level)
    }
  },
  async mounted() {
    await this.loadFlows()
  },
  methods: {
    async loadFlows() {
      try {
        this.flows = await this.$axios.get('/api/v1/accounts/jit-policies/approval-flows/')
      } catch (e) {
        this.flows = []
      }
      this.loaded = true
      if (this.shown) {
        this.$emit('flow-selected', this.shown)
      }
    },
    label(flow) {
      return flow.default ? `${flow.name} (${this.$t('JITFlowDefaultTag')})` : flow.name
    },
    onChange(id) {
      const payload = id || null
      this.$emit('input', payload)
      this.$emit('update:modelValue', payload)
      const matched = this.flows.find((f) => f.id === payload) || this.defaultFlow
      this.$emit('flow-selected', matched || null)
    },
    syncRuleLevels() {
      while (this.flowForm.rules.length < this.flowForm.approval_level) {
        this.flowForm.rules.push({
          level: this.flowForm.rules.length + 1,
          users: { type: 'ids', ids: [] }
        })
      }
    },
    openCreateDialog() {
      this.editingFlowId = null
      this.flowForm = {
        name: '',
        approval_level: 1,
        rules: [1, 2, 3, 4, 5].map((level) => ({ level, users: { type: 'ids', ids: [] } }))
      }
      this.dialogVisible = true
    },
    openEditDialog(flow) {
      if (!flow) return
      this.editingFlowId = flow.id
      const existing = Array.isArray(flow.rules) ? flow.rules : []
      const rules = [1, 2, 3, 4, 5].map((lvl) => {
        const found = existing.find((r) => Number(r.level) === lvl)
        return {
          level: lvl,
          users:
            found && found.users
              ? JSON.parse(JSON.stringify(found.users))
              : { type: 'ids', ids: [] }
        }
      })
      this.flowForm = {
        name: flow.name || '',
        approval_level: Math.min(
          5,
          Math.max(1, Number(flow.approval_level) || existing.length || 1)
        ),
        rules
      }
      this.dialogVisible = true
    },
    async saveInlineFlow() {
      const name = (this.flowForm.name || '').trim()
      if (!name) {
        this.$message.warning('Please enter a name for the approval flow')
        return
      }
      const rules = this.activeRules.map((r, idx) => ({
        level: idx + 1,
        users: r.users || { type: 'ids', ids: [] }
      }))
      this.savingFlow = true
      try {
        const saved = await this.$axios.post('/api/v1/accounts/jit-policies/approval-flows/', {
          id: this.editingFlowId || undefined,
          name,
          approval_level: this.flowForm.approval_level,
          rules
        })
        await this.loadFlows()
        if (saved && saved.id) {
          this.onChange(saved.id)
        }
        this.dialogVisible = false
        this.$message.success(this.$t('UpdateSuccessMsg') || 'Approval flow saved')
      } catch (e) {
        const detail = e?.response?.data
        const msg =
          (typeof detail === 'object' && detail ? Object.values(detail).flat().join('; ') : '') ||
          e?.message ||
          'Failed to save approval flow'
        this.$message.error(msg)
      } finally {
        this.savingFlow = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.jit-flow-select {
  width: 100%;
}

.jit-flow-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.jit-flow-dropdown {
  flex: 1;
}

.jit-flow-opt {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.jit-flow-route {
  margin-top: 8px;
  padding: 10px 12px;
  line-height: 1.7;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.jit-flow-route-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.jit-flow-level-badge {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.jit-flow-step-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.jit-flow-level {
  display: inline-block;
  min-width: 65px;
  font-weight: 600;
  color: var(--el-color-primary);
}

.jit-flow-more {
  margin-left: 4px;
  color: var(--el-text-color-secondary);
}

.jit-flow-meta {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.jit-inline-level-box {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-blank);
}

.jit-inline-level-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}
</style>
