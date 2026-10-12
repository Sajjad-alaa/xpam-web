<template>
  <div class="box">
    <div style="margin-bottom: 12px">
      <Title :config="config" />
    </div>
    <div class="content">
      <SummaryCard
        v-for="item of items"
        :key="item.title"
        :title="item.title"
        class="summary-card"
        v-bind="item.body"
      />
    </div>
  </div>
</template>

<script>
import Title from './Title.vue'
import SummaryCard from '@/components/Cards/SummaryCard'

export default {
  components: { Title, SummaryCard },
  props: {
    config: {
      type: Object,
      default: () => {
        return {
          title: '',
          tip: ''
        }
      }
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {}
  }
}
</script>

<style lang="scss" scoped>
.box {
  padding: 20px;
  background: var(--page-background-color, #ffffff);
  border-radius: var(--jms-card-radius, 8px);

  .content {
    display: flex;
    justify-content: space-between;
    padding: 0 10px;

    .summary-card {
      padding-left: 16px;
      border-left: 1px solid var(--panel-border-color, #eff0f1);

      &:first-child {
        padding-left: 0;
        border-left: none;
      }
    }
  }
}
</style>
