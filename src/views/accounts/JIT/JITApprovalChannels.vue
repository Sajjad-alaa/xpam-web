<template>
  <el-dialog
    :model-value="visible"
    :title="$t('JITChannelsTitle')"
    width="640px"
    append-to-body
    @update:model-value="(v) => !v && $emit('update:visible', false)"
  >
    <div v-loading="loading">
      <el-alert type="info" :closable="false" show-icon class="ch-intro">
        {{ $t('JITChannelsIntro', { url: info.site_url || '' }) }}
      </el-alert>
      <el-form label-position="top">
        <el-form-item label="Microsoft Teams">
          <el-input
            v-model="form.teams_webhook"
            type="password"
            show-password
            :placeholder="
              info.teams_webhook_set
                ? $t('JITChannelsKeep')
                : 'https://…webhook.office.com/… / Workflows URL'
            "
          />
          <div class="ch-help">{{ $t('JITChannelsTeamsHelp') }}</div>
        </el-form-item>
        <el-form-item label="Slack">
          <el-input
            v-model="form.slack_webhook"
            type="password"
            show-password
            :placeholder="
              info.slack_webhook_set ? $t('JITChannelsKeep') : 'https://hooks.slack.com/services/…'
            "
          />
          <div class="ch-help">{{ $t('JITChannelsSlackHelp') }}</div>
        </el-form-item>
        <el-form-item label="Telegram">
          <div class="ch-row">
            <el-input
              v-model="form.telegram_token"
              type="password"
              show-password
              :placeholder="
                info.telegram_token_set ? $t('JITChannelsKeep') : $t('JITChannelsBotToken')
              "
            />
            <el-input
              v-model="form.telegram_chat"
              :placeholder="$t('JITChannelsChatId')"
              class="ch-chat"
            />
          </div>
          <div class="ch-help">{{ $t('JITChannelsTelegramHelp') }}</div>
        </el-form-item>
        <el-form-item :label="$t('JITChannelsLinkHours')">
          <el-input-number v-model="form.link_hours" :min="1" :max="168" />
          <div class="ch-help">{{ $t('JITChannelsLinkHoursHelp') }}</div>
        </el-form-item>
        <el-form-item>
          <el-switch v-model="form.direct_approve" :active-text="$t('JITChannelsDirect')" />
          <div class="ch-help">{{ $t('JITChannelsDirectHelp') }}</div>
        </el-form-item>
      </el-form>
      <div v-if="testResult" class="ch-test">
        <el-tag
          v-for="(r, name) of testResult"
          :key="name"
          :type="r.ok ? 'success' : 'danger'"
          class="ch-tag"
        >
          {{ name }}: {{ r.ok ? $t('JITChannelsSent') : r.error }}
        </el-tag>
      </div>
    </div>
    <template #footer>
      <el-button :loading="testing" @click="test">{{ $t('JITChannelsTest') }}</el-button>
      <el-button type="primary" :loading="saving" @click="save">{{ $t('Save') }}</el-button>
    </template>
  </el-dialog>
</template>

<script>
export default {
  name: 'JITApprovalChannels',
  props: { visible: { type: Boolean, default: false } },
  emits: ['update:visible'],
  data() {
    return {
      loading: false,
      saving: false,
      testing: false,
      testResult: null,
      info: {},
      form: this.emptyForm()
    }
  },
  watch: {
    visible(v) {
      if (v) this.load()
    }
  },
  methods: {
    emptyForm() {
      return {
        teams_webhook: '',
        slack_webhook: '',
        telegram_token: '',
        telegram_chat: '',
        link_hours: 24,
        direct_approve: false
      }
    },
    load() {
      this.loading = true
      this.testResult = null
      this.$axios
        .get('/api/v1/accounts/jit-approval-channels/')
        .then((res) => {
          this.info = res
          this.form = {
            ...this.emptyForm(),
            telegram_chat: res.telegram_chat,
            link_hours: res.link_hours,
            direct_approve: res.direct_approve
          }
        })
        .finally(() => {
          this.loading = false
        })
    },
    save() {
      this.saving = true
      this.$axios
        .post('/api/v1/accounts/jit-approval-channels/save/', this.form)
        .then((res) => {
          this.info = res
          this.form = { ...this.form, teams_webhook: '', slack_webhook: '', telegram_token: '' }
          this.$message.success(this.$t('UpdateSuccessMsg'))
        })
        .finally(() => {
          this.saving = false
        })
    },
    test() {
      this.testing = true
      this.$axios
        .post('/api/v1/accounts/jit-approval-channels/test/', this.form)
        .then((res) => {
          this.testResult = res
        })
        .finally(() => {
          this.testing = false
        })
    }
  }
}
</script>

<style scoped>
.ch-intro {
  margin-bottom: 12px;
}

.ch-help {
  width: 100%;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.ch-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.ch-chat {
  width: 200px;
}

.ch-test {
  margin-top: 8px;
}

.ch-tag {
  margin: 0 6px 6px 0;
}
</style>
