import { sessionsApi, draftsApi, bookingsApi, initDefaultData, STORAGE_KEYS, storage } from './storage.js'

const LOG_PREFIX = '[回归测试]'

function throwAssertionError(message) {
  const error = new Error(message)
  error.name = 'AssertionError'
  throw error
}

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
    const errorMsg = `${message}: expected ${expected}, got ${actual}`
    logError(errorMsg)
    throwAssertionError(errorMsg)
  }
}

function assertTrue(condition, message) {
  if (condition) {
    logSuccess(message)
    return true
  } else {
    logError(message)
    throwAssertionError(message)
  }
}

function assertFalse(condition, message) {
  if (!condition) {
    logSuccess(message)
    return true
  } else {
    logError(message)
    throwAssertionError(message)
  }
}

function resetStorage() {
  localStorage.clear()
  initDefaultData()
  log('存储已重置为初始状态')
}

function getBookingsCount() {
  return bookingsApi.getAll().length
}

async function runTest(name, testFn) {
  console.log(`\n%c${LOG_PREFIX} ========== ${name} ==========`, 'color: blue; font-weight: bold; font-size: 14px;')
  try {
    resetStorage()
    await testFn()
    console.log(`%c${LOG_PREFIX} ✅ 测试通过: ${name}`, 'color: green; font-weight: bold;')
    return { name, passed: true, error: null }
  } catch (error) {
    console.log(`%c${LOG_PREFIX} ❌ 测试失败: ${name}`, 'color: red; font-weight: bold;')
    console.error(error)
    return { name, passed: false, error: error.message || String(error) }
  }
}

function forceSetBookedCount(sessionId, targetBookedCount) {
  const sessions = sessionsApi.getAll()
  const session = sessions.find(s => s.id === sessionId)
  if (session) {
    session.bookedCount = Math.max(0, Math.min(session.capacity, targetBookedCount))
    session.status = session.bookedCount >= session.capacity ? 'full' : 'available'
    storage.set(STORAGE_KEYS.SESSIONS, sessions)
  }
  return sessionsApi.getById(sessionId)
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
    log('草稿已创建，预约人数 5 人，当前剩余名额', session.capacity - session.bookedCount)
    
    const bookedBeforeSubmit = session.bookedCount
    const bookingsBefore = getBookingsCount()
    const remainingAfterDraft = session.capacity - session.bookedCount
    
    log('模拟其他用户占用剩余名额...')
    sessionsApi.updateBookedCount(session.id, remainingAfterDraft)
    
    const sessionAfterOther = sessionsApi.getById('session_004')
    log('其他用户占用后状态', {
      capacity: sessionAfterOther.capacity,
      bookedCount: sessionAfterOther.bookedCount,
      remaining: sessionAfterOther.capacity - sessionAfterOther.bookedCount
    })
    assertEqual(sessionAfterOther.bookedCount, sessionAfterOther.capacity, '其他用户占用后应为满员')
    
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
    
    assertEqual(getBookingsCount(), bookingsBefore, '提交失败后不应生成 booking 记录')
    
    logSuccess('场景1验证通过：草稿创建后其他用户占满名额，确认被正确拦截，所有数据保持不变')
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
    
    const bookedBeforeSubmit = session.bookedCount
    const bookingsBefore = getBookingsCount()
    
    log('模拟其他用户占用 4 个名额...')
    sessionsApi.updateBookedCount(session.id, 4)
    
    const sessionAfterOther = sessionsApi.getById('session_004')
    const remaining = sessionAfterOther.capacity - sessionAfterOther.bookedCount
    log('其他用户占用后状态', {
      capacity: sessionAfterOther.capacity,
      bookedCount: sessionAfterOther.bookedCount,
      remaining: remaining
    })
    assertTrue(remaining < draftData.peopleCount, `剩余名额 ${remaining} 应小于草稿预约人数 ${draftData.peopleCount}`)
    
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
    
    assertEqual(getBookingsCount(), bookingsBefore, '提交失败后不应生成 booking 记录')
    
    logSuccess('场景2验证通过：草稿创建后其他用户占用部分名额，剩余不足时被正确拦截，所有数据保持不变')
  },

  async test_atomic_submit_success() {
    log('测试场景: 草稿创建后名额充足，确认时应成功并原子更新')
    
    const session = sessionsApi.getById('session_002')
    log('选择场次 session_002 (星象厅 11:00)，初始状态', {
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
    const bookingsBefore = getBookingsCount()
    
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('提交结果', submitResult)
    assertTrue(submitResult.success, '提交应成功')
    
    const sessionAfterSubmit = sessionsApi.getById('session_002')
    assertEqual(sessionAfterSubmit.bookedCount, bookedCountBefore + 4, 'bookedCount 应原子增加 4')
    
    const draftAfterSubmit = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftAfterSubmit.status, 'confirmed', '草稿状态应为 confirmed')
    
    assertEqual(getBookingsCount(), bookingsBefore + 1, '应生成 1 条 booking 记录')
    
    const bookings = bookingsApi.getAll()
    const hasBooking = bookings.some(b => b.sessionId === draftData.sessionId && b.phone === draftData.phone && b.peopleCount === draftData.peopleCount)
    assertTrue(hasBooking, 'booking 记录内容应正确')
    
    logSuccess('场景3验证通过：名额充足时，原子更新成功，数据一致性')
  },

  async test_concurrent_submit() {
    log('测试场景: 两个草稿竞争剩余名额不足，只有一个能成功')
    
    const session = sessionsApi.getById('session_008')
    log('选择场次 session_008 (太阳系漫游 10:30)，初始状态', {
      capacity: session.capacity,
      bookedCount: session.bookedCount,
      remaining: session.capacity - session.bookedCount
    })
    
    const adjustedSession = forceSetBookedCount('session_008', 5)
    log('调整 bookedCount 到 5，剩余名额:', adjustedSession.capacity - adjustedSession.bookedCount)
    assertEqual(adjustedSession.capacity - adjustedSession.bookedCount, 1, '调整后剩余名额应为 1')
    
    const draftData1 = {
      phone: '13800138003',
      date: adjustedSession.date,
      sessionId: adjustedSession.id,
      sessionName: adjustedSession.exhibitName,
      exhibitId: adjustedSession.exhibitId,
      startTime: adjustedSession.startTime,
      endTime: adjustedSession.endTime,
      peopleCount: 1,
      name: '赵六',
      price: adjustedSession.price,
      totalPrice: adjustedSession.price * 1
    }
    
    const draftData2 = {
      phone: '13800138004',
      date: adjustedSession.date,
      sessionId: adjustedSession.id,
      sessionName: adjustedSession.exhibitName,
      exhibitId: adjustedSession.exhibitId,
      startTime: adjustedSession.startTime,
      endTime: adjustedSession.endTime,
      peopleCount: 1,
      name: '孙七',
      price: adjustedSession.price,
      totalPrice: adjustedSession.price * 1
    }
    
    const create1 = draftsApi.create(draftData1)
    const create2 = draftsApi.create(draftData2)
    assertTrue(create1.success && create2.success, '两个草稿创建成功')
    log('两个草稿已创建，各预约 1 人，剩余名额仅 1 个')
    
    const bookedBefore = sessionsApi.getById('session_008').bookedCount
    const bookingsBefore = getBookingsCount()
    
    const result1 = draftsApi.submitAtomic(create1.data.id)
    log('草稿1提交结果', result1)
    
    const result2 = draftsApi.submitAtomic(create2.data.id)
    log('草稿2提交结果', result2)
    
    const successCount = [result1, result2].filter(r => r.success).length
    assertEqual(successCount, 1, '只能有一个提交成功')
    
    const sessionFinal = sessionsApi.getById('session_008')
    assertEqual(sessionFinal.bookedCount, bookedBefore + 1, 'bookedCount 只应增加 1')
    
    const draft1Final = draftsApi.getAll().find(d => d.id === create1.data.id)
    const draft2Final = draftsApi.getAll().find(d => d.id === create2.data.id)
    
    if (result1.success) {
      assertEqual(draft1Final.status, 'confirmed', '成功的草稿状态应为 confirmed')
      assertEqual(draft2Final.status, 'draft', '失败的草稿状态仍应为 draft')
    } else {
      assertEqual(draft2Final.status, 'confirmed', '成功的草稿状态应为 confirmed')
      assertEqual(draft1Final.status, 'draft', '失败的草稿状态仍应为 draft')
    }
    
    assertEqual(getBookingsCount(), bookingsBefore + 1, '只应生成 1 条 booking 记录')
    
    logSuccess('场景4验证通过：并发提交时只有一个能成功，保证数据一致性')
  },

  async test_edit_draft_after_capacity_change() {
    log('测试场景: 草稿创建后名额变化，编辑时也应正确校验')
    
    const session = sessionsApi.getById('session_008')
    log('选择场次 session_008 (太阳系漫游 10:30)，初始状态', {
      capacity: session.capacity,
      bookedCount: session.bookedCount,
      remaining: session.capacity - session.bookedCount
    })
    
    const adjustedSession = forceSetBookedCount('session_008', 4)
    log('调整 bookedCount 到 4，剩余名额:', adjustedSession.capacity - adjustedSession.bookedCount)
    
    const draftData = {
      phone: '13800138005',
      date: adjustedSession.date,
      sessionId: adjustedSession.id,
      sessionName: adjustedSession.exhibitName,
      exhibitId: adjustedSession.exhibitId,
      startTime: adjustedSession.startTime,
      endTime: adjustedSession.endTime,
      peopleCount: 2,
      name: '周八',
      price: adjustedSession.price,
      totalPrice: adjustedSession.price * 2
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    log('草稿创建成功，预约 2 人，剩余 2 个名额')
    
    const bookedBefore = adjustedSession.bookedCount
    const bookingsBefore = getBookingsCount()
    
    log('模拟其他用户占用 1 个名额...')
    sessionsApi.updateBookedCount(adjustedSession.id, 1)
    
    const sessionAfter = sessionsApi.getById('session_008')
    const remainingAfter = sessionAfter.capacity - sessionAfter.bookedCount
    log('当前剩余:', remainingAfter)
    assertTrue(remainingAfter < draftData.peopleCount, `剩余名额 ${remainingAfter} 应小于草稿人数 ${draftData.peopleCount}`)
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('编辑前校验', validateResult)
    assertFalse(validateResult.isValid, '应检测到名额不足')
    assertTrue(validateResult.hasChanged, '应检测到名额变化')
    
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('提交结果', submitResult)
    assertFalse(submitResult.success, '提交应失败')
    assertEqual(submitResult.error, 'insufficient', '错误类型应为 insufficient')
    
    const sessionFinal = sessionsApi.getById('session_008')
    assertEqual(sessionFinal.bookedCount, sessionAfter.bookedCount, '提交失败后 bookedCount 不应变化')
    
    const draftFinal = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftFinal.status, 'draft', '提交失败后草稿状态仍应为 draft')
    
    assertEqual(getBookingsCount(), bookingsBefore, '提交失败后不应生成 booking 记录')
    
    logSuccess('场景5验证通过：编辑草稿时也能正确检测名额变化并阻止确认')
  },

  async test_user_confirm_draft_insufficient() {
    log('测试场景: 用户端确认草稿 - 名额不足时阻止确认')
    
    const session = sessionsApi.getById('session_004')
    log('选择场次 session_004，初始剩余:', session.capacity - session.bookedCount)
    
    const draftData = {
      phone: '13900000001',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 3,
      name: '用户测试',
      price: session.price,
      totalPrice: session.price * 3
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    
    const bookedBefore = session.bookedCount
    const bookingsBefore = getBookingsCount()
    
    log('模拟其他用户占用 3 个名额，剩余 5-3=2 个')
    sessionsApi.updateBookedCount(session.id, 3)
    
    const sessionAfter = sessionsApi.getById('session_004')
    const remaining = sessionAfter.capacity - sessionAfter.bookedCount
    log('剩余名额:', remaining)
    assertEqual(remaining, 2, '剩余名额应为 2')
    assertTrue(remaining < draftData.peopleCount, '剩余名额应小于草稿人数')
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('用户端 confirmDraft 预校验', validateResult)
    assertFalse(validateResult.isValid, '用户端点击确认时预校验应失败')
    
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('用户端 submitConfirm 提交结果', submitResult)
    assertFalse(submitResult.success, '用户端提交应失败')
    assertEqual(submitResult.error, 'insufficient', '错误类型应为 insufficient')
    
    const sessionFinal = sessionsApi.getById('session_004')
    assertEqual(sessionFinal.bookedCount, sessionAfter.bookedCount, 'bookedCount 保持不变')
    
    const draftFinal = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftFinal.status, 'draft', '草稿状态保持 draft')
    
    assertEqual(getBookingsCount(), bookingsBefore, 'booking 记录数量不变')
    
    logSuccess('场景6验证通过：用户端确认草稿 - 名额不足时正确阻止，所有数据保持不变')
  },

  async test_reception_confirm_draft_insufficient() {
    log('测试场景: 前台确认草稿 - 名额不足时阻止确认')
    
    const session = sessionsApi.getById('session_004')
    log('选择场次 session_004，初始剩余:', session.capacity - session.bookedCount)
    
    const draftData = {
      phone: '13900000002',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 4,
      name: '前台测试',
      price: session.price,
      totalPrice: session.price * 4
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    
    const bookedBefore = session.bookedCount
    const bookingsBefore = getBookingsCount()
    
    log('模拟其他用户占用 4 个名额，剩余 5-4=1 个')
    sessionsApi.updateBookedCount(session.id, 4)
    
    const sessionAfter = sessionsApi.getById('session_004')
    const remaining = sessionAfter.capacity - sessionAfter.bookedCount
    log('剩余名额:', remaining)
    assertEqual(remaining, 1, '剩余名额应为 1')
    assertTrue(remaining < draftData.peopleCount, '剩余名额应小于草稿人数')
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('前台 confirmBooking 预校验', validateResult)
    assertFalse(validateResult.isValid, '前台确认时预校验应失败')
    
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('前台提交结果', submitResult)
    assertFalse(submitResult.success, '前台提交应失败')
    assertEqual(submitResult.error, 'insufficient', '错误类型应为 insufficient')
    
    const sessionFinal = sessionsApi.getById('session_004')
    assertEqual(sessionFinal.bookedCount, sessionAfter.bookedCount, 'bookedCount 保持不变')
    
    const draftFinal = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftFinal.status, 'draft', '草稿状态保持 draft')
    
    assertEqual(getBookingsCount(), bookingsBefore, 'booking 记录数量不变')
    
    logSuccess('场景7验证通过：前台确认草稿 - 名额不足时正确阻止，所有数据保持不变')
  },

  async test_user_confirm_draft_full() {
    log('测试场景: 用户端确认草稿 - 场次已满员时阻止确认')
    
    const session = sessionsApi.getById('session_004')
    log('选择场次 session_004，初始剩余:', session.capacity - session.bookedCount)
    
    const draftData = {
      phone: '13900000003',
      date: session.date,
      sessionId: session.id,
      sessionName: session.exhibitName,
      exhibitId: session.exhibitId,
      startTime: session.startTime,
      endTime: session.endTime,
      peopleCount: 2,
      name: '满员测试',
      price: session.price,
      totalPrice: session.price * 2
    }
    
    const createResult = draftsApi.create(draftData)
    assertTrue(createResult.success, '草稿创建成功')
    
    const bookingsBefore = getBookingsCount()
    
    log('模拟其他用户占用所有剩余名额...')
    const remaining = session.capacity - session.bookedCount
    sessionsApi.updateBookedCount(session.id, remaining)
    
    const sessionAfter = sessionsApi.getById('session_004')
    assertEqual(sessionAfter.status, 'full', '场次应为满员状态')
    
    const validateResult = draftsApi.validateDraftCapacity(createResult.data.id)
    log('用户端预校验', validateResult)
    assertFalse(validateResult.isValid, '预校验应失败')
    assertEqual(validateResult.realtime.remaining, 0, '剩余名额应为 0')
    
    const submitResult = draftsApi.submitAtomic(createResult.data.id)
    log('提交结果', submitResult)
    assertFalse(submitResult.success, '提交应失败')
    assertEqual(submitResult.error, 'full', '错误类型应为 full')
    
    const sessionFinal = sessionsApi.getById('session_004')
    assertEqual(sessionFinal.bookedCount, sessionAfter.bookedCount, 'bookedCount 保持不变')
    assertEqual(sessionFinal.status, 'full', '场次仍为满员状态')
    
    const draftFinal = draftsApi.getAll().find(d => d.id === createResult.data.id)
    assertEqual(draftFinal.status, 'draft', '草稿状态保持 draft')
    
    assertEqual(getBookingsCount(), bookingsBefore, 'booking 记录数量不变')
    
    logSuccess('场景8验证通过：用户端确认草稿 - 场次已满员时正确阻止')
  }
}

export async function runRegressionTests() {
  console.log('\n' + '='.repeat(60))
  console.log('%c🚀 开始运行原子性名额校验回归测试', 'color: blue; font-weight: bold; font-size: 16px;')
  console.log('='.repeat(60))
  
  const results = []
  
  for (const [name, testFn] of Object.entries(regressionTests)) {
    const result = await runTest(name, testFn)
    results.push(result)
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
    if (r.error) {
      console.log(`   错误: ${r.error}`)
    }
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
  
  return {
    allPassed: passed === total,
    passed,
    total,
    results
  }
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

