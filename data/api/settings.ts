import type { BusinessSettings } from '@/types'
import { MOCK_BUSINESS_SETTINGS } from '@/data/mock'
import { delay, successResponse } from '@/data/helpers'

let settingsStore: BusinessSettings[] = [...MOCK_BUSINESS_SETTINGS]

export const fetchSettings = async (businessId: string) => {
  await delay()
  const settings = settingsStore.find((s) => s.businessId === businessId)
  if (!settings) throw new Error(`Settings for business ${businessId} not found`)
  return successResponse(settings)
}

export const updateSettings = async (businessId: string, data: Partial<BusinessSettings>) => {
  await delay()
  const idx = settingsStore.findIndex((s) => s.businessId === businessId)
  if (idx === -1) throw new Error(`Settings for business ${businessId} not found`)
  settingsStore[idx] = { ...settingsStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(settingsStore[idx], 'Settings updated')
}
