/**
 * URL 预览包装器（客户端组件）
 */

'use client'

import { useSubmitForm } from './SubmitForm'
import { UrlPreview } from './UrlPreview'

export function UrlPreviewWrapper() {
  const { selectedItems } = useSubmitForm()

  return <UrlPreview selectedItems={selectedItems} />
}
