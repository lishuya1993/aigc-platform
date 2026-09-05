<template>
  <div class="app-container">
    <el-card shadow="never">
      <template #header>
        <div class="header-row">
          <div>
            <h3>GPT 图片生成</h3>
            <p class="description">查看图片生成模型状态。模型密钥和价格由中转站统一管理。</p>
          </div>
          <el-button :icon="Refresh" :loading="loading" @click="loadModels">刷新</el-button>
        </div>
      </template>
      <el-alert v-if="error" :title="error" type="warning" show-icon :closable="false" class="mb-4" />
      <el-table v-loading="loading" :data="models" border>
        <el-table-column prop="model_code" label="模型" min-width="220" />
        <el-table-column prop="provider" label="服务商" min-width="180" />
        <el-table-column prop="cost_credits" label="单次扣费" width="120" />
        <el-table-column label="状态" width="110">
          <template #default="scope">
            <el-tag :type="String(scope.row.enabled) === '1' ? 'success' : 'info'">
              {{ String(scope.row.enabled) === '1' ? '可用' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && !models.length" description="暂无可用图片模型" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import request from '@/utils/request';

const loading = ref(false);
const models = ref<any[]>([]);
const error = ref('');

async function loadModels() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await request({ url: '/aigc/models', method: 'get', params: { capability: 'draw' } });
    models.value = data?.data || data || [];
  } catch (e: any) {
    error.value = e?.msg || e?.message || '模型列表加载失败';
  } finally {
    loading.value = false;
  }
}

loadModels();
</script>

<style scoped>
.header-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
h3 { margin: 0 0 6px; font-size: 18px; }
.description { margin: 0; color: var(--el-text-color-secondary); }
.mb-4 { margin-bottom: 16px; }
</style>
