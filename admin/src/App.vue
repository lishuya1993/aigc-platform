<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const PC_CLIENT = 'e5cd7e4891bf95d1d19206ce24a7b32e'
const active = ref('dashboard')
const menus = [{name:'工作台',path:'/dashboard',permission:'dashboard:view'},{name:'用户管理',path:'/system/user',permission:'system:user:list'},{name:'角色管理',path:'/system/role',permission:'system:role:list'},{name:'菜单管理',path:'/system/menu',permission:'system:menu:list'},{name:'套餐管理',path:'/billing/package',permission:'billing:package:list'}]

const adminToken = ref(localStorage.getItem('ll_admin_token') || '')
const adminName = ref(localStorage.getItem('ll_admin_name') || '')
const loginOpen = ref(!adminToken.value)
const loginUsername = ref('admin')
const loginPassword = ref('')
const loginLoading = ref(false)

const apiFetch = (input: RequestInfo | URL, init: RequestInit = {}) => fetch(input, { ...init, headers: { 'Content-Type': 'application/json', clientid: PC_CLIENT, ...(adminToken.value ? { Authorization: `Bearer ${adminToken.value}` } : {}), ...(init.headers || {}) } })

async function doLogin(){
  if(!loginUsername.value.trim() || !loginPassword.value){ ElMessage.warning('请输入账号和密码'); return }
  loginLoading.value = true
  try{
    const res = await fetch('/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json', clientid: PC_CLIENT }, body: JSON.stringify({ username: loginUsername.value.trim(), password: loginPassword.value, clientId: PC_CLIENT, grantType:'password', userType:'sys_user' }) })
    const data = await res.json()
    if(data.code !== 200) throw new Error(data.msg || '登录失败')
    adminToken.value = data.data.access_token
    adminName.value = loginUsername.value.trim()
    localStorage.setItem('ll_admin_token', data.data.access_token)
    localStorage.setItem('ll_admin_name', adminName.value)
    loginOpen.value = false
    ElMessage.success('登录成功')
    loadAll()
  }catch(e:any){ ElMessage.error(e.message || '登录失败') } finally { loginLoading.value = false }
}
function logout(){ adminToken.value=''; adminName.value=''; localStorage.removeItem('ll_admin_token'); localStorage.removeItem('ll_admin_name'); loginOpen.value = true }

const users = ref<any[]>([])
const keyword = ref('')
const balanceDialog = ref(false)
const balanceTarget = ref<any>(null)
const balanceAmount = ref(100)
const balanceRemark = ref('')
const balanceSaving = ref(false)

async function loadUsers(){
  try{
    const res = await apiFetch(`/aigc/admin/users${keyword.value.trim() ? '?keyword='+encodeURIComponent(keyword.value.trim()) : ''}`)
    const data = await res.json()
    if(data.code === 200) users.value = data.data || []
    else if(data.code === 401) { ElMessage.warning('登录已过期，请重新登录'); loginOpen.value = true }
  }catch{ ElMessage.error('用户列表加载失败') }
}
function openBalance(user:any){ balanceTarget.value = user; balanceAmount.value = 100; balanceRemark.value = ''; balanceDialog.value = true }
async function saveBalance(){
  const amt = Number(balanceAmount.value)
  if(!amt){ ElMessage.warning('请输入调整金额'); return }
  balanceSaving.value = true
  try{
    const res = await apiFetch(`/aigc/admin/users/${balanceTarget.value.user_id}/balance`, { method:'POST', body: JSON.stringify({ amount: amt, remark: balanceRemark.value }) })
    const data = await res.json()
    if(data.code !== 200) throw new Error(data.msg || '调整失败')
    ElMessage.success(amt > 0 ? `已加余额 ${amt}` : `已扣余额 ${Math.abs(amt)}`)
    balanceDialog.value = false
    loadUsers()
  }catch(e:any){ ElMessage.error(e.message || '调整失败') } finally { balanceSaving.value = false }
}

const packages = ref<any[]>([])
const orders = ref<any[]>([])
const flows = ref<any[]>([])

async function loadAll(){
  try{ const r1 = await apiFetch('/aigc/admin/packages'); if(r1.ok){ const d = await r1.json(); if(d.code===200) packages.value = d.data || [] } }catch{}
  try{ const r2 = await apiFetch('/aigc/admin/orders'); if(r2.ok){ const d = await r2.json(); if(d.code===200) orders.value = d.data || [] } }catch{}
  try{ const r3 = await apiFetch('/aigc/admin/credit-flows'); if(r3.ok){ const d = await r3.json(); if(d.code===200) flows.value = d.data || [] } }catch{}
  await loadUsers()
}

onMounted(()=>{ if(adminToken.value) loadAll() })
</script>
<template>
  <el-container style="min-height:100vh">
    <el-aside width="230px">
      <div class="logo">ll <small>管理后台</small></div>
      <el-menu :default-active="active" @select="active=$event">
        <el-menu-item index="dashboard">数据概览</el-menu-item>
        <el-sub-menu index="system"><template #title>系统管理</template><el-menu-item index="users">用户管理</el-menu-item></el-sub-menu>
        <el-sub-menu index="business"><template #title>业务管理</template><el-menu-item index="packages">套餐与算力</el-menu-item><el-menu-item index="orders">订单与支付</el-menu-item><el-menu-item index="flows">余额流水</el-menu-item></el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header"><b>ll 运营中心</b><span v-if="adminName">{{adminName}} · 管理员<el-button link type="danger" @click="logout" style="margin-left:10px">退出</el-button></span></el-header>
      <el-main>
        <template v-if="active==='users'">
          <div class="title"><div><h2>用户管理</h2><p>用户端注册账号与余额调整</p></div></div>
          <el-card>
            <div class="filters">
              <el-input v-model="keyword" placeholder="搜索用户名/昵称/邮箱" style="width:260px" clearable @keyup.enter="loadUsers"/>
              <el-button type="primary" @click="loadUsers">查询</el-button>
            </div>
            <el-table :data="users" style="width:100%">
              <el-table-column prop="user_id" label="ID" width="200"/>
              <el-table-column prop="user_name" label="用户名" min-width="160"/>
              <el-table-column prop="email" label="邮箱" min-width="180"/>
              <el-table-column prop="balance" label="余额" width="100"><template #default="scope"><b style="color:#2563eb">{{scope.row.balance}}</b></template></el-table-column>
              <el-table-column label="状态" width="80"><template #default="scope"><el-tag :type="scope.row.status==='0'?'success':'danger'">{{scope.row.status==='0'?'正常':'停用'}}</el-tag></template></el-table-column>
              <el-table-column prop="create_time" label="注册时间" min-width="160"/>
              <el-table-column label="操作" width="120"><template #default="scope"><el-button link type="primary" @click="openBalance(scope.row)">调余额</el-button></template></el-table-column>
            </el-table>
          </el-card>
        </template>
        <template v-else-if="active==='packages'">
          <div class="title"><div><h2>套餐与算力</h2><p>用户端充值套餐配置</p></div></div>
          <el-card><el-table :data="packages" style="width:100%"><el-table-column prop="id" label="ID" width="80"/><el-table-column prop="package_name" label="套餐名"/><el-table-column prop="credits" label="到账余额" width="120"/><el-table-column prop="price" label="价格(元)" width="120"/><el-table-column prop="status" label="状态" width="80"><template #default="scope"><el-tag :type="scope.row.status==='0'?'success':'info'">{{scope.row.status==='0'?'上架':'下架'}}</el-tag></template></el-table-column></el-table></el-card>
        </template>
        <template v-else-if="active==='orders'">
          <div class="title"><div><h2>订单与支付</h2><p>全部充值订单</p></div></div>
          <el-card><el-table :data="orders" height="560" style="width:100%"><el-table-column prop="order_no" label="订单号" min-width="210"/><el-table-column prop="user_name" label="用户" width="160"/><el-table-column prop="package_name" label="套餐"/><el-table-column prop="amount" label="金额" width="90"/><el-table-column prop="credits" label="到账" width="90"/><el-table-column prop="status" label="状态" width="90"><template #default="scope"><el-tag :type="scope.row.status==='PAID'?'success':'warning'">{{scope.row.status==='PAID'?'已支付':'待支付'}}</el-tag></template></el-table-column><el-table-column prop="paid_time" label="支付时间" min-width="160"/></el-table></el-card>
        </template>
        <template v-else-if="active==='flows'">
          <div class="title"><div><h2>余额流水</h2><p>全部用户余额变动记录</p></div></div>
          <el-card><el-table :data="flows" height="560" style="width:100%"><el-table-column prop="user_name" label="用户" width="160"/><el-table-column prop="change_amount" label="变动" width="90"><template #default="scope"><b :class="scope.row.change_amount>0?'flow-plus':'flow-minus'">{{scope.row.change_amount>0?'+':''}}{{scope.row.change_amount}}</b></template></el-table-column><el-table-column prop="balance" label="变动后余额" width="110"/><el-table-column prop="source" label="来源" width="90"/><el-table-column prop="remark" label="备注"/><el-table-column prop="create_time" label="时间" min-width="160"/></el-table></el-card>
        </template>
        <template v-else>
          <div class="title"><div><h2>数据概览</h2><p>运营数据看板（开发中）</p></div></div>
          <el-card><el-empty description="套餐/订单/流水已接入真实接口，更多页面陆续接入"/></el-card>
        </template>
      </el-main>
    </el-container>
  </el-container>

  <el-dialog v-model="loginOpen" width="400px" title="运营后台登录" :close-on-click-modal="false" :show-close="false">
    <el-form label-width="60px">
      <el-form-item label="账号"><el-input v-model="loginUsername" placeholder="管理员账号"/></el-form-item>
      <el-form-item label="密码"><el-input v-model="loginPassword" type="password" show-password placeholder="密码" @keyup.enter="doLogin"/></el-form-item>
    </el-form>
    <template #footer><el-button type="primary" :loading="loginLoading" @click="doLogin">登录</el-button></template>
  </el-dialog>

  <el-dialog v-model="balanceDialog" width="420px" :title="`调整余额 - ${balanceTarget?.user_name || ''}`">
    <el-form label-width="70px">
      <el-form-item label="金额"><el-input-number v-model="balanceAmount" :min="-100000" :max="100000" style="width:100%"/><small style="color:#94a3b8">正数加余额，负数扣余额</small></el-form-item>
      <el-form-item label="备注"><el-input v-model="balanceRemark" placeholder="如：手动充值/活动赠送/补偿"/></el-form-item>
    </el-form>
    <template #footer><el-button @click="balanceDialog=false">取消</el-button><el-button type="primary" :loading="balanceSaving" @click="saveBalance">保存</el-button></template>
  </el-dialog>
</template>
<style scoped>
.logo{padding:23px;font-size:19px;font-weight:700}.logo small{display:block;color:#9aa2a2;font-size:11px;font-weight:400;margin-top:5px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee}
.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.title h2{margin:0 0 6px}.title p{color:#7a8385;margin:0}
.filters{display:flex;gap:10px;margin-bottom:18px}
.flow-plus{color:#16a34a}.flow-minus{color:#dc2626}
</style>
