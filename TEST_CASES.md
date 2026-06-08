# 原子性名额校验 - 测试用例文档

## 测试目标

验证草稿确认时的原子性名额校验逻辑，确保：
1. 确认草稿前重新读取当前场次最新数据
2. 校验草稿人数 ≤ capacity - bookedCount
3. 名额不足时阻止确认并提示用户
4. 确认失败时 bookedCount、草稿状态、预约记录保持不变
5. 确认成功时原子更新 bookedCount 和草稿状态

---

## 测试数据准备

| 场次ID | 展项 | 时间 | capacity | 初始 bookedCount | 初始剩余 |
|--------|------|------|----------|------------------|----------|
| session_004 | 星象厅 | 15:30 | 120 | 115 | 5 |
| session_008 | 太阳系漫游 | 10:30 | 6 | 3 | 3 |
| session_002 | 星象厅 | 11:00 | 120 | 78 | 42 |

---

## 测试用例清单

### TC-01: 草稿创建后其他用户占满名额，确认被拦截

**场景描述：用户创建草稿后，其他用户占用了所有剩余名额，用户确认时应被阻止**

**前置条件：**
- session_004 初始状态: capacity=120, bookedCount=115, remaining=5

**测试步骤：**
1. 创建草稿：phone=13800138000, peopleCount=5, sessionId=session_004
2. 模拟其他用户占用剩余 5 个名额 (updateBookedCount +5)
3. 调用 validateDraftCapacity(draftId) 预校验
4. 调用 submitAtomic(draftId) 提交确认

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| validateDraftCapacity.isValid | false |
| validateDraftCapacity.realtime.remaining | 0 |
| submitAtomic.success | false |
| submitAtomic.error | 'full' |
| session.bookedCount (提交后) | 120 (不变) |
| draft.status (提交后) | 'draft' (不变) |
| bookings 记录数量 | 不变 |

---

### TC-02: 草稿创建后剩余名额不足，确认被拦截

**场景描述：用户创建草稿后，其他用户占用部分名额，导致剩余名额 < 草稿人数**

**前置条件：**
- session_004 初始状态: capacity=120, bookedCount=115, remaining=5

**测试步骤：**
1. 创建草稿：phone=13800138001, peopleCount=5, sessionId=session_004
2. 模拟其他用户占用 4 个名额 (updateBookedCount +4)
3. 验证: remaining=1 < 5
4. 调用 validateDraftCapacity(draftId) 预校验
5. 调用 submitAtomic(draftId) 提交确认

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| validateDraftCapacity.isValid | false |
| validateDraftCapacity.hasChanged | true |
| submitAtomic.success | false |
| submitAtomic.error | 'insufficient' |
| session.bookedCount (提交后) | 119 (不变) |
| draft.status (提交后) | 'draft' (不变) |
| bookings 记录数量 | 不变 |

---

### TC-03: 名额充足时，原子更新成功

**场景描述：草稿创建后名额仍充足，确认时应成功并原子更新所有数据**

**前置条件：**
- session_002 初始状态: capacity=120, bookedCount=78, remaining=42

**测试步骤：**
1. 创建草稿：phone=13800138002, peopleCount=4, sessionId=session_002
2. 调用 validateDraftCapacity(draftId) 预校验
3. 记录提交前 bookedCount=78, bookingsCount=N
4. 调用 submitAtomic(draftId) 提交确认

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| validateDraftCapacity.isValid | true |
| submitAtomic.success | true |
| session.bookedCount (提交后) | 82 (78 + 4) |
| draft.status (提交后) | 'confirmed' |
| bookings 记录数量 | N + 1 |
| booking 内容正确性 | sessionId, phone, peopleCount 匹配 |

---

### TC-04: 并发提交时只有一个成功

**场景描述：两个草稿同时竞争有限名额，只有一个能成功**

**前置条件：**
- session_008 调整后: capacity=6, bookedCount=5, remaining=1

**测试步骤：**
1. 调用 forceSetBookedCount('session_008', 5)，确保 remaining=1
2. 创建草稿1: phone=13800138003, peopleCount=1
3. 创建草稿2: phone=13800138004, peopleCount=1
4. 记录提交前 bookedCount=5, bookingsCount=N
5. 调用 submitAtomic(draft1.id)
6. 调用 submitAtomic(draft2.id)

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| 成功提交数量 | 1 (两个中只有一个) |
| session.bookedCount (最终) | 6 (5 + 1) |
| 成功的草稿 status | 'confirmed' |
| 失败的草稿 status | 'draft' |
| bookings 记录数量 | N + 1 |

---

### TC-05: 编辑草稿时检测名额变化

**场景描述：草稿创建后名额变化，编辑时也应能检测并阻止确认**

**前置条件：**
- session_008 调整后: capacity=6, bookedCount=4, remaining=2

**测试步骤：**
1. 调用 forceSetBookedCount('session_008', 4)，remaining=2
2. 创建草稿：phone=13800138005, peopleCount=2
3. 模拟其他用户占用 1 个名额 (updateBookedCount +1)
4. 验证: remaining=1 < 2
5. 调用 validateDraftCapacity(draftId) 预校验
6. 调用 submitAtomic(draftId) 尝试提交

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| validateDraftCapacity.isValid | false |
| validateDraftCapacity.hasChanged | true |
| submitAtomic.success | false |
| submitAtomic.error | 'insufficient' |
| session.bookedCount (提交后) | 5 (不变) |
| draft.status (提交后) | 'draft' (不变) |
| bookings 记录数量 | 不变 |

---

### TC-06: 用户端确认草稿 - 名额不足时阻止

**场景描述：用户端 (BookingDraft.vue) 确认草稿流程，名额不足时阻止确认**

**前置条件：**
- session_004 初始状态: remaining=5

**测试步骤：**
1. 创建草稿：phone=13900000001, peopleCount=3
2. 模拟其他用户占用 3 个名额，剩余=5-3=2
3. 验证: remaining=2 < 3
4. 调用 validateDraftCapacity() (模拟 confirmDraft 预校验)
5. 调用 submitAtomic() (模拟 submitConfirm 提交)

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| validateDraftCapacity.isValid | false |
| submitAtomic.success | false |
| submitAtomic.error | 'insufficient' |
| bookedCount | 不变 |
| draft.status | 'draft' |
| bookings 数量 | 不变 |

---

### TC-07: 前台确认草稿 - 名额不足时阻止

**场景描述：前台 (ReceptionView.vue) 确认草稿流程，名额不足时阻止确认**

**前置条件：**
- session_004 初始状态: remaining=5

**测试步骤：**
1. 创建草稿：phone=13900000002, peopleCount=4
2. 模拟其他用户占用 4 个名额，剩余=5-4=1
3. 验证: remaining=1 < 4
4. 调用 validateDraftCapacity() (模拟 confirmBooking 预校验)
5. 调用 submitAtomic() (模拟前台提交)

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| validateDraftCapacity.isValid | false |
| submitAtomic.success | false |
| submitAtomic.error | 'insufficient' |
| bookedCount | 不变 |
| draft.status | 'draft' |
| bookings 数量 | 不变 |

---

### TC-08: 用户端确认草稿 - 场次已满员时阻止

**场景描述：用户端确认草稿时场次已满员，应被阻止**

**前置条件：**
- session_004 初始状态: remaining=5

**测试步骤：**
1. 创建草稿：phone=13900000003, peopleCount=2
2. 模拟其他用户占用所有剩余 5 个名额
3. 验证: session.status = 'full', remaining=0
4. 调用 validateDraftCapacity() 预校验
5. 调用 submitAtomic() 提交

**预期结果：**
| 检查项 | 预期值 |
|--------|--------|
| validateDraftCapacity.isValid | false |
| validateDraftCapacity.realtime.remaining | 0 |
| submitAtomic.success | false |
| submitAtomic.error | 'full' |
| bookedCount | 120 (不变) |
| session.status | 'full' (不变) |
| draft.status | 'draft' (不变) |
| bookings 数量 | 不变 |

---

## 测试执行方式

### 浏览器控制台执行
```javascript
// 运行所有测试
runRegressionTests()

// 运行快速测试
runQuickTest()
```

### 命令行执行 (Node.js)
```bash
cd /path/to/project
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

---

## 数据不变性验证规则

所有测试场景中，**提交失败时必须保证以下数据完全不变**：

1. **session.bookedCount** - 已预约人数不变
2. **session.status** - 场次状态不变 ('available' 或 'full')
3. **draft.status** - 草稿状态保持 'draft'
4. **bookings 记录数量** - 不新增预约记录
5. **草稿其他字段** - 所有草稿字段保持原样

---

## 原子性验证要点

1. **重新读取**：submitAtomic 内部必须重新调用 sessionsApi.getById() 获取最新数据，不得使用任何缓存
2. **校验顺序**：先校验名额，再更新数据
3. **失败回滚**：任何一步失败，已修改的数据必须回滚（实际上是先校验后更新，失败则不更新）
4. **事务性**：bookedCount 更新和 draft.status 更新必须在同一函数调用内完成

---

## 测试结果记录

| 测试用例 | 测试日期 | 执行结果 | 备注 |
|----------|----------|----------|------|
| TC-01 | | | |
| TC-02 | | | |
| TC-03 | | | |
| TC-04 | | | |
| TC-05 | | | |
| TC-06 | | | |
| TC-07 | | | |
| TC-08 | | | |

**测试执行人：** ________________

**测试审核人：** ________________
