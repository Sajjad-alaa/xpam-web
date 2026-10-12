<template>
  <div>
    <el-dropdown popper-class="nav-header-dropdown" :show-timeout="50" @command="handleCommand">
      <span class="el-dropdown-link" style="vertical-align: baseline">
        <svg-icon icon-class="question-mark" />
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="download">{{ $t('DownloadCenter') }}</el-dropdown-item>
          <el-dropdown-item v-if="!hasLicence" command="enterprise">{{
            $t('EnterpriseEdition')
          }}</el-dropdown-item>
          <el-dropdown-item command="about" class="about-item">
            <span>{{ $tc('About') }}</span>
            <span class="version-right">{{ appVersion }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <About v-model:visible="visible" />
  </div>
</template>

<script>
import { addBasePath } from '@/utils/common/index'
import About from './About.vue'

export default {
  name: 'Help',
  components: {
    About
  },
  data() {
    return {
      visible: false
    }
  },
  computed: {
    hasLicence() {
      return this.$store.getters.hasValidLicense
    },
    appVersion() {
      const ver =
        this.$store.getters.publicSettings?.INTERFACE?.version ||
        this.$store.getters.publicSettings?.VERSION ||
        'v5.0.0'
      const clean = String(ver).replace(/-build\d+.*/i, '')
      return this.hasLicence ? clean.replace(/-ce$/i, '') : clean
    }
  },
  methods: {
    handleCommand(command) {
      switch (command) {
        case 'download':
          window.open(addBasePath('/core/download/'), '_blank', 'noopener,noreferrer')
          break
        case 'enterprise':
          window.open('https://www.jumpserver.com/#section-edition', '_blank')
          break
        case 'about':
          this.visible = true
          break
      }
    }
  }
}
</script>

<style scoped>
.icon {
  color: #fff;
}
.about-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-width: 140px;
}
.version-right {
  font-size: 11px;
  color: var(--el-text-color-secondary, #909399);
  margin-left: 16px;
}
</style>
