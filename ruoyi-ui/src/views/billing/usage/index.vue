<template>
  <div class="p-2 app-container">
    <el-card shadow="never">
      <template #header>
        <div class="header">
          <div><h3>用户用量统计</h3><p>按日统计每位用户的功能调用、实际消费、退款和充值；每日 00:10 自动发送前一天日报。</p></div>
          <div class="actions"><el-date-picker v-model="date" type="date" value-format="YYYY-MM-DD" :clearable="false" /><el-button icon="Refresh" @click="load">查询</el-button><el-button type="primary" :loading="sending" @click="send">发送日报</el-button></div>
        </div>
      </template>
      <el-row :gutter="12" class="summary"><el-col :span="6"><el-statistic title="活跃用户" :value="summary.activeUsers || 0" /></el-col><el-col :span="6"><el-statistic title="任务次数" :value="summary.taskCount || 0" /></el-col><el-col :span="6"><el-statistic title="消耗算力" :value="summary.consumedCredits || 0" /></el-col><el-col :span="6"><el-statistic title="充值到账" :value="summary.rechargedCredits || 0" /></el-col></el-row>
      <el-table v-loading="loading" :data="summary.rows || []" border>
        <el-table-column prop="email" label="用户邮箱" min-width="200" />
        <el-table-column prop="user_name" label="账号" min-width="130" />
        <el-table-column prop="task_count" label="任务次数" width="100" />
        <el-table-column prop="consumed_credits" label="消耗算力" width="110" />
        <el-table-column prop="refunded_credits" label="退还算力" width="110" />
        <el-table-column prop="recharged_credits" label="充值到账" width="110" />
        <el-table-column prop="current_balance" label="当前余额" width="110" />
      </el-table>
    </el-card>
  </div>
</template>
<script setup lang="ts">
import { getDailyUsage, sendDailyUsageEmail } from '@/api/aigc/billing';
const date = ref(new Date().toISOString().slice(0, 10)); const loading = ref(false); const sending = ref(false); const summary = ref<any>({ rows: [] });
async function load(){ loading.value=true; try { const r:any=await getDailyUsage(date.value); summary.value=r.data||r||{rows:[]}; } finally { loading.value=false; } }
async function send(){ sending.value=true; try { await sendDailyUsageEmail(date.value); ElMessage.success('日报已发送给管理员'); } finally { sending.value=false; } }
onMounted(load);
</script>
<style scoped>.header{display:flex;justify-content:space-between;gap:16px;align-items:center}.actions{display:flex;gap:8px;align-items:center}h3{margin:0 0 6px}p{margin:0;color:#8492a6;font-size:13px}.summary{margin:0 0 18px}@media(max-width:768px){.header{align-items:flex-start;flex-direction:column}.actions{flex-wrap:wrap}}</style>
