const STORAGE_KEYS = {
  EXHIBITS: 'planetarium_exhibits',
  SESSIONS: 'planetarium_sessions',
  TIME_SLOTS: 'planetarium_time_slots',
  DRAFTS: 'planetarium_drafts',
  GUIDE_LISTS: 'planetarium_guide_lists',
  BOOKINGS: 'planetarium_bookings',
  TEMP_FORM: 'planetarium_temp_form'
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const getTodayStr = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const validatePhone = (phone) => {
  return /^1[3-9]\d{9}$/.test(phone)
}

const storage = {
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : defaultValue
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (e) {
      console.error('Storage set error:', e)
      return false
    }
  },
  remove(key) {
    localStorage.removeItem(key)
  }
}

const initDefaultData = () => {
  if (!storage.get(STORAGE_KEYS.EXHIBITS)) {
    storage.set(STORAGE_KEYS.EXHIBITS, [
      {
        id: 'exhibit_001',
        name: '宇宙演化剧场',
        type: '互动展项',
        description: '通过沉浸式球幕投影，体验从宇宙大爆炸到星系形成的壮丽历程，适合亲子共同观看。',
        duration: 25,
        capacity: 40,
        location: 'A馆一层',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=planetarium%20cosmic%20evolution%20theater%20dome%20projection%20stars%20galaxy%20immersive%20experience&image_size=landscape_16_9',
        tags: ['球幕', '科普', '亲子'],
        recommended: true
      },
      {
        id: 'exhibit_002',
        name: '太阳系漫游',
        type: 'VR体验',
        description: '佩戴VR设备，近距离观察八大行星的地貌特征，亲手触摸土星环，感受宇宙的神奇。',
        duration: 15,
        capacity: 6,
        location: 'A馆二层',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20system%20VR%20experience%20planets%20saturn%20rings%20space%20exploration&image_size=landscape_16_9',
        tags: ['VR', '互动', '教育'],
        recommended: true
      },
      {
        id: 'exhibit_003',
        name: '星象厅',
        type: '天象表演',
        description: '专业天象仪投射出真实夜空，讲解员带领认识星座、行星运行规律，聆听神话故事。',
        duration: 45,
        capacity: 120,
        location: 'B馆天象厅',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=planetarium%20star%20hall%20dome%20theater%20constellation%20projector%20night%20sky&image_size=landscape_16_9',
        tags: ['星象', '讲解', '经典'],
        recommended: true
      },
      {
        id: 'exhibit_004',
        name: '天文望远镜观测',
        type: '观测体验',
        description: '使用专业天文望远镜观测太阳黑子、月球环形山（夜间开放），天文爱好者必体验。',
        duration: 20,
        capacity: 10,
        location: 'C馆天文台',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=astronomical%20telescope%20observatory%20dome%20stargazing%20moon%20planets&image_size=landscape_16_9',
        tags: ['观测', '专业', '科普'],
        recommended: false
      },
      {
        id: 'exhibit_005',
        name: '太空失重模拟',
        type: '互动体验',
        description: '通过特殊装置模拟太空失重环境，体验宇航员在太空中的生活和工作状态。',
        duration: 10,
        capacity: 4,
        location: 'A馆三层',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=space%20zero%20gravity%20simulation%20astronaut%20training%20floating%20experience&image_size=landscape_16_9',
        tags: ['互动', '体验', '亲子'],
        recommended: false
      },
      {
        id: 'exhibit_006',
        name: '陨石探秘',
        type: '实物展览',
        description: '近距离观察来自火星、月球的真实陨石标本，了解陨石的形成和分类知识。',
        duration: 15,
        capacity: 30,
        location: 'B馆一层',
        image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=meteorite%20exhibition%20space%20rock%20specimens%20museum%20display%20astronomy&image_size=landscape_16_9',
        tags: ['实物', '科普', '展览'],
        recommended: false
      }
    ])
  }

  if (!storage.get(STORAGE_KEYS.SESSIONS)) {
    const today = getTodayStr()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    storage.set(STORAGE_KEYS.SESSIONS, [
      {
        id: 'session_001',
        exhibitId: 'exhibit_003',
        exhibitName: '星象厅',
        date: today,
        startTime: '09:30',
        endTime: '10:15',
        capacity: 120,
        bookedCount: 120,
        guideName: '张老师',
        price: 60,
        status: 'full',
        description: '秋季星座专场 - 认识仙后座、猎户座等冬季星座'
      },
      {
        id: 'session_002',
        exhibitId: 'exhibit_003',
        exhibitName: '星象厅',
        date: today,
        startTime: '11:00',
        endTime: '11:45',
        capacity: 120,
        bookedCount: 78,
        guideName: '李老师',
        price: 60,
        status: 'available',
        description: '太阳系行星运动专场 - 观测木星、土星位置'
      },
      {
        id: 'session_003',
        exhibitId: 'exhibit_003',
        exhibitName: '星象厅',
        date: today,
        startTime: '14:00',
        endTime: '14:45',
        capacity: 120,
        bookedCount: 45,
        guideName: '王老师',
        price: 60,
        status: 'available',
        description: '银河探秘专场 - 了解银河系结构和恒星演化'
      },
      {
        id: 'session_004',
        exhibitId: 'exhibit_003',
        exhibitName: '星象厅',
        date: today,
        startTime: '15:30',
        endTime: '16:15',
        capacity: 120,
        bookedCount: 115,
        guideName: '张老师',
        price: 60,
        status: 'available',
        description: '儿童天文启蒙专场 - 用故事讲述星星的奥秘'
      },
      {
        id: 'session_005',
        exhibitId: 'exhibit_003',
        exhibitName: '星象厅',
        date: tomorrowStr,
        startTime: '09:30',
        endTime: '10:15',
        capacity: 120,
        bookedCount: 23,
        guideName: '李老师',
        price: 60,
        status: 'available',
        description: '深空天体专场 - 认识星云、星团和星系'
      },
      {
        id: 'session_006',
        exhibitId: 'exhibit_001',
        exhibitName: '宇宙演化剧场',
        date: today,
        startTime: '10:00',
        endTime: '10:25',
        capacity: 40,
        bookedCount: 28,
        guideName: '刘老师',
        price: 40,
        status: 'available',
        description: '宇宙大爆炸专题'
      },
      {
        id: 'session_007',
        exhibitId: 'exhibit_002',
        exhibitName: '太阳系漫游',
        date: today,
        startTime: '09:00',
        endTime: '09:15',
        capacity: 6,
        bookedCount: 6,
        guideName: '陈老师',
        price: 50,
        status: 'full',
        description: 'VR沉浸式体验'
      },
      {
        id: 'session_008',
        exhibitId: 'exhibit_002',
        exhibitName: '太阳系漫游',
        date: today,
        startTime: '10:30',
        endTime: '10:45',
        capacity: 6,
        bookedCount: 3,
        guideName: '陈老师',
        price: 50,
        status: 'available',
        description: 'VR沉浸式体验'
      }
    ])
  }

  if (!storage.get(STORAGE_KEYS.TIME_SLOTS)) {
    storage.set(STORAGE_KEYS.TIME_SLOTS, [
      { id: 'slot_001', time: '09:00-09:45', type: 'morning', status: 'active' },
      { id: 'slot_002', time: '10:00-10:45', type: 'morning', status: 'active' },
      { id: 'slot_003', time: '11:00-11:45', type: 'morning', status: 'active' },
      { id: 'slot_004', time: '13:30-14:15', type: 'afternoon', status: 'active' },
      { id: 'slot_005', time: '14:30-15:15', type: 'afternoon', status: 'active' },
      { id: 'slot_006', time: '15:30-16:15', type: 'afternoon', status: 'active' },
      { id: 'slot_007', time: '16:30-17:15', type: 'afternoon', status: 'inactive' }
    ])
  }

  if (!storage.get(STORAGE_KEYS.DRAFTS)) {
    storage.set(STORAGE_KEYS.DRAFTS, [])
  }

  if (!storage.get(STORAGE_KEYS.BOOKINGS)) {
    storage.set(STORAGE_KEYS.BOOKINGS, [])
  }

  if (!storage.get(STORAGE_KEYS.GUIDE_LISTS)) {
    storage.set(STORAGE_KEYS.GUIDE_LISTS, [
      {
        id: 'guide_001',
        name: '亲子科普半日游',
        description: '适合4-12岁儿童，精选3个互动展项，寓教于乐',
        exhibits: ['exhibit_001', 'exhibit_002', 'exhibit_006'],
        duration: 120,
        difficulty: 'easy',
        audience: '亲子家庭',
        recommended: true
      },
      {
        id: 'guide_002',
        name: '天文爱好者深度游',
        description: '专业讲解星象观测，配合望远镜实际操作',
        exhibits: ['exhibit_003', 'exhibit_004', 'exhibit_006'],
        duration: 180,
        difficulty: 'hard',
        audience: '天文爱好者',
        recommended: true
      },
      {
        id: 'guide_003',
        name: '经典展项全览',
        description: '覆盖所有6个展项，全面了解天文知识',
        exhibits: ['exhibit_001', 'exhibit_002', 'exhibit_003', 'exhibit_004', 'exhibit_005', 'exhibit_006'],
        duration: 240,
        difficulty: 'medium',
        audience: '普通游客',
        recommended: false
      }
    ])
  }
}

const exhibitsApi = {
  getAll() {
    return storage.get(STORAGE_KEYS.EXHIBITS, [])
  },
  getById(id) {
    return this.getAll().find(e => e.id === id)
  }
}

const sessionsApi = {
  getAll() {
    return storage.get(STORAGE_KEYS.SESSIONS, [])
  },
  getById(id) {
    return this.getAll().find(s => s.id === id)
  },
  getByExhibitId(exhibitId) {
    return this.getAll().filter(s => s.exhibitId === exhibitId)
  },
  getByDate(date) {
    return this.getAll().filter(s => s.date === date)
  },
  getRemainingCapacity(sessionId) {
    const session = this.getById(sessionId)
    if (!session) return { available: false, remaining: 0, capacity: 0, bookedCount: 0 }
    return {
      available: session.bookedCount < session.capacity,
      remaining: session.capacity - session.bookedCount,
      capacity: session.capacity,
      bookedCount: session.bookedCount
    }
  },
  validateCapacity(sessionId, peopleCount) {
    const capacity = this.getRemainingCapacity(sessionId)
    if (!capacity.available && capacity.remaining === 0) {
      return {
        success: false,
        error: 'full',
        message: '该场次已满员',
        capacity
      }
    }
    if (peopleCount > capacity.remaining) {
      return {
        success: false,
        error: 'insufficient',
        message: `名额不足，剩余${capacity.remaining}个名额，您选择了${peopleCount}人`,
        capacity
      }
    }
    return { success: true, capacity }
  },
  updateBookedCount(sessionId, count) {
    const sessions = this.getAll()
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      session.bookedCount = Math.max(0, Math.min(session.capacity, session.bookedCount + count))
      session.status = session.bookedCount >= session.capacity ? 'full' : 'available'
      storage.set(STORAGE_KEYS.SESSIONS, sessions)
    }
    return session
  },
  isFull(sessionId) {
    const session = this.getById(sessionId)
    return session ? session.bookedCount >= session.capacity : false
  }
}

const draftsApi = {
  getAll() {
    return storage.get(STORAGE_KEYS.DRAFTS, [])
  },
  getByPhoneAndDate(phone, date) {
    return this.getAll().find(d => d.phone === phone && d.date === date && d.status === 'draft')
  },
  create(draftData) {
    const session = sessionsApi.getById(draftData.sessionId)
    if (!session) {
      return { success: false, message: '场次不存在或已取消', error: 'invalid_session' }
    }

    if (sessionsApi.isFull(draftData.sessionId)) {
      return {
        success: false,
        message: `场次「${session.exhibitName}」${session.date} ${session.startTime} 已满员，无法预约`,
        error: 'full',
        session
      }
    }

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

    const existing = this.getByPhoneAndDate(draftData.phone, draftData.date)
    if (existing) {
      return {
        success: false,
        message: '该手机号当日已有预约草稿，请先完成或取消现有预约',
        error: 'conflict',
        existingDraft: existing
      }
    }

    const draft = {
      id: generateId(),
      ...draftData,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const drafts = this.getAll()
    drafts.push(draft)
    storage.set(STORAGE_KEYS.DRAFTS, drafts)
    return { success: true, data: draft }
  },
  update(id, updates) {
    const drafts = this.getAll()
    const index = drafts.findIndex(d => d.id === id)
    if (index !== -1) {
      drafts[index] = { ...drafts[index], ...updates, updatedAt: new Date().toISOString() }
      storage.set(STORAGE_KEYS.DRAFTS, drafts)
      return { success: true, data: drafts[index] }
    }
    return { success: false, message: '草稿不存在' }
  },
  submit(id) {
    const drafts = this.getAll()
    const draft = drafts.find(d => d.id === id)
    if (!draft) {
      return { success: false, message: '草稿不存在' }
    }
    if (draft.status !== 'draft') {
      return { success: false, message: '草稿状态不正确，无法确认' }
    }

    const capacityValidation = sessionsApi.validateCapacity(draft.sessionId, draft.peopleCount)
    if (!capacityValidation.success) {
      return {
        success: false,
        message: capacityValidation.message,
        error: capacityValidation.error,
        capacity: capacityValidation.capacity
      }
    }

    sessionsApi.updateBookedCount(draft.sessionId, draft.peopleCount)

    draft.status = 'confirmed'
    draft.confirmedAt = new Date().toISOString()
    storage.set(STORAGE_KEYS.DRAFTS, drafts)

    const bookings = storage.get(STORAGE_KEYS.BOOKINGS, [])
    bookings.push({
      id: generateId(),
      ...draft,
      bookingDate: new Date().toISOString()
    })
    storage.set(STORAGE_KEYS.BOOKINGS, bookings)

    return { 
      success: true, 
      data: draft,
      capacity: capacityValidation.capacity
    }
  },
  submitAtomic(id) {
    const drafts = this.getAll()
    const draft = drafts.find(d => d.id === id)
    if (!draft) {
      return { success: false, message: '草稿不存在' }
    }
    if (draft.status !== 'draft') {
      return { success: false, message: '草稿状态不正确，无法确认' }
    }

    const currentSession = sessionsApi.getById(draft.sessionId)
    if (!currentSession) {
      return { success: false, message: '场次不存在或已取消' }
    }

    const realtimeRemaining = currentSession.capacity - currentSession.bookedCount
    if (realtimeRemaining <= 0) {
      return {
        success: false,
        error: 'full',
        message: `场次「${currentSession.exhibitName}」${currentSession.date} ${currentSession.startTime} 已满员，请重新选择场次`,
        capacity: {
          remaining: 0,
          capacity: currentSession.capacity,
          bookedCount: currentSession.bookedCount,
          draftPeopleCount: draft.peopleCount
        }
      }
    }

    if (draft.peopleCount > realtimeRemaining) {
      return {
        success: false,
        error: 'insufficient',
        message: `名额不足，该场次剩余${realtimeRemaining}个名额，您的草稿预约${draft.peopleCount}人，请减少人数或选择其他场次`,
        capacity: {
          remaining: realtimeRemaining,
          capacity: currentSession.capacity,
          bookedCount: currentSession.bookedCount,
          draftPeopleCount: draft.peopleCount
        }
      }
    }

    const sessions = sessionsApi.getAll()
    const sessionIndex = sessions.findIndex(s => s.id === draft.sessionId)
    if (sessionIndex !== -1) {
      sessions[sessionIndex].bookedCount += draft.peopleCount
      sessions[sessionIndex].status = sessions[sessionIndex].bookedCount >= sessions[sessionIndex].capacity ? 'full' : 'available'
      storage.set(STORAGE_KEYS.SESSIONS, sessions)
    }

    const draftIndex = drafts.findIndex(d => d.id === id)
    drafts[draftIndex].status = 'confirmed'
    drafts[draftIndex].confirmedAt = new Date().toISOString()
    storage.set(STORAGE_KEYS.DRAFTS, drafts)

    const bookings = storage.get(STORAGE_KEYS.BOOKINGS, [])
    bookings.push({
      id: generateId(),
      ...drafts[draftIndex],
      bookingDate: new Date().toISOString()
    })
    storage.set(STORAGE_KEYS.BOOKINGS, bookings)

    return { 
      success: true, 
      data: drafts[draftIndex],
      capacity: {
        remaining: currentSession.capacity - (currentSession.bookedCount + draft.peopleCount),
        capacity: currentSession.capacity,
        bookedCount: currentSession.bookedCount + draft.peopleCount
      }
    }
  },
  validateDraftCapacity(draftId) {
    const draft = this.getAll().find(d => d.id === draftId)
    if (!draft) {
      return { success: false, message: '草稿不存在' }
    }

    const currentSession = sessionsApi.getById(draft.sessionId)
    if (!currentSession) {
      return { success: false, message: '场次不存在' }
    }

    const realtimeRemaining = currentSession.capacity - currentSession.bookedCount
    const hasChanged = draft.peopleCount > realtimeRemaining || realtimeRemaining <= 0

    return {
      success: true,
      isValid: draft.peopleCount <= realtimeRemaining && realtimeRemaining > 0,
      hasChanged,
      draft: {
        peopleCount: draft.peopleCount,
        sessionId: draft.sessionId,
        sessionName: draft.sessionName,
        date: draft.date,
        startTime: draft.startTime
      },
      realtime: {
        remaining: realtimeRemaining,
        capacity: currentSession.capacity,
        bookedCount: currentSession.bookedCount
      }
    }
  },
  cancel(id) {
    const drafts = this.getAll()
    const index = drafts.findIndex(d => d.id === id)
    if (index !== -1) {
      drafts[index].status = 'cancelled'
      storage.set(STORAGE_KEYS.DRAFTS, drafts)
      return { success: true }
    }
    return { success: false, message: '草稿不存在' }
  },
  delete(id) {
    const drafts = this.getAll()
    const filtered = drafts.filter(d => d.id !== id)
    storage.set(STORAGE_KEYS.DRAFTS, filtered)
    return { success: true }
  },
  checkPhoneAndDateConflict(phone, date, excludeId = null) {
    const drafts = this.getAll()
    return drafts.some(d => 
      d.phone === phone && 
      d.date === date && 
      d.status === 'draft' &&
      d.id !== excludeId
    )
  }
}

const timeSlotsApi = {
  getAll() {
    return storage.get(STORAGE_KEYS.TIME_SLOTS, [])
  },
  add(slotData) {
    const slots = this.getAll()
    const slot = {
      id: generateId(),
      ...slotData,
      createdAt: new Date().toISOString()
    }
    slots.push(slot)
    storage.set(STORAGE_KEYS.TIME_SLOTS, slots)
    return slot
  },
  update(id, updates) {
    const slots = this.getAll()
    const index = slots.findIndex(s => s.id === id)
    if (index !== -1) {
      slots[index] = { ...slots[index], ...updates }
      storage.set(STORAGE_KEYS.TIME_SLOTS, slots)
      return slots[index]
    }
    return null
  },
  delete(id) {
    const slots = this.getAll()
    const filtered = slots.filter(s => s.id !== id)
    storage.set(STORAGE_KEYS.TIME_SLOTS, filtered)
    return { success: true }
  },
  toggleStatus(id) {
    const slots = this.getAll()
    const slot = slots.find(s => s.id === id)
    if (slot) {
      slot.status = slot.status === 'active' ? 'inactive' : 'active'
      storage.set(STORAGE_KEYS.TIME_SLOTS, slots)
      return slot
    }
    return null
  }
}

const guideListsApi = {
  getAll() {
    return storage.get(STORAGE_KEYS.GUIDE_LISTS, [])
  },
  getById(id) {
    return this.getAll().find(g => g.id === id)
  }
}

const bookingsApi = {
  getAll() {
    return storage.get(STORAGE_KEYS.BOOKINGS, [])
  },
  getByPhone(phone) {
    return this.getAll().filter(b => b.phone === phone)
  }
}

const tempFormApi = {
  save(sessionId, formData) {
    const tempForms = storage.get(STORAGE_KEYS.TEMP_FORM, {})
    tempForms[sessionId] = {
      ...formData,
      savedAt: new Date().toISOString(),
      sessionId
    }
    storage.set(STORAGE_KEYS.TEMP_FORM, tempForms)
    return { success: true }
  },
  get(sessionId) {
    const tempForms = storage.get(STORAGE_KEYS.TEMP_FORM, {})
    return tempForms[sessionId] || null
  },
  remove(sessionId) {
    const tempForms = storage.get(STORAGE_KEYS.TEMP_FORM, {})
    delete tempForms[sessionId]
    storage.set(STORAGE_KEYS.TEMP_FORM, tempForms)
    return { success: true }
  },
  clear() {
    storage.remove(STORAGE_KEYS.TEMP_FORM)
    return { success: true }
  },
  getAll() {
    return storage.get(STORAGE_KEYS.TEMP_FORM, {})
  }
}

initDefaultData()

export {
  STORAGE_KEYS,
  generateId,
  getTodayStr,
  validatePhone,
  storage,
  initDefaultData,
  exhibitsApi,
  sessionsApi,
  draftsApi,
  timeSlotsApi,
  guideListsApi,
  bookingsApi,
  tempFormApi
}
