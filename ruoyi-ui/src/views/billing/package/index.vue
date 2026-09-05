<template>
  <div class="p-2 app-container"><el-card shadow="never"><template #header><div class="header"><div><h3>充值套餐</h3><p>配置用户支付金额与实际到账余额，用户端自动同步。</p></div><el-button type="primary" icon="Plus" @click="openForm()">新增套餐</el-button></div></template>
    <el-table v-loading="loading" :data="rows" border><el-table-column prop="package_name" label="套餐名称"/><el-table-column prop="price" label="支付金额（元）"/><el-table-column prop="credits" label="到账余额"/><el-table-column label="状态"><template #default="scope"><el-tag :type="scope.row.status==='0'?'success':'info'">{{scope.row.status==='0'?'上架':'下架'}}</el-tag></template></el-table-column><el-table-column prop="create_time" label="创建时间"/><el-table-column label="操作" width="130"><template #default="scope"><el-button link type="primary" @click="openForm(scope.row)">编辑</el-button><el-button link type="danger" @click="remove(scope.row)">删除</el-button></template></el-table-column></el-table>
  </el-card><el-dialog v-model="visible" :title="form.id?'编辑套餐':'新增套餐'" width="480"><el-form label-width="110"><el-form-item label="套餐名称"><el-input v-model="form.packageName"/></el-form-item><el-form-item label="支付金额"><el-input-number v-model="form.price" :min="0.01" :precision="2"/></el-form-item><el-form-item label="到账余额"><el-input-number v-model="form.credits" :min="1"/></el-form-item><el-form-item label="状态"><el-radio-group v-model="form.status"><el-radio value="0">上架</el-radio><el-radio value="1">下架</el-radio></el-radio-group></el-form-item></el-form><template #footer><el-button @click="visible=false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template></el-dialog></div>
</template>
<script setup lang="ts">
import { addPackage, deletePackage, listPackages, updatePackage } from '@/api/aigc/billing';
import modal from '@/plugins/modal';
const rows=ref<any[]>([]);const loading=ref(false);const visible=ref(false);const form=reactive<any>({id:null,packageName:'',price:9.9,credits:100,status:'0'});
async function load(){loading.value=true;try{const res:any=await listPackages();rows.value=res.data||res||[]}finally{loading.value=false}}
function openForm(row?:any){Object.assign(form,row?{id:row.id,packageName:row.package_name,price:Number(row.price),credits:Number(row.credits),status:row.status}:{id:null,packageName:'',price:9.9,credits:100,status:'0'});visible.value=true}
async function save(){if(!form.packageName)return modal.msgWarning('请输入套餐名称');form.id?await updatePackage(form.id,form):await addPackage(form);modal.msgSuccess('保存成功');visible.value=false;load()}
async function remove(row:any){await modal.confirm(`确认删除套餐“${row.package_name}”吗？`);await deletePackage(row.id);modal.msgSuccess('删除成功');load()}
onMounted(load);
</script>
<style scoped>.header{display:flex;justify-content:space-between;align-items:center}.header h3{margin:0 0 6px}.header p{margin:0;color:#8492a6;font-size:13px}</style>
