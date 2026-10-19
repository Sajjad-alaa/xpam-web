<template>
  <div class="req-acc">
    <!-- servers a just-in-time rule covers: no account to choose -->
    <div v-if="coverage.covered.length && !useExisting" class="req-acc-jit">
      <el-icon class="req-acc-icon"><Key /></el-icon>
      <div class="req-acc-text">
        <div class="req-acc-title">{{ $t('JITReqTitle') }}</div>
        <div class="req-acc-sub">
          {{
            coverage.uncovered.length
              ? $t('JITReqSomeCovered', { assets: coveredNames })
              : $t('JITReqAllCovered')
          }}
        </div>
        <el-button
          v-if="!coverage.jit_only && !coverage.uncovered.length"
          link
          type="primary"
          size="small"
          @click="setExisting(true)"
        >
          {{ $t('JITReqUseExisting') }}
        </el-button>
        <div v-if="coverage.jit_only" class="req-acc-sub">{{ $t('JITReqOnlyJIT') }}</div>
      </div>
    </div>

    <!-- servers without a rule (or the user wants an existing account) -->
    <template v-if="!coverage.covered.length || coverage.uncovered.length || useExisting">
      <div
        v-if="coverage.uncovered.length && coverage.covered.length"
        class="req-acc-sub req-acc-rest"
      >
        {{ $t('JITReqChooseForRest', { assets: uncoveredNames }) }}
      </div>
      <AccountFormatter
        :value="existing"
        :assets="assets"
        :nodes="nodes"
        :oid="oid"
        :show-add-template="false"
        @change="onExisting"
      />
      <el-button v-if="useExisting" link type="primary" size="small" @click="setExisting(false)">
        {{ $t('JITReqBackToJIT') }}
      </el-button>
    </template>
  </div>
</template>

<script>
import { Key } from '@element-plus/icons-vue'
import AccountFormatter from '@/views/perms/AssetPermission/components/AccountFormatter'

const JIT = '@JIT'

export default {
  name: 'RequestAccountField',
  components: { AccountFormatter, Key },
  props: {
    value: { type: [Array, String], default: () => [] },
    modelValue: { type: [Array, String], default: undefined },
    assets: { type: Array, default: () => [] },
    nodes: { type: Array, default: () => [] },
    oid: { type: String, default: '' }
  },
  emits: ['input', 'change', 'update:modelValue'],
  data() {
    return {
      coverage: { covered: [], uncovered: [], jit_only: false },
      useExisting: false,
      existing: [],
      timer: null
    }
  },
  computed: {
    current() {
      const v = this.modelValue !== undefined ? this.modelValue : this.value
      return Array.isArray(v) ? v : []
    },
    coveredNames() {
      return this.names(this.coverage.covered)
    },
    uncoveredNames() {
      return this.names(this.coverage.uncovered)
    }
  },
  watch: {
    assets: { handler: 'scheduleCheck', deep: true },
    nodes: { handler: 'scheduleCheck', deep: true },
    oid: 'scheduleCheck'
  },
  mounted() {
    this.existing = this.current.filter((a) => a !== JIT)
    this.scheduleCheck()
  },
  methods: {
    names(list) {
      const shown = list.slice(0, 5).map((a) => a.name)
      return shown.join(', ') + (list.length > 5 ? ` +${list.length - 5}` : '')
    },
    scheduleCheck() {
      clearTimeout(this.timer)
      this.timer = setTimeout(this.check, 300)
    },
    check() {
      const assets = (this.assets || []).filter(Boolean)
      const nodes = (this.nodes || []).filter(Boolean)
      if (!assets.length && !nodes.length) {
        this.coverage = { covered: [], uncovered: [], jit_only: false }
        this.emitValue()
        return
      }
      const params = new URLSearchParams({ assets: assets.join(','), nodes: nodes.join(',') })
      if (this.oid) params.set('oid', this.oid)
      this.$axios
        .get(`/api/v1/accounts/jit-access/coverage/?${params.toString()}`, {
          disableFlashErrorMsg: true
        })
        .then((res) => {
          this.coverage = res
          if (res.jit_only) this.useExisting = false
        })
        .catch(() => {
          this.coverage = { covered: [], uncovered: [], jit_only: false }
        })
        .finally(() => this.emitValue())
    },
    setExisting(v) {
      this.useExisting = v
      this.emitValue()
    },
    onExisting(list) {
      this.existing = (list || []).filter((a) => a !== JIT)
      this.emitValue()
    },
    emitValue() {
      const jit = this.coverage.covered.length > 0 && !this.useExisting
      const showChooser =
        !this.coverage.covered.length || this.coverage.uncovered.length || this.useExisting
      const value = [...(jit ? [JIT] : []), ...(showChooser ? this.existing : [])]
      this.$emit('update:modelValue', value)
      this.$emit('input', value)
      this.$emit('change', value)
    }
  }
}
</script>

<style scoped>
.req-acc {
  width: 100%;
}

.req-acc-jit {
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-color-success-light-5);
  border-radius: 6px;
  background: var(--el-color-success-light-9);
}

.req-acc-icon {
  margin-top: 3px;
  color: var(--el-color-success);
}

.req-acc-title {
  font-weight: 600;
  line-height: 20px;
}

.req-acc-sub {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.req-acc-rest {
  margin: 8px 0 4px;
}
</style>
