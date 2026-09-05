<template>
  <div class="p-2 app-container"><el-card shadow="never"><template #header><div class="header"><div><h3>平台用户管理</h3><p>管理用户端注册账号、登录状态和余额；与后台管理员账号完全隔离。</p></div><div class="search"><el-input v-model="keyword" placeholder="搜索用户名/昵称/邮箱" clearable @keyup.enter="load"/><el-button icon="Search" @click="load">查询</el-button></div></div></template>
    <el-table v-loading="loading" :data="rows" border>
      <el-table-column prop="user_id" label="ID" width="200"/>
      <el-table-column prop="user_name" label="用户名" min-width="160"/>
      <el-table-column prop="email" label="邮箱" min-width="180"/>
      <el-table-column label="余额" width="110"><template #default="scope"><b style="color:#2563eb">{{ scope.row.balance }}</b></template></el-table-column>
      <el-table-column label="状态" width="100"><template #default="scope"><el-switch :model-value="scope.row.status==='0'" inline-prompt active-text="正常" inactive-text="封禁" @change="changeStatus(scope.row,$event)"/></template></el-table-column>
      <el-table-column prop="create_time" label="注册时间" min-width="160"/>
      <el-table-column label="操作" width="330" fixed="right"><template #default="scope"><el-button link type="primary" @click="openPermissions(scope.row)">菜单权限</el-button><el-button link type="primary" @click="openForm(scope.row)">调余额</el-button><el-button link type="warning" @click="forceLogout(scope.row)">下线</el-button><el-button link type="danger" @click="remove(scope.row)">删除</el-button></template></el-table-column>
    </el-table>
  </el-card>
  <el-dialog v-model="visible" :title="`调整余额 - ${form.userName || ''}`" width="440">
    <el-form label-width="90">
      <el-form-item label="调整金额"><el-input-number v-model="form.amount" :min="-1000000" :max="1000000" style="width:100%"/><div style="color:#8492a6;font-size:12px;margin-top:4px">正数加余额，负数扣余额</div></el-form-item>
      <el-form-item label="备注"><el-input v-model="form.remark" placeholder="如：手动充值 / 活动赠送 / 补偿"/></el-form-item>
    </el-form>
    <template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
  </el-dialog>
  <el-dialog v-model="permissionVisible" :title="`用户端菜单权限 - ${permissionTarget?.email || permissionTarget?.user_name || ''}`" width="720">
    <div v-loading="permissionLoading" class="permission-editor">
      <el-alert v-if="inheritDefault" title="当前使用默认权限：新用户自动获得全部用户端菜单。取消勾选并保存后，将切换为该用户的个人权限。" type="success" :closable="false" show-icon/>
      <div class="permission-toolbar"><el-checkbox v-model="checkAll" :indeterminate="isIndeterminate" @change="toggleAll">全选全部用户端功能</el-checkbox><span>已选 {{ checkedMenuIds.length }} / {{ menuOptions.length }}</span></div>
      <el-checkbox-group v-model="checkedMenuIds" class="permission-grid" @change="inheritDefault=false">
        <el-checkbox v-for="item in menuOptions" :key="item.menu_id" :value="Number(item.menu_id)"><div><b>{{ item.menu_name }}</b><small>{{ item.perms }}</small></div></el-checkbox>
      </el-checkbox-group>
    </div>
    <template #footer><el-button @click="permissionVisible=false">取消</el-button><el-button @click="restoreDefault">恢复默认全部</el-button><el-button type="primary" :loading="permissionSaving" @click="savePermissions">保存并让用户重新登录</el-button></template>
  </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { adjustBalance, deleteUser, getUserMenuPermissions, listUsers, logoutUser, updateUserMenuPermissions, updateUserStatus } from '@/api/aigc/billing';
import modal from '@/plugins/modal';
const rows=ref<any[]>([]);const loading=ref(false);const keyword=ref('');
const visible=ref(false);const saving=ref(false);
const permissionVisible=ref(false);const permissionLoading=ref(false);const permissionSaving=ref(false);const permissionTarget=ref<any>(null);const menuOptions=ref<any[]>([]);const checkedMenuIds=ref<number[]>([]);const inheritDefault=ref(true);
const checkAll=computed({get:()=>menuOptions.value.length>0&&checkedMenuIds.value.length===menuOptions.value.length,set:()=>{}});const isIndeterminate=computed(()=>checkedMenuIds.value.length>0&&checkedMenuIds.value.length<menuOptions.value.length);
const form=reactive<any>({userId:null,userName:'',amount:100,remark:''});
async function load(){loading.value=true;try{const res:any=await listUsers(keyword.value);rows.value=res.data||res||[]}finally{loading.value=false}}
function openForm(row:any){Object.assign(form,{userId:row.user_id,userName:row.user_name,amount:100,remark:''});visible.value=true}
async function openPermissions(row:any){permissionTarget.value=row;permissionVisible.value=true;permissionLoading.value=true;try{const res:any=await getUserMenuPermissions(row.user_id);const data=res.data||res;menuOptions.value=data.menus||[];checkedMenuIds.value=(data.selectedMenuIds||[]).map(Number);inheritDefault.value=Boolean(data.inheritDefault)}catch(e:any){modal.msgError(e.message||'读取菜单权限失败');permissionVisible.value=false}finally{permissionLoading.value=false}}
function toggleAll(value:any){checkedMenuIds.value=value?menuOptions.value.map(x=>Number(x.menu_id)):[];inheritDefault.value=false}
async function savePermissions(){if(!permissionTarget.value)return;permissionSaving.value=true;try{await updateUserMenuPermissions(permissionTarget.value.user_id,{menuIds:checkedMenuIds.value,inheritDefault:false});modal.msgSuccess('菜单权限已保存，用户已下线，重新登录后生效');permissionVisible.value=false}catch(e:any){modal.msgError(e.message||'保存菜单权限失败')}finally{permissionSaving.value=false}}
async function restoreDefault(){if(!permissionTarget.value)return;try{await modal.confirm('恢复为默认全部用户端菜单？用户将被强制下线。');permissionSaving.value=true;await updateUserMenuPermissions(permissionTarget.value.user_id,{inheritDefault:true});modal.msgSuccess('已恢复默认全部权限');permissionVisible.value=false}catch(e:any){if(e!=='cancel'&&e!=='close'&&e?.message)modal.msgError(e.message)}finally{permissionSaving.value=false}}
async function save(){
  if(!form.userId)return;if(!form.amount){return modal.msgWarning('请输入调整金额')}
  saving.value=true
  try{await adjustBalance(form.userId,{amount:form.amount,remark:form.remark});modal.msgSuccess('调整成功');visible.value=false;load()}
  catch(e:any){modal.msgError(e.message||'调整失败')}finally{saving.value=false}
}
async function changeStatus(row:any,enabled:any){
  const status=enabled?'0':'1';
  try{await updateUserStatus(row.user_id,status);row.status=status;modal.msgSuccess(status==='1'?'用户已封禁并强制下线':'用户已解封')}
  catch(e:any){modal.msgError(e.message||'状态修改失败');load()}
}
async function forceLogout(row:any){
  try{await modal.confirm(`确认强制用户 ${row.email||row.user_name} 下线？账号仍可重新登录。`);await logoutUser(row.user_id);modal.msgSuccess('用户已强制下线')}
  catch(e:any){if(e!=='cancel'&&e!=='close'&&e?.message)modal.msgError(e.message)}
}
async function remove(row:any){
  try{await modal.confirm(`确认删除用户 ${row.email||row.user_name}？账号将立即下线，订单和消费流水仍会保留。`);await deleteUser(row.user_id);modal.msgSuccess('用户已删除');load()}
  catch(e:any){if(e!=='cancel'&&e!=='close'&&e?.message)modal.msgError(e.message)}
}
onMounted(load);
</script>
<style scoped>.header{display:flex;justify-content:space-between;align-items:center;gap:16px}.header h3{margin:0 0 6px}.header p{margin:0;color:#8492a6;font-size:13px}.search{display:flex;gap:8px;width:360px}.permission-toolbar{display:flex;justify-content:space-between;align-items:center;margin:16px 0 10px;padding-bottom:10px;border-bottom:1px solid var(--el-border-color-lighter);color:#8492a6;font-size:12px}.permission-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-height:430px;overflow:auto}.permission-grid :deep(.el-checkbox){height:auto;margin:0;padding:10px;border:1px solid var(--el-border-color-lighter);border-radius:6px;align-items:flex-start}.permission-grid :deep(.el-checkbox__label){min-width:0}.permission-grid b,.permission-grid small{display:block}.permission-grid b{color:var(--el-text-color-primary);font-size:13px}.permission-grid small{margin-top:3px;color:#9aa6b6;font-size:10px;overflow:hidden;text-overflow:ellipsis}@media(max-width:768px){.header{align-items:flex-start;flex-direction:column}.search{width:100%}.permission-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>
