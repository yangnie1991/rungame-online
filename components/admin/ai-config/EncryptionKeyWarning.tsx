"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Info, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"

/**
 * ENCRYPTION_KEY 配置检查和提示组件
 */
export function EncryptionKeyWarning() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'missing'>('checking')
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // 检查 ENCRYPTION_KEY 是否配置
    fetch('/api/admin/check-encryption-key')
      .then(res => res.json())
      .then(data => {
        setStatus(data.configured ? 'ok' : 'missing')
      })
      .catch(() => {
        setStatus('missing')
      })
  }, [])

  // 检查中和正常状态都不显示，只有缺失时才显示警告
  if (status === 'checking' || status === 'ok') {
    return null
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">⚠️ 缺少加密密钥配置</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          未检测到 <code className="bg-amber-100 px-1 rounded">ENCRYPTION_KEY</code> 环境变量。
          这是用于加密存储 API Key 的必需配置。
        </p>

        {!showDetails ? (
          <Button
            variant="link"
            size="sm"
            className="text-amber-800 p-0 h-auto"
            onClick={() => setShowDetails(true)}
          >
            查看配置说明 →
          </Button>
        ) : (
          <div className="mt-4 space-y-3 text-sm">
            <div className="bg-white p-3 rounded border border-amber-200">
              <p className="font-semibold mb-2">步骤 1: 生成加密密钥</p>
              <p className="mb-2">在终端运行以下命令：</p>
              <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto">
                openssl rand -base64 48
              </pre>
            </div>

            <div className="bg-white p-3 rounded border border-amber-200">
              <p className="font-semibold mb-2">步骤 2: 添加到环境变量</p>
              <p className="mb-2">在 <code>.env.local</code> 文件中添加：</p>
              <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs">
                ENCRYPTION_KEY="你生成的密钥"
              </pre>
            </div>

            <div className="bg-white p-3 rounded border border-amber-200">
              <p className="font-semibold mb-2">步骤 3: 重启开发服务器</p>
              <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs">
                # 停止当前服务器 (Ctrl+C){'\n'}npm run dev
              </pre>
            </div>

            <div className="bg-amber-100 p-3 rounded">
              <p className="font-semibold text-amber-900 mb-1">⚠️ 重要提醒</p>
              <p className="text-xs text-amber-800">
                如果你之前已经创建了AI配置，添加ENCRYPTION_KEY后需要重新创建配置，
                因为旧配置无法使用新的加密密钥解密。
              </p>
            </div>

            <Button
              variant="link"
              size="sm"
              className="text-amber-800 p-0 h-auto"
              onClick={() => setShowDetails(false)}
            >
              ↑ 收起
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}
