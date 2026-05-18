import type { Metadata } from 'next'
import { DesignSystemView } from './DesignSystemView'

export const metadata: Metadata = {
  title: 'Design System',
}

export default function DesignSystemPage() {
  return <DesignSystemView />
}
