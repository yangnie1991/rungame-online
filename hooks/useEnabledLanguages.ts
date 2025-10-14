import { useState, useEffect } from 'react'
import { getEnabledLanguages } from '@/app/(admin)/admin/languages/actions'

export interface EnabledLanguage {
  code: string
  label: string
  name: string
}

export function useEnabledLanguages() {
  const [languages, setLanguages] = useState<EnabledLanguage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadLanguages() {
      try {
        setIsLoading(true)
        const result = await getEnabledLanguages()

        if (result.success) {
          setLanguages(result.data)
          setError(null)
        } else {
          setError(result.error || '加载语言列表失败')
          // 如果失败，使用默认语言
          setLanguages([
            { code: 'zh', label: '中文', name: 'Chinese' },
            { code: 'en', label: 'English', name: 'English' }
          ])
        }
      } catch (err) {
        console.error('加载已启用语言失败:', err)
        setError('加载语言列表失败')
        // 使用默认语言
        setLanguages([
          { code: 'zh', label: '中文', name: 'Chinese' },
          { code: 'en', label: 'English', name: 'English' }
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadLanguages()
  }, [])

  return { languages, isLoading, error }
}
