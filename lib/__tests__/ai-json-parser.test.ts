/**
 * AI JSON 解析器测试
 */

import { parseAIJsonResponse, tryParseAIJsonResponse } from '../ai-json-parser'

describe('parseAIJsonResponse', () => {
  it('应该正确解析普通 JSON', () => {
    const json = '{"title": "Test", "value": 123}'
    const result = parseAIJsonResponse(json)
    expect(result).toEqual({ title: 'Test', value: 123 })
  })

  it('应该正确解析带 ```json 标记的 JSON', () => {
    const json = '```json\n{"title": "Test", "value": 123}\n```'
    const result = parseAIJsonResponse(json)
    expect(result).toEqual({ title: 'Test', value: 123 })
  })

  it('应该正确解析带 ``` 标记的 JSON (无 json 关键字)', () => {
    const json = '```\n{"title": "Test", "value": 123}\n```'
    const result = parseAIJsonResponse(json)
    expect(result).toEqual({ title: 'Test', value: 123 })
  })

  it('应该处理带空白字符的 JSON', () => {
    const json = '  \n  {"title": "Test"}  \n  '
    const result = parseAIJsonResponse(json)
    expect(result).toEqual({ title: 'Test' })
  })

  it('应该处理带空白字符的代码块', () => {
    const json = '  ```json  \n  {"title": "Test"}  \n  ```  '
    const result = parseAIJsonResponse(json)
    expect(result).toEqual({ title: 'Test' })
  })

  it('解析失败时应该抛出错误', () => {
    const invalidJson = '{"title": invalid}'
    expect(() => parseAIJsonResponse(invalidJson)).toThrow('JSON 解析失败')
  })

  it('解析失败时应该包含错误上下文', () => {
    const invalidJson = '{"title": invalid}'
    expect(() => parseAIJsonResponse(invalidJson, 'test-context')).toThrow('JSON 解析失败')
  })
})

describe('tryParseAIJsonResponse', () => {
  it('应该在成功时返回解析结果', () => {
    const json = '{"title": "Test"}'
    const result = tryParseAIJsonResponse(json, { title: 'Default' })
    expect(result).toEqual({ title: 'Test' })
  })

  it('应该在失败时返回默认值', () => {
    const invalidJson = '{"title": invalid}'
    const result = tryParseAIJsonResponse(invalidJson, { title: 'Default' })
    expect(result).toEqual({ title: 'Default' })
  })

  it('应该处理带 markdown 标记的成功解析', () => {
    const json = '```json\n{"title": "Test"}\n```'
    const result = tryParseAIJsonResponse(json, { title: 'Default' })
    expect(result).toEqual({ title: 'Test' })
  })
})
