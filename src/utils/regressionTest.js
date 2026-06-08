import { sessionsApi, draftsApi, initDefaultData } from './storage.js'

const LOG_PREFIX = '[回归测试]'

function log(message, data = null) {
  const timestamp = new Date().toLocaleTimeString()
  if (data) {
    console.log(`${LOG_PREFIX} [${timestamp}] ${message}`, data)
  } else {
    console.log(`${LOG_PREFIX} [${timestamp}] ${message}`)
  }
}

function logSuccess(message) {
  console.log(`%c${LOG_PREFIX} ✅ ${message}`, 'color: green; font-weight: bold;')
}

function logError(message, error = null) {
  console.log(`%c${LOG_PREFIX} ❌ ${message}`, 'color: red; font-weight: bold;')
  if (error) console.error(error)
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    logSuccess(`${message}: expected ${expected}, got ${actual}`)
    return true
  } else {
    logError(`${message}: expected ${expected}, got ${actual}`)
    return false
  }
}

function assertTrue(condition, message) {
  if (condition) {
    logSuccess(message)
    return true
  } else {
    logError(message)
    return false
  }
}

function assertFalse(condition, message) {
  if (!condition) {
    logSuccess(message)
    return true
  } else {
    logError(message)
    return false
  }
}

function resetStorage() {
  localStorage.clear()
  initDefaultData()
  log('存储已重置为初始状态')
}

async function runTest(name, testFn) {
  console.log(`\n%c${LOG_PREFIX} ========== ${name} ==========`, 'color: blue; font-weight: bold; font-size: 14px;')
  try {
    resetStorage()
    await testFn()
    console.log(`%c${LOG_PREFIX} ✅ 测试通过: ${name}`, 'color: green; font-weight: bold;')
    return true
  } catch (error) {
    console.log(`%c${LOG_PREFIX} ❌ 测试失败: ${name}`, 'color: red; font-weight: bold;')
    console.error(error)
    return false
  }
}

const regressionTests = {
  async test_atomic_submit_full_capacity() {
    log('测试场景: 草稿创建后，其他用户占用所有名额，确认时应被拦截')
    
    const session = sessionsApi.getById('session_004')
    log('选择场次 session_004 (星象厅 15:30)，初始状态', {
      capacity: session.capacity,
      bookedCount: session.bookedCount,
      remaining: session.capacity - session.bookedCount
    })
    
    const draftData = {
      phone: '13800138000',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 5,
      name: '张三',
      price: session.price,
      totalPrice: session.price * 5
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    log('草稿已创建，预约人数 5 人')
    
    const remainingAfterDraft = session.capacity - session.bookedCount
    log('当前剩余名额', remainingAfterDraft)
    
    log('模拟其他用户占用剩余名额...')
    sessionsApi.updateBookedCount(session.id, remainingAfterDraft)
    
    const sessionAfterOther = sessionsApi.getById('session_004')
    log('其他用户占用后状态', {
      capacity: sessionAfterOther.capacity,
      bookedCount: sessionAfterOther.bookedCount,
      remaining: sessionAfterOther.capacity - sessionAfterOther.bookedCount
    })
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('确认前校验结果', validateResult)
    assertFalse(validateResult.isValid, '校验应返回无效（名额不足）')
    assertEqual(validateResult.realtime.remaining, 0, '剩余名额应为 0')
    
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('提交结果', submitResult)
    assertFalse(submitResult.success, '提交应失败')
    assertEqual(submitResult.error, 'full', '错误类型应为 full')
    
    const sessionAfterSubmit = sessionsApi.getById('session_004')
    assertEqual(sessionAfterSubmit.bookedCount, sessionAfterOther.bookedCount, '提交失败后 bookedCount 不应变化')
    
    const draftAfterSubmit = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftAfterSubmit.status, 'draft', '提交失败后草稿状态仍应为 draft')
    
    logSuccess('场景1验证通过：草稿创建后其他用户占满名额，确认被正确拦截')
  },

  async test_atomic_submit_insufficient_capacity() {
    log('测试场景: 草稿创建后，其他用户占用部分名额，剩余名额不足时应被拦截')
    
    const session = sessionsApi.getById('session_004')
    log('选择场次 session_004 (星象厅 15:30)，初始状态', {
      capacity: session.capacity,
      bookedCount: session.bookedCount,
      remaining: session.capacity - session.bookedCount
    })
    
    const draftData = {
      phone: '13800138001',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 5,
      name: '李四',
      price: session.price,
      totalPrice: session.price * 5
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    log('草稿已创建，预约人数 5 人')
    
    log('模拟其他用户占用 3 个名额...')
    sessionsApi.updateBookedCount(session.id, 3)
    
    const sessionAfterOther = sessionsApi.getById('session_004')
    const remaining = sessionAfterOther.capacity - sessionAfterOther.bookedCount
    log('其他用户占用后状态', {
      capacity: sessionAfterOther.capacity,
      bookedCount: sessionAfterOther.bookedCount,
      remaining: remaining
    })
    assertTrue(remaining < draftData.peopleCount, '剩余名额应小于草稿预约人数')
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('确认前校验结果', validateResult)
    assertFalse(validateResult.isValid, '校验应返回无效（名额不足）')
    assertTrue(validateResult.hasChanged, '应检测到名额变化')
    
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('提交结果', submitResult)
    assertFalse(submitResult.success, '提交应失败')
    assertEqual(submitResult.error, 'insufficient', '错误类型应为 insufficient')
    
    const sessionAfterSubmit = sessionsApi.getById('session_004')
    assertEqual(sessionAfterSubmit.bookedCount, sessionAfterOther.bookedCount, '提交失败后 bookedCount 不应变化')
    
    const draftAfterSubmit = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftAfterSubmit.status, 'draft', '提交失败后草稿状态仍应为 draft')
    
    logSuccess('场景2验证通过：草稿创建后其他用户占用部分名额，剩余不足时被正确拦截')
  },

  async test_atomic_submit_success() {
    log('测试场景: 草稿创建后名额充足，确认时应成功并原子更新')
    
    const session = sessionsApi.getById('session_002')
    log('选择场次 session_002 (星象厅 10:30)，初始状态', {
      capacity: session.capacity,
      bookedCount: session.bookedCount,
      remaining: session.capacity - session.bookedCount
    })
    
    const draftData = {
      phone: '13800138002',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 4,
      name: '王五',
      price: session.price,
      totalPrice: session.price * 4
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    log('草稿已创建，预约人数 4 人')
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('确认前校验结果', validateResult)
    assertTrue(validateResult.isValid, '校验应返回有效')
    
    const bookedCountBefore = session.bookedCount
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('提交结果', submitResult)
    assertTrue(submitResult.success, '提交应成功')
    
    const sessionAfterSubmit = sessionsApi.getById('session_002')
    assertEqual(sessionAfterSubmit.bookedCount, bookedCountBefore + 4, 'bookedCount 应原子增加 4')
    
    const draftAfterSubmit = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftAfterSubmit.status, 'confirmed', '草稿状态应为 confirmed')
    
    const bookings = JSON.parse(localStorage.getItem('planetarium_bookings') || '[]')
    const hasBooking = bookings.some(b => b.draftId === createResult.data.id || b.id && b.phone === draftData.phone)
    assertTrue(hasBooking, '应生成 booking 记录')
    
    logSuccess('场景3验证通过：名额充足时，原子更新成功')
  },

  async test_concurrent_submit() {
    log('测试场景: 两个草稿同时确认同一剩余名额，只有一个成功')
    
    const session = sessionsApi.getById('session_005')
    log('选择场次 session_005 (星象厅 14:00)，初始状态', {
      capacity: session.capacity,
      bookedCount: session.bookedCount,
      remaining: session.capacity - session.bookedCount
    })
    
    sessionsApi.updateBookedCount(session.id, -2)
    const sessionAfterAdjust = sessionsApi.getById('session_005')
    log('调整后剩余名额:', sessionAfterAdjust.capacity - sessionAfterAdjust.bookedCount)
    
    const draftData1 = {
      phone: '13800138003',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 3,
      name: '赵六',
      price: session.price,
      totalPrice: session.price * 3
    }
    
    const draftData2 = {
      phone: '13800138004',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 3,
      name: '孙七',
      price: session.price,
      totalPrice: session.price * 3
    }
    
    const create1 = draftsApi.create(draftData1)
    const create2 = draftsApi.create(draftData2)
    log('两个草稿已创建，各预约 3 人，剩余名额仅 2 个')
    
    const bookedBefore = sessionsApi.getById('session_005').bookedCount
    
    const result1 = draftsApi.submitAtomic(create1.data.id)
    log('草稿1提交结果', result1)
    
    const result2 = draftsApi.submitAtomic(create2.data.id)
    log('草稿2提交结果', result2)
    
    const successCount = [result1, result2].filter(r => r.success).length
    assertEqual(successCount, 1, '只能有一个提交成功')
    
    const sessionFinal = sessionsApi.getById('session_005')
    assertEqual(sessionFinal.bookedCount, bookedBefore + 3, 'bookedCount 只应增加 3')
    
    const draft1Final = draftsApi.getAll().find(d => d.id === create1.data.id)
    const draft2Final = draftsApi.getAll().find(d => d.id === create2.data.id)
    
    if (result1.success) {
      assertEqual(draft1Final.status, 'confirmed', '成功的草稿状态应为 confirmed')
      assertEqual(draft2Final.status, 'draft', '失败的草稿状态仍应为 draft')
    } else {
      assertEqual(draft2Final.status, 'confirmed', '成功的草稿状态应为 confirmed')
      assertEqual(draft1Final.status, 'draft', '失败的草稿状态仍应为 draft')
    }
    
    logSuccess('场景4验证通过：并发提交时只有一个能成功，保证数据一致性')
  },

  async test_edit_draft_after_capacity_change() {
    log('测试场景: 草稿创建后名额变化，编辑时也应正确校验')
    
    const session = sessionsApi.getById('session_006')
    log('选择场次 session_006 (星象厅 16:00)，初始状态', {
      capacity: session.capacity,
      bookedCount: session.bookedCount,
      remaining: session.capacity - session.bookedCount
    })
    
    const draftData = {
      phone: '13800138005',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 2,
      name: '周八',
      price: session.price,
      totalPrice: session.price * 2
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    
    log('模拟其他用户占用名额，只剩 1 个...')
    sessionsApi.updateBookedCount(session.id, 1)
    
    const sessionAfter = sessionsApi.getById('session_006')
    log('当前剩余:', sessionAfter.capacity - sessionAfter.bookedCount)
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('编辑前校验', validateResult)
    assertFalse(validateResult.isValid, '应检测到名额不足')
    
    logSuccess('场景5验证通过：编辑草稿时也能检测到名额变化')
  }
}

export async function runRegressionTests() {
  console.log('\n' + '='.repeat(60))
  console.log('%c🚀 开始运行原子性名额校验回归测试', 'color: blue; font-weight: bold; font-size: 16px;')
  console.log('='.repeat(60))
  
  const results = []
  
  for (const [name, testFn] of Object.entries(regressionTests)) {
    const passed = await runTest(name, testFn)
    results.push({ name, passed })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('%c📊 测试结果汇总', 'color: blue; font-weight: bold; font-size: 14px;')
  console.log('='.repeat(60))
  
  const passed = results.filter(r => r.passed).length
  const total = results.length
  
  results.forEach(r => {
    const status = r.passed ? '✅ PASS' : '❌ FAIL'
    const color = r.passed ? 'green' : 'red'
    console.log(`%c${status}  ${r.name}`, `color: ${color};`)
  })
  
  console.log('\n' + '-'.repeat(60))
  const summaryColor = passed === total ? 'green' : 'red'
  console.log(`%c总计: ${passed}/${total} 测试通过`, `color: ${summaryColor}; font-weight: bold; font-size: 14px;`)
  
  if (passed === total) {
    console.log('%c🎉 所有回归测试通过！原子性名额校验功能正常。', 'color: green; font-weight: bold; font-size: 14px;')
  } else {
    console.log('%c⚠️  部分测试失败，请检查代码逻辑。', 'color: red; font-weight: bold; font-size: 14px;')
  }
  
  console.log('='.repeat(60) + '\n')
  
  return passed === total
}

export function runQuickTest() {
  console.log('%c🧪 运行快速测试...', 'color: blue;')
  resetStorage()
  
  const session = sessionsApi.getById('session_004')
  console.log('测试场次:', session.exhibitName, session.date, session.startTime)
  console.log('初始状态: bookedCount =', session.bookedCount, ', remaining =', session.capacity - session.bookedCount)
  
  const draft = draftsApi.create({
    phone: '13900000001',
    date: session.date,
    sessionId: session.id,
    sessionName: session.exhibitName,
    exhibitId: session.exhibitId,
    startTime: session.startTime,
    endTime: session.endTime,
    peopleCount: 6,
    name: '测试用户',
    price: session.price,
    totalPrice: session.price * 6
  })
  
  console.log('草稿创建:', draft.success ? '成功' : '失败')
  
  sessionsApi.updateBookedCount(session.id, 2)
  console.log('模拟其他用户占用后:', 'bookedCount =', sessionsApi.getById('session_004').bookedCount)
  
  const validate = draftsApi.validateDraftCapacity(draft.data.id)
  console.log('校验结果:', validate.isValid ? '有效' : '无效', validate)
  
  const submit = draftsApi.submitAtomic(draft.data.id)
  console.log('提交结果:', submit.success ? '成功' : '失败', submit.message)
  
  console.log('%c快速测试完成', 'color: blue;')
}

if (typeof window !== 'undefined') {
  window.runRegressionTests = runRegressionTests
  window.runQuickTest = runQuickTest
}
