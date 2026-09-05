import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
const PC_CLIENT = 'e5cd7e4891bf95d1d19206ce24a7b32e';
const active = ref('dashboard');
const menus = [{ name: '工作台', path: '/dashboard', permission: 'dashboard:view' }, { name: '用户管理', path: '/system/user', permission: 'system:user:list' }, { name: '角色管理', path: '/system/role', permission: 'system:role:list' }, { name: '菜单管理', path: '/system/menu', permission: 'system:menu:list' }, { name: '套餐管理', path: '/billing/package', permission: 'billing:package:list' }];
const adminToken = ref(localStorage.getItem('ll_admin_token') || '');
const adminName = ref(localStorage.getItem('ll_admin_name') || '');
const loginOpen = ref(!adminToken.value);
const loginUsername = ref('admin');
const loginPassword = ref('');
const loginLoading = ref(false);
const apiFetch = (input, init = {}) => fetch(input, { ...init, headers: { 'Content-Type': 'application/json', clientid: PC_CLIENT, ...(adminToken.value ? { Authorization: `Bearer ${adminToken.value}` } : {}), ...(init.headers || {}) } });
async function doLogin() {
    if (!loginUsername.value.trim() || !loginPassword.value) {
        ElMessage.warning('请输入账号和密码');
        return;
    }
    loginLoading.value = true;
    try {
        const res = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', clientid: PC_CLIENT }, body: JSON.stringify({ username: loginUsername.value.trim(), password: loginPassword.value, clientId: PC_CLIENT, grantType: 'password', userType: 'sys_user' }) });
        const data = await res.json();
        if (data.code !== 200)
            throw new Error(data.msg || '登录失败');
        adminToken.value = data.data.access_token;
        adminName.value = loginUsername.value.trim();
        localStorage.setItem('ll_admin_token', data.data.access_token);
        localStorage.setItem('ll_admin_name', adminName.value);
        loginOpen.value = false;
        ElMessage.success('登录成功');
        loadAll();
    }
    catch (e) {
        ElMessage.error(e.message || '登录失败');
    }
    finally {
        loginLoading.value = false;
    }
}
function logout() { adminToken.value = ''; adminName.value = ''; localStorage.removeItem('ll_admin_token'); localStorage.removeItem('ll_admin_name'); loginOpen.value = true; }
const users = ref([]);
const keyword = ref('');
const balanceDialog = ref(false);
const balanceTarget = ref(null);
const balanceAmount = ref(100);
const balanceRemark = ref('');
const balanceSaving = ref(false);
async function loadUsers() {
    try {
        const res = await apiFetch(`/aigc/admin/users${keyword.value.trim() ? '?keyword=' + encodeURIComponent(keyword.value.trim()) : ''}`);
        const data = await res.json();
        if (data.code === 200)
            users.value = data.data || [];
        else if (data.code === 401) {
            ElMessage.warning('登录已过期，请重新登录');
            loginOpen.value = true;
        }
    }
    catch {
        ElMessage.error('用户列表加载失败');
    }
}
function openBalance(user) { balanceTarget.value = user; balanceAmount.value = 100; balanceRemark.value = ''; balanceDialog.value = true; }
async function saveBalance() {
    const amt = Number(balanceAmount.value);
    if (!amt) {
        ElMessage.warning('请输入调整金额');
        return;
    }
    balanceSaving.value = true;
    try {
        const res = await apiFetch(`/aigc/admin/users/${balanceTarget.value.user_id}/balance`, { method: 'POST', body: JSON.stringify({ amount: amt, remark: balanceRemark.value }) });
        const data = await res.json();
        if (data.code !== 200)
            throw new Error(data.msg || '调整失败');
        ElMessage.success(amt > 0 ? `已加余额 ${amt}` : `已扣余额 ${Math.abs(amt)}`);
        balanceDialog.value = false;
        loadUsers();
    }
    catch (e) {
        ElMessage.error(e.message || '调整失败');
    }
    finally {
        balanceSaving.value = false;
    }
}
const packages = ref([]);
const orders = ref([]);
const flows = ref([]);
async function loadAll() {
    try {
        const r1 = await apiFetch('/aigc/admin/packages');
        if (r1.ok) {
            const d = await r1.json();
            if (d.code === 200)
                packages.value = d.data || [];
        }
    }
    catch { }
    try {
        const r2 = await apiFetch('/aigc/admin/orders');
        if (r2.ok) {
            const d = await r2.json();
            if (d.code === 200)
                orders.value = d.data || [];
        }
    }
    catch { }
    try {
        const r3 = await apiFetch('/aigc/admin/credit-flows');
        if (r3.ok) {
            const d = await r3.json();
            if (d.code === 200)
                flows.value = d.data || [];
        }
    }
    catch { }
    await loadUsers();
}
onMounted(() => { if (adminToken.value)
    loadAll(); }); /* PartiallyEnd: #3632/scriptSetup.vue */
function __VLS_template() {
    const __VLS_ctx = {};
    let __VLS_components;
    let __VLS_directives;
    ['logo', 'title', 'title',];
    // CSS variable injection 
    // CSS variable injection end 
    const __VLS_0 = {}.ElContainer;
    /** @type { [typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, ] } */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ style: ({}) },
    }));
    const __VLS_2 = __VLS_1({
        ...{ style: ({}) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const __VLS_6 = {}.ElAside;
    /** @type { [typeof __VLS_components.ElAside, typeof __VLS_components.elAside, typeof __VLS_components.ElAside, typeof __VLS_components.elAside, ] } */ ;
    // @ts-ignore
    const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
        width: ("230px"),
    }));
    const __VLS_8 = __VLS_7({
        width: ("230px"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_7));
    __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: ("logo") },
    });
    __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
    const __VLS_12 = {}.ElMenu;
    /** @type { [typeof __VLS_components.ElMenu, typeof __VLS_components.elMenu, typeof __VLS_components.ElMenu, typeof __VLS_components.elMenu, ] } */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        ...{ 'onSelect': {} },
        defaultActive: ((__VLS_ctx.active)),
    }));
    const __VLS_14 = __VLS_13({
        ...{ 'onSelect': {} },
        defaultActive: ((__VLS_ctx.active)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    let __VLS_18;
    const __VLS_19 = {
        onSelect: (...[$event]) => {
            __VLS_ctx.active = $event;
        }
    };
    let __VLS_15;
    let __VLS_16;
    const __VLS_20 = {}.ElMenuItem;
    /** @type { [typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ] } */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        index: ("dashboard"),
    }));
    const __VLS_22 = __VLS_21({
        index: ("dashboard"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    __VLS_25.slots.default;
    var __VLS_25;
    const __VLS_26 = {}.ElSubMenu;
    /** @type { [typeof __VLS_components.ElSubMenu, typeof __VLS_components.elSubMenu, typeof __VLS_components.ElSubMenu, typeof __VLS_components.elSubMenu, ] } */ ;
    // @ts-ignore
    const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
        index: ("system"),
    }));
    const __VLS_28 = __VLS_27({
        index: ("system"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_27));
    __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
    {
        const { title: __VLS_thisSlot } = __VLS_31.slots;
    }
    const __VLS_32 = {}.ElMenuItem;
    /** @type { [typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ] } */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        index: ("users"),
    }));
    const __VLS_34 = __VLS_33({
        index: ("users"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_37.slots.default;
    var __VLS_37;
    var __VLS_31;
    const __VLS_38 = {}.ElSubMenu;
    /** @type { [typeof __VLS_components.ElSubMenu, typeof __VLS_components.elSubMenu, typeof __VLS_components.ElSubMenu, typeof __VLS_components.elSubMenu, ] } */ ;
    // @ts-ignore
    const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
        index: ("business"),
    }));
    const __VLS_40 = __VLS_39({
        index: ("business"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_39));
    __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
    {
        const { title: __VLS_thisSlot } = __VLS_43.slots;
    }
    const __VLS_44 = {}.ElMenuItem;
    /** @type { [typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ] } */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        index: ("packages"),
    }));
    const __VLS_46 = __VLS_45({
        index: ("packages"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    __VLS_49.slots.default;
    var __VLS_49;
    const __VLS_50 = {}.ElMenuItem;
    /** @type { [typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ] } */ ;
    // @ts-ignore
    const __VLS_51 = __VLS_asFunctionalComponent(__VLS_50, new __VLS_50({
        index: ("orders"),
    }));
    const __VLS_52 = __VLS_51({
        index: ("orders"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_51));
    __VLS_55.slots.default;
    var __VLS_55;
    const __VLS_56 = {}.ElMenuItem;
    /** @type { [typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, typeof __VLS_components.ElMenuItem, typeof __VLS_components.elMenuItem, ] } */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        index: ("flows"),
    }));
    const __VLS_58 = __VLS_57({
        index: ("flows"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_61.slots.default;
    var __VLS_61;
    var __VLS_43;
    __VLS_17.slots.default;
    var __VLS_17;
    __VLS_11.slots.default;
    var __VLS_11;
    const __VLS_62 = {}.ElContainer;
    /** @type { [typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, typeof __VLS_components.ElContainer, typeof __VLS_components.elContainer, ] } */ ;
    // @ts-ignore
    const __VLS_63 = __VLS_asFunctionalComponent(__VLS_62, new __VLS_62({}));
    const __VLS_64 = __VLS_63({}, ...__VLS_functionalComponentArgsRest(__VLS_63));
    const __VLS_68 = {}.ElHeader;
    /** @type { [typeof __VLS_components.ElHeader, typeof __VLS_components.elHeader, typeof __VLS_components.ElHeader, typeof __VLS_components.elHeader, ] } */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        ...{ class: ("header") },
    }));
    const __VLS_70 = __VLS_69({
        ...{ class: ("header") },
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    if (__VLS_ctx.adminName) {
        __VLS_elementAsFunction(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.adminName);
        const __VLS_74 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_75 = __VLS_asFunctionalComponent(__VLS_74, new __VLS_74({
            ...{ 'onClick': {} },
            link: (true),
            type: ("danger"),
            ...{ style: ({}) },
        }));
        const __VLS_76 = __VLS_75({
            ...{ 'onClick': {} },
            link: (true),
            type: ("danger"),
            ...{ style: ({}) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_75));
        let __VLS_80;
        const __VLS_81 = {
            onClick: (__VLS_ctx.logout)
        };
        let __VLS_77;
        let __VLS_78;
        __VLS_79.slots.default;
        var __VLS_79;
    }
    __VLS_73.slots.default;
    var __VLS_73;
    const __VLS_82 = {}.ElMain;
    /** @type { [typeof __VLS_components.ElMain, typeof __VLS_components.elMain, typeof __VLS_components.ElMain, typeof __VLS_components.elMain, ] } */ ;
    // @ts-ignore
    const __VLS_83 = __VLS_asFunctionalComponent(__VLS_82, new __VLS_82({}));
    const __VLS_84 = __VLS_83({}, ...__VLS_functionalComponentArgsRest(__VLS_83));
    if (__VLS_ctx.active === 'users') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        const __VLS_88 = {}.ElCard;
        /** @type { [typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ] } */ ;
        // @ts-ignore
        const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({}));
        const __VLS_90 = __VLS_89({}, ...__VLS_functionalComponentArgsRest(__VLS_89));
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("filters") },
        });
        const __VLS_94 = {}.ElInput;
        /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
        // @ts-ignore
        const __VLS_95 = __VLS_asFunctionalComponent(__VLS_94, new __VLS_94({
            ...{ 'onKeyup': {} },
            modelValue: ((__VLS_ctx.keyword)),
            placeholder: ("搜索用户名/昵称/邮箱"),
            ...{ style: ({}) },
            clearable: (true),
        }));
        const __VLS_96 = __VLS_95({
            ...{ 'onKeyup': {} },
            modelValue: ((__VLS_ctx.keyword)),
            placeholder: ("搜索用户名/昵称/邮箱"),
            ...{ style: ({}) },
            clearable: (true),
        }, ...__VLS_functionalComponentArgsRest(__VLS_95));
        let __VLS_100;
        const __VLS_101 = {
            onKeyup: (__VLS_ctx.loadUsers)
        };
        let __VLS_97;
        let __VLS_98;
        var __VLS_99;
        const __VLS_102 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_103 = __VLS_asFunctionalComponent(__VLS_102, new __VLS_102({
            ...{ 'onClick': {} },
            type: ("primary"),
        }));
        const __VLS_104 = __VLS_103({
            ...{ 'onClick': {} },
            type: ("primary"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_103));
        let __VLS_108;
        const __VLS_109 = {
            onClick: (__VLS_ctx.loadUsers)
        };
        let __VLS_105;
        let __VLS_106;
        __VLS_107.slots.default;
        var __VLS_107;
        const __VLS_110 = {}.ElTable;
        /** @type { [typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ] } */ ;
        // @ts-ignore
        const __VLS_111 = __VLS_asFunctionalComponent(__VLS_110, new __VLS_110({
            data: ((__VLS_ctx.users)),
            ...{ style: ({}) },
        }));
        const __VLS_112 = __VLS_111({
            data: ((__VLS_ctx.users)),
            ...{ style: ({}) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_111));
        const __VLS_116 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            prop: ("user_id"),
            label: ("ID"),
            width: ("200"),
        }));
        const __VLS_118 = __VLS_117({
            prop: ("user_id"),
            label: ("ID"),
            width: ("200"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
        const __VLS_122 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_123 = __VLS_asFunctionalComponent(__VLS_122, new __VLS_122({
            prop: ("user_name"),
            label: ("用户名"),
            minWidth: ("160"),
        }));
        const __VLS_124 = __VLS_123({
            prop: ("user_name"),
            label: ("用户名"),
            minWidth: ("160"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_123));
        const __VLS_128 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
            prop: ("email"),
            label: ("邮箱"),
            minWidth: ("180"),
        }));
        const __VLS_130 = __VLS_129({
            prop: ("email"),
            label: ("邮箱"),
            minWidth: ("180"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_129));
        const __VLS_134 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_135 = __VLS_asFunctionalComponent(__VLS_134, new __VLS_134({
            prop: ("balance"),
            label: ("余额"),
            width: ("100"),
        }));
        const __VLS_136 = __VLS_135({
            prop: ("balance"),
            label: ("余额"),
            width: ("100"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_135));
        __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
        {
            const { default: __VLS_thisSlot } = __VLS_139.slots;
            const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({
                ...{ style: ({}) },
            });
            (scope.row.balance);
        }
        var __VLS_139;
        const __VLS_140 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
            label: ("状态"),
            width: ("80"),
        }));
        const __VLS_142 = __VLS_141({
            label: ("状态"),
            width: ("80"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
        {
            const { default: __VLS_thisSlot } = __VLS_145.slots;
            const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_146 = {}.ElTag;
            /** @type { [typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ] } */ ;
            // @ts-ignore
            const __VLS_147 = __VLS_asFunctionalComponent(__VLS_146, new __VLS_146({
                type: ((scope.row.status === '0' ? 'success' : 'danger')),
            }));
            const __VLS_148 = __VLS_147({
                type: ((scope.row.status === '0' ? 'success' : 'danger')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_147));
            (scope.row.status === '0' ? '正常' : '停用');
            __VLS_151.slots.default;
            var __VLS_151;
        }
        var __VLS_145;
        const __VLS_152 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
            prop: ("create_time"),
            label: ("注册时间"),
            minWidth: ("160"),
        }));
        const __VLS_154 = __VLS_153({
            prop: ("create_time"),
            label: ("注册时间"),
            minWidth: ("160"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_153));
        const __VLS_158 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_159 = __VLS_asFunctionalComponent(__VLS_158, new __VLS_158({
            label: ("操作"),
            width: ("120"),
        }));
        const __VLS_160 = __VLS_159({
            label: ("操作"),
            width: ("120"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_159));
        __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
        {
            const { default: __VLS_thisSlot } = __VLS_163.slots;
            const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_164 = {}.ElButton;
            /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
            // @ts-ignore
            const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
                ...{ 'onClick': {} },
                link: (true),
                type: ("primary"),
            }));
            const __VLS_166 = __VLS_165({
                ...{ 'onClick': {} },
                link: (true),
                type: ("primary"),
            }, ...__VLS_functionalComponentArgsRest(__VLS_165));
            let __VLS_170;
            const __VLS_171 = {
                onClick: (...[$event]) => {
                    if (!((__VLS_ctx.active === 'users')))
                        return;
                    __VLS_ctx.openBalance(scope.row);
                }
            };
            let __VLS_167;
            let __VLS_168;
            __VLS_169.slots.default;
            var __VLS_169;
        }
        var __VLS_163;
        __VLS_115.slots.default;
        var __VLS_115;
        __VLS_93.slots.default;
        var __VLS_93;
    }
    else if (__VLS_ctx.active === 'packages') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        const __VLS_172 = {}.ElCard;
        /** @type { [typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ] } */ ;
        // @ts-ignore
        const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({}));
        const __VLS_174 = __VLS_173({}, ...__VLS_functionalComponentArgsRest(__VLS_173));
        const __VLS_178 = {}.ElTable;
        /** @type { [typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ] } */ ;
        // @ts-ignore
        const __VLS_179 = __VLS_asFunctionalComponent(__VLS_178, new __VLS_178({
            data: ((__VLS_ctx.packages)),
            ...{ style: ({}) },
        }));
        const __VLS_180 = __VLS_179({
            data: ((__VLS_ctx.packages)),
            ...{ style: ({}) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_179));
        const __VLS_184 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
            prop: ("id"),
            label: ("ID"),
            width: ("80"),
        }));
        const __VLS_186 = __VLS_185({
            prop: ("id"),
            label: ("ID"),
            width: ("80"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_185));
        const __VLS_190 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_191 = __VLS_asFunctionalComponent(__VLS_190, new __VLS_190({
            prop: ("package_name"),
            label: ("套餐名"),
        }));
        const __VLS_192 = __VLS_191({
            prop: ("package_name"),
            label: ("套餐名"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_191));
        const __VLS_196 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
            prop: ("credits"),
            label: ("到账余额"),
            width: ("120"),
        }));
        const __VLS_198 = __VLS_197({
            prop: ("credits"),
            label: ("到账余额"),
            width: ("120"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_197));
        const __VLS_202 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_203 = __VLS_asFunctionalComponent(__VLS_202, new __VLS_202({
            prop: ("price"),
            label: ("价格(元)"),
            width: ("120"),
        }));
        const __VLS_204 = __VLS_203({
            prop: ("price"),
            label: ("价格(元)"),
            width: ("120"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_203));
        const __VLS_208 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
            prop: ("status"),
            label: ("状态"),
            width: ("80"),
        }));
        const __VLS_210 = __VLS_209({
            prop: ("status"),
            label: ("状态"),
            width: ("80"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_209));
        __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
        {
            const { default: __VLS_thisSlot } = __VLS_213.slots;
            const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_214 = {}.ElTag;
            /** @type { [typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ] } */ ;
            // @ts-ignore
            const __VLS_215 = __VLS_asFunctionalComponent(__VLS_214, new __VLS_214({
                type: ((scope.row.status === '0' ? 'success' : 'info')),
            }));
            const __VLS_216 = __VLS_215({
                type: ((scope.row.status === '0' ? 'success' : 'info')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_215));
            (scope.row.status === '0' ? '上架' : '下架');
            __VLS_219.slots.default;
            var __VLS_219;
        }
        var __VLS_213;
        __VLS_183.slots.default;
        var __VLS_183;
        __VLS_177.slots.default;
        var __VLS_177;
    }
    else if (__VLS_ctx.active === 'orders') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        const __VLS_220 = {}.ElCard;
        /** @type { [typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ] } */ ;
        // @ts-ignore
        const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({}));
        const __VLS_222 = __VLS_221({}, ...__VLS_functionalComponentArgsRest(__VLS_221));
        const __VLS_226 = {}.ElTable;
        /** @type { [typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ] } */ ;
        // @ts-ignore
        const __VLS_227 = __VLS_asFunctionalComponent(__VLS_226, new __VLS_226({
            data: ((__VLS_ctx.orders)),
            height: ("560"),
            ...{ style: ({}) },
        }));
        const __VLS_228 = __VLS_227({
            data: ((__VLS_ctx.orders)),
            height: ("560"),
            ...{ style: ({}) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_227));
        const __VLS_232 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
            prop: ("order_no"),
            label: ("订单号"),
            minWidth: ("210"),
        }));
        const __VLS_234 = __VLS_233({
            prop: ("order_no"),
            label: ("订单号"),
            minWidth: ("210"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_233));
        const __VLS_238 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_239 = __VLS_asFunctionalComponent(__VLS_238, new __VLS_238({
            prop: ("user_name"),
            label: ("用户"),
            width: ("160"),
        }));
        const __VLS_240 = __VLS_239({
            prop: ("user_name"),
            label: ("用户"),
            width: ("160"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_239));
        const __VLS_244 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_245 = __VLS_asFunctionalComponent(__VLS_244, new __VLS_244({
            prop: ("package_name"),
            label: ("套餐"),
        }));
        const __VLS_246 = __VLS_245({
            prop: ("package_name"),
            label: ("套餐"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_245));
        const __VLS_250 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_251 = __VLS_asFunctionalComponent(__VLS_250, new __VLS_250({
            prop: ("amount"),
            label: ("金额"),
            width: ("90"),
        }));
        const __VLS_252 = __VLS_251({
            prop: ("amount"),
            label: ("金额"),
            width: ("90"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_251));
        const __VLS_256 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_257 = __VLS_asFunctionalComponent(__VLS_256, new __VLS_256({
            prop: ("credits"),
            label: ("到账"),
            width: ("90"),
        }));
        const __VLS_258 = __VLS_257({
            prop: ("credits"),
            label: ("到账"),
            width: ("90"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_257));
        const __VLS_262 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_263 = __VLS_asFunctionalComponent(__VLS_262, new __VLS_262({
            prop: ("status"),
            label: ("状态"),
            width: ("90"),
        }));
        const __VLS_264 = __VLS_263({
            prop: ("status"),
            label: ("状态"),
            width: ("90"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_263));
        __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
        {
            const { default: __VLS_thisSlot } = __VLS_267.slots;
            const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
            const __VLS_268 = {}.ElTag;
            /** @type { [typeof __VLS_components.ElTag, typeof __VLS_components.elTag, typeof __VLS_components.ElTag, typeof __VLS_components.elTag, ] } */ ;
            // @ts-ignore
            const __VLS_269 = __VLS_asFunctionalComponent(__VLS_268, new __VLS_268({
                type: ((scope.row.status === 'PAID' ? 'success' : 'warning')),
            }));
            const __VLS_270 = __VLS_269({
                type: ((scope.row.status === 'PAID' ? 'success' : 'warning')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_269));
            (scope.row.status === 'PAID' ? '已支付' : '待支付');
            __VLS_273.slots.default;
            var __VLS_273;
        }
        var __VLS_267;
        const __VLS_274 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_275 = __VLS_asFunctionalComponent(__VLS_274, new __VLS_274({
            prop: ("paid_time"),
            label: ("支付时间"),
            minWidth: ("160"),
        }));
        const __VLS_276 = __VLS_275({
            prop: ("paid_time"),
            label: ("支付时间"),
            minWidth: ("160"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_275));
        __VLS_231.slots.default;
        var __VLS_231;
        __VLS_225.slots.default;
        var __VLS_225;
    }
    else if (__VLS_ctx.active === 'flows') {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        const __VLS_280 = {}.ElCard;
        /** @type { [typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ] } */ ;
        // @ts-ignore
        const __VLS_281 = __VLS_asFunctionalComponent(__VLS_280, new __VLS_280({}));
        const __VLS_282 = __VLS_281({}, ...__VLS_functionalComponentArgsRest(__VLS_281));
        const __VLS_286 = {}.ElTable;
        /** @type { [typeof __VLS_components.ElTable, typeof __VLS_components.elTable, typeof __VLS_components.ElTable, typeof __VLS_components.elTable, ] } */ ;
        // @ts-ignore
        const __VLS_287 = __VLS_asFunctionalComponent(__VLS_286, new __VLS_286({
            data: ((__VLS_ctx.flows)),
            height: ("560"),
            ...{ style: ({}) },
        }));
        const __VLS_288 = __VLS_287({
            data: ((__VLS_ctx.flows)),
            height: ("560"),
            ...{ style: ({}) },
        }, ...__VLS_functionalComponentArgsRest(__VLS_287));
        const __VLS_292 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_293 = __VLS_asFunctionalComponent(__VLS_292, new __VLS_292({
            prop: ("user_name"),
            label: ("用户"),
            width: ("160"),
        }));
        const __VLS_294 = __VLS_293({
            prop: ("user_name"),
            label: ("用户"),
            width: ("160"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_293));
        const __VLS_298 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_299 = __VLS_asFunctionalComponent(__VLS_298, new __VLS_298({
            prop: ("change_amount"),
            label: ("变动"),
            width: ("90"),
        }));
        const __VLS_300 = __VLS_299({
            prop: ("change_amount"),
            label: ("变动"),
            width: ("90"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_299));
        __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
        {
            const { default: __VLS_thisSlot } = __VLS_303.slots;
            const [scope] = __VLS_getSlotParams(__VLS_thisSlot);
            __VLS_elementAsFunction(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({
                ...{ class: ((scope.row.change_amount > 0 ? 'flow-plus' : 'flow-minus')) },
            });
            (scope.row.change_amount > 0 ? '+' : '');
            (scope.row.change_amount);
        }
        var __VLS_303;
        const __VLS_304 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_305 = __VLS_asFunctionalComponent(__VLS_304, new __VLS_304({
            prop: ("balance"),
            label: ("变动后余额"),
            width: ("110"),
        }));
        const __VLS_306 = __VLS_305({
            prop: ("balance"),
            label: ("变动后余额"),
            width: ("110"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_305));
        const __VLS_310 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_311 = __VLS_asFunctionalComponent(__VLS_310, new __VLS_310({
            prop: ("source"),
            label: ("来源"),
            width: ("90"),
        }));
        const __VLS_312 = __VLS_311({
            prop: ("source"),
            label: ("来源"),
            width: ("90"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_311));
        const __VLS_316 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_317 = __VLS_asFunctionalComponent(__VLS_316, new __VLS_316({
            prop: ("remark"),
            label: ("备注"),
        }));
        const __VLS_318 = __VLS_317({
            prop: ("remark"),
            label: ("备注"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_317));
        const __VLS_322 = {}.ElTableColumn;
        /** @type { [typeof __VLS_components.ElTableColumn, typeof __VLS_components.elTableColumn, ] } */ ;
        // @ts-ignore
        const __VLS_323 = __VLS_asFunctionalComponent(__VLS_322, new __VLS_322({
            prop: ("create_time"),
            label: ("时间"),
            minWidth: ("160"),
        }));
        const __VLS_324 = __VLS_323({
            prop: ("create_time"),
            label: ("时间"),
            minWidth: ("160"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_323));
        __VLS_291.slots.default;
        var __VLS_291;
        __VLS_285.slots.default;
        var __VLS_285;
    }
    else {
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: ("title") },
        });
        __VLS_elementAsFunction(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({});
        __VLS_elementAsFunction(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
        const __VLS_328 = {}.ElCard;
        /** @type { [typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ] } */ ;
        // @ts-ignore
        const __VLS_329 = __VLS_asFunctionalComponent(__VLS_328, new __VLS_328({}));
        const __VLS_330 = __VLS_329({}, ...__VLS_functionalComponentArgsRest(__VLS_329));
        const __VLS_334 = {}.ElEmpty;
        /** @type { [typeof __VLS_components.ElEmpty, typeof __VLS_components.elEmpty, ] } */ ;
        // @ts-ignore
        const __VLS_335 = __VLS_asFunctionalComponent(__VLS_334, new __VLS_334({
            description: ("套餐/订单/流水已接入真实接口，更多页面陆续接入"),
        }));
        const __VLS_336 = __VLS_335({
            description: ("套餐/订单/流水已接入真实接口，更多页面陆续接入"),
        }, ...__VLS_functionalComponentArgsRest(__VLS_335));
        __VLS_333.slots.default;
        var __VLS_333;
    }
    __VLS_87.slots.default;
    var __VLS_87;
    __VLS_67.slots.default;
    var __VLS_67;
    __VLS_5.slots.default;
    var __VLS_5;
    const __VLS_340 = {}.ElDialog;
    /** @type { [typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ] } */ ;
    // @ts-ignore
    const __VLS_341 = __VLS_asFunctionalComponent(__VLS_340, new __VLS_340({
        modelValue: ((__VLS_ctx.loginOpen)),
        width: ("400px"),
        title: ("运营后台登录"),
        closeOnClickModal: ((false)),
        showClose: ((false)),
    }));
    const __VLS_342 = __VLS_341({
        modelValue: ((__VLS_ctx.loginOpen)),
        width: ("400px"),
        title: ("运营后台登录"),
        closeOnClickModal: ((false)),
        showClose: ((false)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_341));
    const __VLS_346 = {}.ElForm;
    /** @type { [typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ] } */ ;
    // @ts-ignore
    const __VLS_347 = __VLS_asFunctionalComponent(__VLS_346, new __VLS_346({
        labelWidth: ("60px"),
    }));
    const __VLS_348 = __VLS_347({
        labelWidth: ("60px"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_347));
    const __VLS_352 = {}.ElFormItem;
    /** @type { [typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ] } */ ;
    // @ts-ignore
    const __VLS_353 = __VLS_asFunctionalComponent(__VLS_352, new __VLS_352({
        label: ("账号"),
    }));
    const __VLS_354 = __VLS_353({
        label: ("账号"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_353));
    const __VLS_358 = {}.ElInput;
    /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
    // @ts-ignore
    const __VLS_359 = __VLS_asFunctionalComponent(__VLS_358, new __VLS_358({
        modelValue: ((__VLS_ctx.loginUsername)),
        placeholder: ("管理员账号"),
    }));
    const __VLS_360 = __VLS_359({
        modelValue: ((__VLS_ctx.loginUsername)),
        placeholder: ("管理员账号"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_359));
    __VLS_357.slots.default;
    var __VLS_357;
    const __VLS_364 = {}.ElFormItem;
    /** @type { [typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ] } */ ;
    // @ts-ignore
    const __VLS_365 = __VLS_asFunctionalComponent(__VLS_364, new __VLS_364({
        label: ("密码"),
    }));
    const __VLS_366 = __VLS_365({
        label: ("密码"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_365));
    const __VLS_370 = {}.ElInput;
    /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
    // @ts-ignore
    const __VLS_371 = __VLS_asFunctionalComponent(__VLS_370, new __VLS_370({
        ...{ 'onKeyup': {} },
        modelValue: ((__VLS_ctx.loginPassword)),
        type: ("password"),
        showPassword: (true),
        placeholder: ("密码"),
    }));
    const __VLS_372 = __VLS_371({
        ...{ 'onKeyup': {} },
        modelValue: ((__VLS_ctx.loginPassword)),
        type: ("password"),
        showPassword: (true),
        placeholder: ("密码"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_371));
    let __VLS_376;
    const __VLS_377 = {
        onKeyup: (__VLS_ctx.doLogin)
    };
    let __VLS_373;
    let __VLS_374;
    var __VLS_375;
    __VLS_369.slots.default;
    var __VLS_369;
    __VLS_351.slots.default;
    var __VLS_351;
    __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
    {
        const { footer: __VLS_thisSlot } = __VLS_345.slots;
        const __VLS_378 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_379 = __VLS_asFunctionalComponent(__VLS_378, new __VLS_378({
            ...{ 'onClick': {} },
            type: ("primary"),
            loading: ((__VLS_ctx.loginLoading)),
        }));
        const __VLS_380 = __VLS_379({
            ...{ 'onClick': {} },
            type: ("primary"),
            loading: ((__VLS_ctx.loginLoading)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_379));
        let __VLS_384;
        const __VLS_385 = {
            onClick: (__VLS_ctx.doLogin)
        };
        let __VLS_381;
        let __VLS_382;
        __VLS_383.slots.default;
        var __VLS_383;
    }
    var __VLS_345;
    const __VLS_386 = {}.ElDialog;
    /** @type { [typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, typeof __VLS_components.ElDialog, typeof __VLS_components.elDialog, ] } */ ;
    // @ts-ignore
    const __VLS_387 = __VLS_asFunctionalComponent(__VLS_386, new __VLS_386({
        modelValue: ((__VLS_ctx.balanceDialog)),
        width: ("420px"),
        title: ((`调整余额 - ${__VLS_ctx.balanceTarget?.user_name || ''}`)),
    }));
    const __VLS_388 = __VLS_387({
        modelValue: ((__VLS_ctx.balanceDialog)),
        width: ("420px"),
        title: ((`调整余额 - ${__VLS_ctx.balanceTarget?.user_name || ''}`)),
    }, ...__VLS_functionalComponentArgsRest(__VLS_387));
    const __VLS_392 = {}.ElForm;
    /** @type { [typeof __VLS_components.ElForm, typeof __VLS_components.elForm, typeof __VLS_components.ElForm, typeof __VLS_components.elForm, ] } */ ;
    // @ts-ignore
    const __VLS_393 = __VLS_asFunctionalComponent(__VLS_392, new __VLS_392({
        labelWidth: ("70px"),
    }));
    const __VLS_394 = __VLS_393({
        labelWidth: ("70px"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_393));
    const __VLS_398 = {}.ElFormItem;
    /** @type { [typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ] } */ ;
    // @ts-ignore
    const __VLS_399 = __VLS_asFunctionalComponent(__VLS_398, new __VLS_398({
        label: ("金额"),
    }));
    const __VLS_400 = __VLS_399({
        label: ("金额"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_399));
    const __VLS_404 = {}.ElInputNumber;
    /** @type { [typeof __VLS_components.ElInputNumber, typeof __VLS_components.elInputNumber, ] } */ ;
    // @ts-ignore
    const __VLS_405 = __VLS_asFunctionalComponent(__VLS_404, new __VLS_404({
        modelValue: ((__VLS_ctx.balanceAmount)),
        min: ((-100000)),
        max: ((100000)),
        ...{ style: ({}) },
    }));
    const __VLS_406 = __VLS_405({
        modelValue: ((__VLS_ctx.balanceAmount)),
        min: ((-100000)),
        max: ((100000)),
        ...{ style: ({}) },
    }, ...__VLS_functionalComponentArgsRest(__VLS_405));
    __VLS_elementAsFunction(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({
        ...{ style: ({}) },
    });
    __VLS_403.slots.default;
    var __VLS_403;
    const __VLS_410 = {}.ElFormItem;
    /** @type { [typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, typeof __VLS_components.ElFormItem, typeof __VLS_components.elFormItem, ] } */ ;
    // @ts-ignore
    const __VLS_411 = __VLS_asFunctionalComponent(__VLS_410, new __VLS_410({
        label: ("备注"),
    }));
    const __VLS_412 = __VLS_411({
        label: ("备注"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_411));
    const __VLS_416 = {}.ElInput;
    /** @type { [typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ] } */ ;
    // @ts-ignore
    const __VLS_417 = __VLS_asFunctionalComponent(__VLS_416, new __VLS_416({
        modelValue: ((__VLS_ctx.balanceRemark)),
        placeholder: ("如：手动充值/活动赠送/补偿"),
    }));
    const __VLS_418 = __VLS_417({
        modelValue: ((__VLS_ctx.balanceRemark)),
        placeholder: ("如：手动充值/活动赠送/补偿"),
    }, ...__VLS_functionalComponentArgsRest(__VLS_417));
    __VLS_415.slots.default;
    var __VLS_415;
    __VLS_397.slots.default;
    var __VLS_397;
    __VLS_elementAsFunction(__VLS_intrinsicElements.template, __VLS_intrinsicElements.template)({});
    {
        const { footer: __VLS_thisSlot } = __VLS_391.slots;
        const __VLS_422 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_423 = __VLS_asFunctionalComponent(__VLS_422, new __VLS_422({
            ...{ 'onClick': {} },
        }));
        const __VLS_424 = __VLS_423({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_423));
        let __VLS_428;
        const __VLS_429 = {
            onClick: (...[$event]) => {
                __VLS_ctx.balanceDialog = false;
            }
        };
        let __VLS_425;
        let __VLS_426;
        __VLS_427.slots.default;
        var __VLS_427;
        const __VLS_430 = {}.ElButton;
        /** @type { [typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ] } */ ;
        // @ts-ignore
        const __VLS_431 = __VLS_asFunctionalComponent(__VLS_430, new __VLS_430({
            ...{ 'onClick': {} },
            type: ("primary"),
            loading: ((__VLS_ctx.balanceSaving)),
        }));
        const __VLS_432 = __VLS_431({
            ...{ 'onClick': {} },
            type: ("primary"),
            loading: ((__VLS_ctx.balanceSaving)),
        }, ...__VLS_functionalComponentArgsRest(__VLS_431));
        let __VLS_436;
        const __VLS_437 = {
            onClick: (__VLS_ctx.saveBalance)
        };
        let __VLS_433;
        let __VLS_434;
        __VLS_435.slots.default;
        var __VLS_435;
    }
    var __VLS_391;
    ['logo', 'header', 'title', 'filters', 'title', 'title', 'title', 'title',];
    var __VLS_slots;
    var $slots;
    let __VLS_inheritedAttrs;
    var $attrs;
    const __VLS_refs = {};
    var $refs;
    var $el;
    return {
        attrs: {},
        slots: __VLS_slots,
        refs: $refs,
        rootEl: $el,
    };
}
;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            active: active,
            adminName: adminName,
            loginOpen: loginOpen,
            loginUsername: loginUsername,
            loginPassword: loginPassword,
            loginLoading: loginLoading,
            doLogin: doLogin,
            logout: logout,
            users: users,
            keyword: keyword,
            balanceDialog: balanceDialog,
            balanceTarget: balanceTarget,
            balanceAmount: balanceAmount,
            balanceRemark: balanceRemark,
            balanceSaving: balanceSaving,
            loadUsers: loadUsers,
            openBalance: openBalance,
            saveBalance: saveBalance,
            packages: packages,
            orders: orders,
            flows: flows,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
