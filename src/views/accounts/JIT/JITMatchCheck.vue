<template>
  <div class="jit-check">
    <el-alert type="info" :closable="false" show-icon class="jit-check-intro">
      {{ $t('JITCheckIntro') }}
    </el-alert>
    <el-form label-position="left" label-width="auto" class="jit-check-form">
      <el-form-item :label="$t('User')" required>
        <Select2 v-bind="userSelect2" v-model="form.user" style="width: 50% !important" />
      </el-form-item>
      <el-form-item :label="$t('Asset')">
        <Select2 v-bind="assetSelect2" v-model="form.assets" style="width: 50% !important" />
      </el-form-item>
      <el-form-item :label="$t('Node')">
        <Select2 v-bind="nodeSelect2" v-model="form.nodes" style="width: 50% !important" />
      </el-form-item>
      <el-form-item :label="$t('JITCheckAs')">
        <el-radio-group v-model="form.request">
          <el-radio :value="false">{{ $t('JITCheckCurrent') }}</el-radio>
          <el-radio :value="true">{{ $t('JITCheckRequest') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="check">{{
          $t('JITCheckRun')
        }}</el-button>
      </el-form-item>
    </el-form>
    <el-table v-if="results" :data="results" border style="width: 100%">
      <el-table-column :label="$t('Asset')" min-width="160">
        <template #default="{ row }">{{ row.asset.name }}</template>
      </el-table-column>
      <el-table-column :label="$t('JITPolicy')" min-width="160">
        <template #default="{ row }">
          <el-tag v-if="row.policy" size="small" type="success">{{ row.policy.name }}</el-tag>
          <span v-else class="jit-none">{{ $t('JITNoAccount') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('JITLifetime')" min-width="140">
        <template #default="{ row }">{{ row.policy ? row.policy.mode_display : '-' }}</template>
      </el-table-column>
      <el-table-column :label="$t('JITWhy')" min-width="260">
        <template #default="{ row }">{{ row.reason }}</template>
      </el-table-column>
      <el-table-column :label="$t('AssetPermission')" min-width="160">
        <template #default="{ row }">{{ row.permission ? row.permission.name : '-' }}</template>
      </el-table-column>
    </el-table>
    <div v-if="limited" class="jit-limited">{{ $t('JITCheckLimited') }}</div>
  </div>
</template>

<script>
import Select2 from '@/components/Form/FormFields/Select2'

const toOption = (item) => ({ label: item.name, value: item.id })

export default {
  name: 'JITMatchCheck',
  components: { Select2 },
  data() {
    return {
      loading: false,
      results: null,
      limited: false,
      form: { user: '', assets: [], nodes: [], request: false },
      userSelect2: {
        multiple: false,
        ajax: {
          url: '/api/v1/users/users/?fields_size=mini',
          transformOption: (item) => ({ label: `${item.name}(${item.username})`, value: item.id })
        }
      },
      assetSelect2: {
        multiple: true,
        ajax: { url: '/api/v1/assets/assets/?fields_size=mini', transformOption: toOption }
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
  methods: {
    check() {
      const { user, assets, nodes, request } = this.form
      if (!user) {
        this.$message.error(this.$t('JITCheckNeedUser'))
        return
      }
      if (!assets.length && !nodes.length) {
        this.$message.error(this.$t('SelectAtLeastOneAssetOrNodeErrMsg'))
        return
      }
      this.loading = true
      const params = new URLSearchParams({
        user,
        assets: assets.join(','),
        nodes: nodes.join(','),
        request: request ? '1' : '0'
      })
      this.$axios
        .get(`/api/v1/accounts/jit-policies/match/?${params.toString()}`)
        .then((res) => {
          this.results = res.results || []
          this.limited = !!res.limited
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style scoped>
.jit-check {
  padding: 4px 0;
}

.jit-check-intro,
.jit-check-form {
  margin-bottom: 12px;
}

.jit-none {
  color: var(--el-text-color-secondary);
}

.jit-limited {
  margin-top: 8px;
  color: var(--el-text-color-secondary);
}
</style>
