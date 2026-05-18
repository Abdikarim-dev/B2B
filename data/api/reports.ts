import type { DashboardReport, AuditLog } from '@/types'
import { MOCK_DASHBOARD_REPORT, MOCK_AUDIT_LOGS } from '@/data/mock'
import {
  delay,
  successResponse,
  listResponse,
  paginate,
  filterByField,
  type PaginationParams,
} from '@/data/helpers'

const auditStore: AuditLog[] = [...MOCK_AUDIT_LOGS]

export const fetchDashboardReport = async (businessId?: string): Promise<{ data: DashboardReport; message: string; status: 'success' | 'error' }> => {
  await delay()
  // In a real API this would be computed server-side per businessId
  return successResponse(MOCK_DASHBOARD_REPORT)
}

export interface FetchAuditLogsParams extends PaginationParams {
  businessId?: string
  userId?: string
  module?: string
}

export const fetchAuditLogs = async (params: FetchAuditLogsParams = {}) => {
  await delay()
  let result = [...auditStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'userId', params.userId)
  if (params.module) result = result.filter((l) => l.module === params.module)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}
