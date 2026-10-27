<template>
  <Dialog
    v-if="visible"
    :show-cancel="false"
    :show-confirm="false"
    :title="$tc('About')"
    :visible="visible"
    class="about-dialog"
    top="10%"
    width="50%"
    @update:visible="$emit('update:visible', $event)"
  >
    <div class="box">
      <div class="head">
        <img :src="logoSrc" alt="logo" class="sidebar-logo-text" height="70" />
      </div>
      <tr
        v-for="item of items"
        v-show="item.has || item.has === undefined"
        :key="item.label"
        class="text"
      >
        <td class="title">{{ item.label }}:</td>
        <td class="value">{{ item.value }}</td>
      </tr>
      <el-divider class="divider" />
      <div class="text">
        <span
          v-for="(i, index) in visibleActions"
          :key="i.name"
          class="text-link"
          @click="onClick(i.name)"
        >
          <i :class="i.icon" class="icon" />
          {{ i.label }}
          <el-divider v-if="index !== visibleActions.length - 1" direction="vertical" />
        </span>
      </div>
    </div>
  </Dialog>
</template>

<script>
import defaultLogo from '@/assets/img/logo.svg'
import { isDefaultInterfaceLogo } from '@/utils/interfaceLogo'
import Dialog from '@/components/Dialog'
import { mapGetters } from 'vuex'

export default {
  components: {
    Dialog
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible'],
  data() {
    return {
      actions: [
        {
          name: 'download',
          label: this.$tc('DownloadCenter'),
          icon: 'fa fa-download'
        }
      ]
    }
  },
  computed: {
    ...mapGetters(['publicSettings']),
    iVisible: {
      set(val) {
        this.$emit('update:visible', val)
      },
      get() {
        return this.visible
      }
    },
    iVersion() {
      const ver =
        this.publicSettings?.INTERFACE?.version || this.publicSettings?.VERSION || 'v5.0.0'
      const clean = String(ver).replace(/-build\d+.*/i, '')
      if (this.hasXPack) {
        return clean.replace(/-ce$/i, '')
      }
      return clean
    },
    versionType() {
      return this.hasXPack ? this.$t('EnterpriseEdition') : this.$tc('CommunityEdition') + ' GPLv3'
    },
    items() {
      return [
        {
          label: this.$t('Product'),
          value: this.versionType
        },
        {
          label: this.$t('Version'),
          value: this.iVersion
        },
        {
          label: this.$t('PermissionCompany'),
          value: this.corporation,
          has: this.hasXPack
        },
        {
          label: 'Copyright',
          value: this.copyright,
          has: false
        }
      ]
    },
    visibleActions() {
      return this.actions.filter((action) => {
        return !(action.name === 'github' && this.publicSettings?.XPACK_LICENSE_IS_VALID)
      })
    },
    corporation() {
      return this.publicSettings?.XPACK_LICENSE_INFO?.corporation || 'XPAM'
    },
    copyright() {
      return ''
    },
    logoSrc() {
      const logo = this.publicSettings.INTERFACE?.logo_logout
      return isDefaultInterfaceLogo(logo) ? defaultLogo : logo.trim()
    },
    hasXPack() {
      return this.publicSettings.XPACK_ENABLED
    }
  },
  methods: {
    onClick(type) {
      switch (type) {
        case 'download':
          window.open('/core/download/', '_blank')
          break
        case 'github':
          window.open('https://github.com/jumpserver/jumpserver', '_blank')
          break
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.about-dialog {
  &.dialog :deep(.el-dialog__body) {
    padding: 20px 30px;
  }

  &.dialog :deep(.el-dialog__footer) {
    border-top: none;
    display: none;
  }
}

.head {
  float: right;
}

.box {
  .text {
    line-height: 2;
    font-size: 14px;
    color: var(--el-text-color-regular, #666);

    .title {
      font-weight: 600;
    }

    .value {
      padding-left: 30px;
    }

    .icon {
      margin-right: 4px;
    }

    span {
      cursor: pointer;
    }
  }
}

:deep(.divider.el-divider) {
  margin: 15px 0 !important;
}
</style>
