<template>
  <div>
    <el-radio-group v-model="state" class="acc-switch">
      <el-radio-button value="live">{{ $t('JITLiveAccounts') }}</el-radio-button>
      <el-radio-button value="history">{{ $t('JITHistory') }}</el-radio-button>
    </el-radio-group>
    <JITAccountTable :key="state" :state="state" />
  </div>
</template>

<script>
import JITAccountTable from './JITAccountTable.vue'

export default {
  name: 'JITAccounts',
  components: { JITAccountTable },
  data() {
    return { state: 'live' }
  }
}
</script>

<style scoped>
.acc-switch {
  margin-bottom: 12px;
}
</style>
