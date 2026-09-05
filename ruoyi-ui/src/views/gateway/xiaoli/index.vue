<template>
  <div class="p-2 app-container"><el-card shadow="never"><template #header><div class="header"><div><h3>中转站渠道</h3><p>上游 API 网关配置，模型从渠道自动同步。</p></div><el-button type="primary" icon="Refresh" :loading="syncing" @click="sync">同步模型</el-button></div></template>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="gateway_code" label="渠道编码" width="120"/>
      <el-table-column prop="gateway_name" label="渠道名称" width="140"/>
      <el-table-column prop="base_url" label="Base URL" min-width="220"/>
      <el-table-column prop="api_key" label="API Key" width="200"><template #default="scope"><code>{{ maskKey(scope.row.api_key) }}</code></template></el-table-column>
      <el-table-column label="状态" width="90"><template #default="scope"><el-tag :type="scope.row.enabled==='1'?'success':'info'">{{ scope.row.enabled==='1'?'启用':'停用' }}</el-tag></template></el-table-column>
      <el-table-column prop="create_time" label="创建时间" min-width="160"/>
    </el-table>
  </el-card>
  </div>
</template>
<script setup lang="ts">
import { listGateway, syncModels } from '@/api/aigc/billing';
import modal from '@/plugins/modal';
const rows=ref<any[]>([]);const loading=ref(false);const syncing=ref(false);
function maskKey(k:string){if(!k)return '-';return k.length>12?k.slice(0,6)+'****'+k.slice(-4):k}
async function load(){loading.value=true;try{const res:any=await listGateway();rows.value=res.data||res||[]}finally{loading.value=false}}
async function sync(){syncing.value=true;try{const res:any=await syncModels();modal.msgSuccess(`同步完成，共 ${res.data?.length||0} 个模型`);load()}catch(e:any){modal.msgError(e.message||'同步失败')}finally{syncing.value=false}}
onMounted(load);
</script>
<style scoped>.header{display:flex;justify-content:space-between;align-items:center}.header h3{margin:0 0 6px}.header p{margin:0;color:#8492a6;font-size:13px}code{background:#f5f7fa;padding:2px 6px;border-radius:4px;font-size:12px}</style>
