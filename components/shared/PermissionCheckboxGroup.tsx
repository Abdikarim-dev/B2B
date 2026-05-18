'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { Permission, PermissionGroup } from '@/types'

interface PermissionCheckboxGroupProps {
  group: PermissionGroup
  selectedPermissions: Permission[]
  onToggle: (permission: Permission) => void
  onToggleAll: (permissions: Permission[], checked: boolean) => void
  disabled?: boolean
  defaultOpen?: boolean
}

export function PermissionCheckboxGroup({
  group,
  selectedPermissions,
  onToggle,
  onToggleAll,
  disabled = false,
  defaultOpen = true,
}: PermissionCheckboxGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const groupPermissions = group.permissions.map((p) => p.key)
  const checkedCount = groupPermissions.filter((p) => selectedPermissions.includes(p)).length
  const allChecked = checkedCount === groupPermissions.length
  const someChecked = checkedCount > 0 && !allChecked

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-slate-200 rounded-lg">
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors rounded-t-lg">
          <Checkbox
            id={`group-${group.module}`}
            checked={allChecked}
            ref={(el) => {
              if (el) {
                const input = el.querySelector('input')
                if (input) input.indeterminate = someChecked
              }
            }}
            onCheckedChange={(checked) => {
              onToggleAll(groupPermissions, !!checked)
            }}
            disabled={disabled}
            onClick={(e) => e.stopPropagation()}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <div className="flex-1 flex items-center gap-2">
            <span className="font-medium text-slate-900">{group.label}</span>
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {checkedCount}/{groupPermissions.length}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {group.permissions.map((perm) => (
              <label
                key={perm.key}
                className={cn(
                  'flex items-start gap-2.5 p-2 rounded-md cursor-pointer hover:bg-white transition-colors',
                  disabled && 'cursor-not-allowed opacity-60'
                )}
              >
                <Checkbox
                  id={perm.key}
                  checked={selectedPermissions.includes(perm.key)}
                  onCheckedChange={() => onToggle(perm.key)}
                  disabled={disabled}
                  className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-800">{perm.label}</span>
                  {perm.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{perm.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface PermissionCheckboxListProps {
  groups: PermissionGroup[]
  selectedPermissions: Permission[]
  onToggle: (permission: Permission) => void
  onToggleAll: (permissions: Permission[], checked: boolean) => void
  disabled?: boolean
}

export function PermissionCheckboxList({
  groups,
  selectedPermissions,
  onToggle,
  onToggleAll,
  disabled = false,
}: PermissionCheckboxListProps) {
  return (
    <div className="space-y-2">
      {groups.map((group) => (
        <PermissionCheckboxGroup
          key={group.module}
          group={group}
          selectedPermissions={selectedPermissions}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          disabled={disabled}
        />
      ))}
    </div>
  )
}
