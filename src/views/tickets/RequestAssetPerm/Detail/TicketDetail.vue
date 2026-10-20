<template>
  <GenericTicketDetail
    :approve="handleApprove"
    :assigned-card-items="assignedCardItems"
    :close="handleClose"
    :object="object"
    :reject="handleReject"
    :special-card-items="specialCardItems"
  >
    <IBox v-if="hasActionPerm && object.status.value !== 'closed'" class="box">
      <template #header>
        <div class="clearfix ibox-title"><i class="fa fa-edit" /> {{ $tc('Actions') }}</div>
      </template>
      <el-form
        ref="requestForm"
        :model="requestForm"
        class="assets"
        label-position="left"
        label-width="auto"
      >
        <el-form-item :label="$tc('Node')">
          <Select2 v-bind="nodeSelect2" v-model="requestForm.nodes" style="width: 50% !important" />
        </el-form-item>
        <el-form-item :label="$tc('Asset')">
          <Select2
            v-bind="assetSelect2"
            v-model="requestForm.assets"
            style="width: 50% !important"
          />
        </el-form-item>
        <el-form-item :label="$tc('Account')" :rules="isRequired">
          <div v-if="jitRequested" class="jit-acc">
            <el-tag type="success">{{ $t('JITAccount') }}</el-tag>
            <span class="jit-acc-help">{{ $t('JITReqApproverHelp') }}</span>
            <el-button link type="primary" size="small" @click="showOthers = !showOthers">
              {{ showOthers ? $t('JITReqHideExisting') : $t('JITReqAddExisting') }}
            </el-button>
          </div>
          <AccountFormatter
            v-if="!jitRequested || showOthers || otherAccounts.length"
            v-model="otherAccounts"
            :assets="requestForm.assets"
            :nodes="requestForm.nodes"
            :oid="requestForm.oid"
            :show-add-template="false"
            style="width: 50% !important"
          />
        </el-form-item>
        <el-form-item :label="$tc('DateStart')" required>
          <el-date-picker v-model="requestForm.apply_date_start" type="datetime" />
        </el-form-item>
        <el-form-item :label="$tc('DateExpired')" required>
          <el-date-picker v-model="requestForm.apply_date_expired" type="datetime" />
        </el-form-item>
        <el-form-item :label="$tc('Action')">
          <BasicTree v-model="requestForm.actions" :tree="treeNodes" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('JITAccount')">
          <el-select v-model="requestForm.jit" style="width: 50% !important">
            <el-option :label="$t('JITAutomatic')" value="auto" />
            <el-option :label="$t('JITNoAccount')" value="none" />
            <el-option
              v-for="p of jitPolicies"
              :key="p.id"
              :label="`${p.name} (${p.mode?.label || ''})`"
              :value="p.id"
            />
          </el-select>
          <div v-if="requestForm.jit === 'auto' && jitPreview.length" class="jit-preview">
            <div v-for="(group, i) of jitPreviewGroups" :key="i">
              <el-tag v-if="group.policy" size="small" type="success">{{ group.policy }}</el-tag>
              <el-tag v-else size="small" type="info">{{ $t('JITNoAccount') }}</el-tag>
              <span class="jit-preview-assets">{{ group.assets }}</span>
              <span v-if="!group.policy" class="jit-preview-reason">— {{ group.reason }}</span>
            </div>
            <div v-if="jitPreviewLimited" class="jit-preview-reason">
              {{ $t('JITCheckLimited') }}
            </div>
          </div>
        </el-form-item>
      </el-form>
    </IBox>
  </GenericTicketDetail>
</template>

<script lang="jsx">
import IBox from '@/components/Common/IBox'
import BasicTree from '@/components/Form/FormFields/BasicTree'
import Select2 from '@/components/Form/FormFields/Select2'
import AccountFormatter from '@/views/perms/AssetPermission/components/AccountFormatter'
import { AccountLabelMapper } from '@/views/perms/const'
import GenericTicketDetail from '@/views/tickets/components/GenericTicketDetail'
import { STATUS_MAP, treeNodes } from '../../const'

const toOption = (item) => ({
  label: item.name,
  value: item.id
})

export default {
  name: '',
  components: {
    GenericTicketDetail,
    IBox,
    Select2,
    AccountFormatter,
    BasicTree
  },
  props: {
    object: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      treeNodes,
      statusMap:
        this.object.status.value === 'open'
          ? STATUS_MAP['pending']
          : STATUS_MAP[this.object.state.value],
      requestForm: {
        nodes: this.object.apply_nodes?.map((i) => i.id),
        assets: this.object.apply_assets?.map((i) => i.id),
        accounts: this.object.apply_accounts,
        actions: this.object.apply_actions,
        oid: this.object.org_id,
        apply_date_expired: this.object.apply_date_expired,
        apply_date_start: this.object.apply_date_start,
        jit: this.object.apply_jit || 'auto'
      },
      jitPolicies: [],
      jitRequested: (this.object.apply_accounts || []).includes('@JIT'),
      otherAccounts: (this.object.apply_accounts || []).filter((a) => a !== '@JIT'),
      showOthers: false,
      jitPreview: [],
      jitPreviewLimited: false,
      nodeSelect2: {
        multiple: true,
        options: (this.object.apply_nodes || []).map(toOption),
        ajax: {
          url: (function (object) {
            const oid = object.org_id
            return `/api/v1/assets/nodes/?oid=${oid}&protocol__in=rdp,vnc,ssh,telnet`
          })(this.object),
          transformOption: toOption
        }
      },
      assetSelect2: {
        multiple: true,
        options: (this.object.apply_assets || []).map(toOption),
        ajax: {
          url: (function (object) {
            const oid = object.org_id
            return `/api/v1/assets/assets/?oid=${oid}&protocol__in=rdp,vnc,ssh,telnet`
          })(this.object),
          transformOption: toOption
        }
      }
    }
  },
  computed: {
    isRequired() {
      if (this.object.approval_step.value === this.object.process_map.length) {
        return [
          {
            required: true
          }
        ]
      }
      return [
        {
          required: false
        }
      ]
    },
    specialCardItems() {
      const { object } = this
      return [
        {
          key: this.$tc('Node'),
          value: object.apply_nodes.map((item) => item.name).join(', ')
        },
        {
          key: this.$tc('Asset'),
          value: object.apply_assets.map((item) => item.name).join(', ')
        },
        {
          key: this.$tc('Account'),
          value: object.apply_accounts.map((item) => AccountLabelMapper[item] || item).join(', ')
        },
        {
          key: this.$tc('Action'),
          value: object.apply_actions.map((item) => item.label).join(', ')
        },
        {
          key: this.$tc('DateStart'),
          value: object.apply_date_start
        },
        {
          key: this.$tc('DateExpired'),
          value: object.apply_date_expired
        },
        {
          key: this.$t('JITAccount'),
          value: object.apply_jit_auto
            ? `${object.apply_jit_display} · ${this.$t('JITApprovedAutomaticallyBy', { policy: object.apply_jit_auto })}`
            : object.apply_jit_display
        }
      ]
    },
    assignedCardItems() {
      const vm = this
      const { object } = this
      return [
        {
          key: this.$tc('PermissionName'),
          value: object.apply_permission_name,
          formatter: function (item, value) {
            const to = {
              name: 'AssetPermissionDetail',
              params: {
                id: object.id
              },
              query: {
                oid: object.org_id
              }
            }
            if (
              vm.$hasPerm('perms.view_assetpermission') &&
              object.status.value === 'closed' &&
              object.state.value === 'approved'
            ) {
              return <router-link to={to}>{value}</router-link>
            } else {
              return <span>{value}</span>
            }
          }
        },
        {
          key: this.$tc('Node'),
          value: object.apply_nodes.map((item) => item.name).join(', ')
        },
        {
          key: this.$tc('Asset'),
          value: object.apply_assets.map((item) => item.name).join(', ')
        },
        {
          key: this.$tc('Account'),
          value: object.apply_accounts.map((item) => AccountLabelMapper[item] || item).join(', ')
        },
        {
          key: this.$tc('Action'),
          value: object.apply_actions.map((item) => item.label).join(', ')
        },
        {
          key: this.$tc('DateStart'),
          value: object.apply_date_start
        },
        {
          key: this.$tc('DateExpired'),
          value: object.apply_date_expired
        },
        {
          key: this.$t('JITAccount'),
          value: object.apply_jit_auto
            ? `${object.apply_jit_display} · ${this.$t('JITApprovedAutomaticallyBy', { policy: object.apply_jit_auto })}`
            : object.apply_jit_display
        }
      ]
    },
    jitPreviewGroups() {
      const groups = {}
      for (const r of this.jitPreview) {
        const key = r.policy ? `p:${r.policy.id}` : `n:${r.reason}`
        if (!groups[key]) {
          groups[key] = { policy: r.policy?.name || '', reason: r.reason, assets: [] }
        }
        groups[key].assets.push(r.asset.name)
      }
      return Object.values(groups).map((g) => ({ ...g, assets: g.assets.join(', ') }))
    },
    hasActionPerm() {
      const approval_step = this.object.approval_step.value
      const current_user_id = this.$store.state.users.profile.id
      return (
        this.object.process_map
          .filter((item) => item.approval_level === approval_step)[0]
          .assignees.indexOf(current_user_id) !== -1
      )
    }
  },
  watch: {
    'requestForm.assets'() {
      this.loadJitPreview()
    },
    'requestForm.nodes'() {
      this.loadJitPreview()
    }
  },
  mounted() {
    if (this.object.status.value !== 'closed' && this.$hasPerm('accounts.view_jitpolicy')) {
      this.$axios
        .get(`/api/v1/accounts/jit-policies/?is_active=true&oid=${this.object.org_id}`)
        .then((res) => {
          this.jitPolicies = Array.isArray(res) ? res : res.results || []
        })
        .catch(() => {})
      this.loadJitPreview()
    }
  },
  methods: {
    loadJitPreview() {
      if (!this.$hasPerm('accounts.view_jitpolicy') || this.object.status.value === 'closed') return
      const assets = this.requestForm.assets || []
      const nodes = this.requestForm.nodes || []
      if (!assets.length && !nodes.length) {
        this.jitPreview = []
        return
      }
      const params = new URLSearchParams({
        ticket: this.object.id,
        assets: assets.join(','),
        nodes: nodes.join(','),
        request: '1',
        oid: this.object.org_id
      })
      this.$axios
        .get(`/api/v1/accounts/jit-policies/match/?${params.toString()}`, {
          disableFlashErrorMsg: true
        })
        .then((res) => {
          this.jitPreview = res.results || []
          this.jitPreviewLimited = !!res.limited
        })
        .catch(() => {
          this.jitPreview = []
        })
    },
    reloadPage() {
      window.location.reload()
    },
    handleApprove() {
      const nodes = this.requestForm.nodes
      const assets = this.requestForm.assets
      // "No just-in-time account" chosen: the @JIT account would never work, so it is not granted
      const withJit = this.jitRequested && this.requestForm.jit !== 'none'
      const accounts = [...(withJit ? ['@JIT'] : []), ...(this.otherAccounts || [])]
      if (this.object.approval_step.value === this.object.process_map.length) {
        if (assets.length === 0 && nodes.length === 0) {
          this.$message.error(this.$tc('SelectAtLeastOneAssetOrNodeErrMsg'))
          return
        } else if (accounts.length === 0) {
          this.$message.error(this.$tc('RequiredSystemUserErrMsg'))
          return
        }
      }
      return this.$axios
        .patch(`/api/v1/tickets/apply-asset-tickets/${this.object.id}/approve/`, {
          flow_id: this.object.flow?.id,
          apply_nodes: nodes || [],
          apply_assets: assets || [],
          apply_accounts: accounts || [],
          org_id: this.object.org_id,
          apply_actions: this.requestForm.actions,
          apply_date_start: this.requestForm.apply_date_start,
          apply_date_expired: this.requestForm.apply_date_expired,
          apply_jit: this.requestForm.jit
        })
        .then(() => {
          this.$message.success(this.$tc('UpdateSuccessMsg'))
          this.reloadPage()
        })
    },
    handleClose() {
      const url = `/api/v1/tickets/apply-asset-tickets/${this.object.id}/close/`
      this.$axios
        .put(url)
        .then((res) => this.reloadPage())
        .catch((err) => this.$message.error(err))
    },
    handleReject() {
      const url = `/api/v1/tickets/apply-asset-tickets/${this.object.id}/reject/`
      this.$axios
        .put(url)
        .then((res) => this.reloadPage())
        .catch((err) => this.$message.error(err))
    }
  }
}
</script>

<style scoped>
.assets {
  margin-top: 14px;
}

/* 开始/失效日期:与上方字段一致 50% 宽度;并修正时钟前缀图标
   (全站 mixin 的 .el-input__icon{vertical-align:super} 会让图标偏上/错位) */
.assets :deep(.el-date-editor.el-input) {
  width: 50%;

  .el-input__prefix,
  .el-input__prefix-inner {
    display: inline-flex;
    align-items: center;
  }

  .el-input__icon {
    vertical-align: middle;
    height: auto;
  }
}

.feed-activity-list .feed-element {
  border-bottom: 1px solid #e7eaec;
}

.feed-element > .pull-left {
  margin-right: 10px;
}

.feed-element .header-avatar {
  width: 38px;
  height: 38px;
}

.box {
  margin-bottom: 15px;
}

.jit-acc {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 6px;
}

.jit-acc-help {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.jit-preview {
  width: 100%;
  margin-top: 6px;
  line-height: 24px;
}

.jit-preview-assets {
  margin-left: 6px;
}

.jit-preview-reason {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
}
</style>
