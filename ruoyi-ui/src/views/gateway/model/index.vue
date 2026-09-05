<template>
  <div class="p-2 app-container">
    <el-card shadow="never">
      <template #header><div><h3>模型与接口配置</h3><p>配置平台扣费、启用状态，以及媒体模型的提交和查询接口参数。</p></div></template>
      <el-table v-loading="loading" :data="rows" border>
        <el-table-column prop="model_name" label="模型" min-width="220"/><el-table-column prop="capability" label="能力" width="130"/><el-table-column prop="gateway_name" label="渠道"/>
        <el-table-column label="每次扣费" width="180"><template #default="scope"><el-input-number v-model="scope.row.cost_credits" :min="0" size="small"/></template></el-table-column>
        <el-table-column label="接口参数" width="110"><template #default="scope"><el-button link type="primary" @click="editAdapter(scope.row)">{{ scope.row.default_params ? '已配置' : '配置' }}</el-button></template></el-table-column>
        <el-table-column label="启用" width="100"><template #default="scope"><el-switch v-model="scope.row.enabled" active-value="1" inactive-value="0"/></template></el-table-column>
        <el-table-column label="操作" width="90"><template #default="scope"><el-button link type="primary" @click="save(scope.row)">保存</el-button></template></el-table-column>
      </el-table>
    </el-card>
    <el-dialog v-model="adapterOpen" title="媒体模型接口参数" width="620px">
      <el-alert type="info" :closable="false" show-icon title="文本和绘图模型可留空；音乐、数字人等模型需按供应商接口填写。"/>
      <el-form label-position="top" class="mt-4"><el-form-item label="模型"><el-input :model-value="editing?.model_name" disabled/></el-form-item><el-form-item label="接口参数 JSON"><el-input v-model="adapterText" type="textarea" :rows="8" placeholder='{"submit_path":"/v1/music/generations","query_path":"/v1/music/generations/{task_id}"}'/></el-form-item></el-form>
      <template #footer><el-button @click="adapterOpen=false">取消</el-button><el-button type="primary" @click="saveAdapter">保存参数</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import {listModels,updateModel} from '@/api/aigc/billing';import modal from '@/plugins/modal';
const rows=ref<any[]>([]);const loading=ref(false);const adapterOpen=ref(false);const editing=ref<any>();const adapterText=ref('');
async function load(){loading.value=true;try{const r:any=await listModels();rows.value=r.data||r||[]}finally{loading.value=false}}
function normalizeParams(value:any){if(!value)return null;return typeof value==='string'?value:JSON.stringify(value,null,2)}
async function save(row:any){await updateModel(row.id,{credits:Number(row.cost_credits),enabled:row.enabled,defaultParams:normalizeParams(row.default_params)});modal.msgSuccess('模型配置已保存')}
function editAdapter(row:any){editing.value=row;adapterText.value=normalizeParams(row.default_params)||'';adapterOpen.value=true}
async function saveAdapter(){try{if(adapterText.value.trim())JSON.parse(adapterText.value);editing.value.default_params=adapterText.value.trim()||null;await save(editing.value);adapterOpen.value=false}catch{modal.msgError('接口参数必须是合法 JSON')}}
onMounted(load);
</script>
<style scoped>h3{margin:0 0 6px}p{margin:0;color:#8492a6;font-size:13px}.mt-4{margin-top:16px}</style>
