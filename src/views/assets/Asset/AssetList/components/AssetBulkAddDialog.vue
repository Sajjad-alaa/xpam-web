<template>
  <el-dialog
    :model-value="visible"
    :title="$t('AssetBulkAdd')"
    width="680px"
    append-to-body
    destroy-on-close
    @update:model-value="(v) => !v && close()"
  >
    <el-form v-if="!result" label-position="top" class="bulk-form">
      <el-form-item :label="$t('Platform')" required>
        <Select2 v-bind="platformSelect2" v-model="form.platform" />
      </el-form-item>
      <el-form-item :label="$t('AssetBulkAddLines')" required>
        <el-input
          v-model="form.lines"
          type="textarea"
          :rows="7"
          :placeholder="$t('AssetBulkAddLinesHelp')"
        />
        <div class="bulk-hint">{{ $t('AssetBulkAddCount', { n: lineCount }) }}</div>
      </el-form-item>
      <el-form-item :label="$t('Node')">
        <Select2 v-bind="nodeSelect2" v-model="form.nodes" />
      </el-form-item>
      <el-form-item v-if="isDatabase" :label="$t('DefaultDatabase')" required>
        <el-input v-model="form.db_name" />
      </el-form-item>
      <el-form-item :label="$t('AssetBulkAddAccount')">
        <div class="bulk-account">
          <el-input v-model="form.account.username" :placeholder="$t('Username')" />
          <el-input
            v-model="form.account.secret"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="$t('Password')"
          />
          <el-checkbox v-model="form.account.privileged">{{ $t('Privileged') }}</el-checkbox>
        </div>
        <div class="bulk-hint">{{ $t('AssetBulkAddAccountHelp') }}</div>
      </el-form-item>
    </el-form>

    <div v-else>
      <el-alert
        :type="result.failed.length ? 'warning' : 'success'"
        :closable="false"
        show-icon
        :title="
          $t('AssetBulkAddResult', { created: result.created.length, failed: result.failed.length })
        "
      />
      <el-table v-if="result.failed.length" :data="result.failed" border class="bulk-failed">
        <el-table-column :label="$t('Address')" prop="line" min-width="160" />
        <el-table-column :label="$t('Reason')" prop="error" min-width="320" />
      </el-table>
    </div>

    <template #footer>
      <el-button @click="close">{{ result ? $t('Close') : $t('Cancel') }}</el-button>
      <el-button v-if="!result" type="primary" :loading="saving" :disabled="!canSave" @click="save">
        {{ $t('AssetBulkAddButton', { n: lineCount }) }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
import Select2 from '@/components/Form/FormFields/Select2'

const empty = () => ({
  platform: '',
  lines: '',
  nodes: [],
  db_name: '',
  account: { username: '', secret: '', privileged: true }
})

export default {
  name: 'AssetBulkAddDialog',
  components: { Select2 },
  props: {
    visible: { type: Boolean, default: false },
    category: { type: String, default: '' }
  },
  emits: ['update:visible', 'done'],
  data() {
    const query = this.category ? `&category=${this.category}` : ''
    return {
      form: empty(),
      saving: false,
      result: null,
      platforms: {},
      platformSelect2: {
        multiple: false,
        ajax: {
          url: `/api/v1/assets/platforms/?fields_size=small${query}`,
          transformOption: (item) => {
            this.platforms[item.id] = item
            return { label: item.name, value: item.id }
          }
        }
      },
      nodeSelect2: {
        multiple: true,
        ajax: {
          url: '/api/v1/assets/nodes/',
          transformOption: (item) => ({ label: item.full_value || item.value, value: item.id })
        }
      }
    }
  },
  computed: {
    lineCount() {
      return this.form.lines.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#')).length
    },
    isDatabase() {
      const p = this.platforms[this.form.platform]
      return (p?.category?.value || p?.category) === 'database'
    },
    canSave() {
      return this.form.platform && this.lineCount > 0 && (!this.isDatabase || this.form.db_name)
    }
  },
  watch: {
    visible(v) {
      if (v) {
        this.form = empty()
        this.result = null
      }
    }
  },
  methods: {
    save() {
      this.saving = true
      const { account, ...rest } = this.form
      this.$axios
        .post('/api/v1/assets/tools/bulk-add/', {
          ...rest,
          account: account.username ? account : null
        })
        .then((data) => {
          this.result = data
          if (data.created.length) this.$emit('done')
        })
        .finally(() => {
          this.saving = false
        })
    },
    close() {
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.bulk-form :deep(.el-select) {
  width: 100%;
}

.bulk-account {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 8px;
  width: 100%;
}

.bulk-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.bulk-failed {
  margin-top: 12px;
}
</style>
