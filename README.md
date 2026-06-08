# 天文馆展项预约导览系统

基于 Vue 3 + Vite + Element Plus 开发的天文馆展项预约导览前端应用。

## 功能特性

- 🎫 **展项预约**：浏览天文馆展项和场次，选择心仪的场次进行预约
- 📝 **草稿管理**：预约信息自动保存为草稿，支持编辑、确认和取消
- ✅ **原子性校验**：草稿确认时实时校验名额，确保数据一致性
- 👥 **导览清单**：多种导览路线推荐，适合不同人群
- 🕐 **时段维护**：后台时段管理功能
- 💾 **草稿恢复**：操作失败时自动保留输入，支持恢复继续填写

## 技术栈

- Vue 3 (Composition API)
- Vue Router 4
- Element Plus 2
- Vite 5
- LocalStorage 本地存储

## 启动方式

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── router/          # 路由配置
├── styles/          # 全局样式
├── utils/           # 工具函数和数据API
│   ├── storage.js   # 本地存储API
│   └── regressionTest.js  # 回归测试
├── views/           # 页面组件
│   ├── ExhibitsList.vue    # 展项列表
│   ├── SessionsList.vue    # 场次列表
│   ├── SessionDetail.vue   # 场次详情
│   ├── BookingDraft.vue    # 预约草稿管理
│   ├── GuideList.vue       # 导览清单
│   ├── TimeSlotManage.vue  # 时段维护
│   └── ReceptionView.vue   # 前台查看
├── App.vue          # 根组件
└── main.js          # 入口文件
```

## 新增场景说明

### 1. 草稿恢复能力

**场景描述**：用户在填写预约表单过程中，因各种原因（表单验证失败、名额不足、网络异常等）导致提交失败时，系统自动保留用户已输入的所有信息，用户无需重新填写。

**业务流程**：
1. 用户在「场次列表」或「场次详情」页面开始填写预约表单
2. 系统实时自动保存用户输入到本地临时存储（每一次字段变化都会触发保存）
3. 如果提交失败（表单验证不通过、名额不足、场次已满等）：
   - 系统弹出详细的错误原因提示
   - 所有已输入的信息被保留在表单中
   - 用户可以直接修改错误字段后重新提交
4. 如果用户关闭页面后重新打开：
   - 系统检测到未完成的表单输入
   - 弹出「恢复草稿」确认框
   - 用户选择「恢复输入」则自动填充所有字段
   - 用户选择「重新填写」则清空临时存储

**触发场景**：
- 表单验证失败（手机号格式错误、必填项为空等）
- 场次已满员
- 预约人数超过剩余名额
- 同一手机号当日已有草稿冲突
- 用户意外关闭页面后重新打开

---

### 2. 操作失败时保留输入并提示原因

**场景描述**：当预约操作失败时，系统不仅保留用户输入，还提供清晰、具体的失败原因和解决方案建议，帮助用户快速定位问题。

**错误类型及提示**：

| 错误类型 | 提示标题 | 详细说明 |
|---------|---------|---------|
| 场次已满员 | `场次已满员` | 「XXX」YYYY-MM-DD HH:MM 场次已无剩余名额，建议选择其他场次。已自动保存您的输入。 |
| 名额不足 | `名额不足` | 该场次仅剩 N 个名额，请调整预约人数或选择其他场次。已自动保存您的输入。 |
| 草稿冲突 | `存在冲突草稿` | 您在 YYYY-MM-DD 已有一个预约草稿，请先完成或取消该草稿后再预约。已自动保存您的输入。 |
| 场次无效 | `场次无效` | 该场次可能已被取消，请返回列表重新选择。已自动保存您的输入。 |
| 表单验证失败 | `警告` | 请完善表单信息后再提交，已自动保存您的输入。 |

**用户体验**：
- 所有错误提示均明确告知「已自动保存您的输入」，消除用户顾虑
- 针对不同错误类型提供具体的解决方案建议
- 表单数据保留，用户无需从头开始填写

---

### 3. 满员场次不可预约

**场景描述**：通过多层校验机制确保已满员的场次无法被预约，防止用户通过前端绕过限制。

**校验层级**：

#### 第一层：UI 层面限制
- 场次列表中满员场次的「立即预约」按钮自动禁用
- 场次详情页满员时「保存预约草稿」按钮自动禁用
- 人数选择器自动禁用
- 所有输入框自动禁用

#### 第二层：前端逻辑校验
- 点击预约按钮时，先检查场次状态是否为 `full`
- 如果已满员，立即弹出警告并终止流程
- 同时自动保存用户输入，方便用户切换场次

#### 第三层：API 层面校验（核心防护）
`draftsApi.create()` 方法在创建草稿前执行以下校验：
```javascript
// 1. 检查场次是否存在
const session = sessionsApi.getById(draftData.sessionId)
if (!session) {
  return { success: false, message: '场次不存在或已取消', error: 'invalid_session' }
}

// 2. 检查场次是否已满员（关键防护）
if (sessionsApi.isFull(draftData.sessionId)) {
  return {
    success: false,
    message: `场次「${session.exhibitName}」${session.date} ${session.startTime} 已满员，无法预约`,
    error: 'full',
    session
  }
}

// 3. 校验预约人数是否超过剩余名额
const capacityValidation = sessionsApi.validateCapacity(draftData.sessionId, draftData.peopleCount)
if (!capacityValidation.success) {
  return {
    success: false,
    message: capacityValidation.message,
    error: capacityValidation.error,
    session,
    capacity: capacityValidation.capacity
  }
}
```

**无法绕过的原因**：
- 即使前端禁用状态被绕过（如通过浏览器开发者工具修改）
- API 层面的校验仍然会拦截满员场次的预约请求
- 校验逻辑在 `draftsApi.create()` 内部，是创建草稿的必经之路
- 返回明确的错误码 `error: 'full'`，前端据此展示友好提示

---

## 数据存储说明

所有数据存储在浏览器 LocalStorage 中：

| 存储键 | 说明 |
|--------|------|
| `planetarium_exhibits` | 展项数据 |
| `planetarium_sessions` | 场次数据 |
| `planetarium_time_slots` | 时段数据 |
| `planetarium_drafts` | 预约草稿 |
| `planetarium_guide_lists` | 导览清单 |
| `planetarium_bookings` | 已确认预约 |
| `planetarium_temp_form` | 临时表单数据（新增） |
| `planetarium_verified_phone` | 已验证手机号 |

## 测试

项目包含回归测试用例，验证原子性名额校验逻辑：

```bash
# 浏览器控制台执行
runRegressionTests()

# 命令行执行
node -e "
import('./src/utils/regressionTest.js').then(m => {
  m.runQuickTest()
  return m.runRegressionTests()
}).then(result => {
  console.log('整体测试结果:', result.allPassed ? 'PASS' : 'FAIL')
  process.exit(result.allPassed ? 0 : 1)
})
" --input-type=module
```

详细测试用例请参考 [TEST_CASES.md](./TEST_CASES.md)。
