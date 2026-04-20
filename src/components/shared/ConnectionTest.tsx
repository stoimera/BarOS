"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api/client'

interface TableResult {
  exists: boolean
  count: number
  error: string | null
}

interface ConnectionTestResult {
  success: boolean
  message: string
  tables: Record<string, TableResult>
  error?: string
}

export function ConnectionTest() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ConnectionTestResult | null>(null)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await api.get<ConnectionTestResult>('test-connection')
      setResult(response.data)
    } catch (error) {
      console.error('Connection test failed:', error)
      setResult({
        success: false,
        message: 'Failed to test connection',
        tables: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          Database Connection Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Database Connection'}
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                {result.success ? '✓' : '✗'} {result.message}
              </span>
            </div>

            {result.error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-red-700 text-sm">{result.error}</p>
              </div>
            )}

            {Object.entries(result.tables).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Table Status:</h4>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(result.tables).map(([tableName, tableResult]) => (
                    <div key={tableName} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="font-medium">{tableName}</span>
                      <div className="flex items-center gap-2">
                        <span className={tableResult.exists ? 'text-green-500' : 'text-red-500'}>
                          {tableResult.exists ? '✓' : '✗'}
                        </span>
                        <Badge variant={tableResult.exists ? 'default' : 'destructive'}>
                          {tableResult.count} records
                        </Badge>
                        {tableResult.error && (
                          <span className="text-yellow-500" title={tableResult.error}>⚠</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 