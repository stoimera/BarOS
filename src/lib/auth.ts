import { supabase } from './supabase'
import { toast } from 'sonner'

// 2FA Types
export interface TwoFactorSetup {
  secret: string
  qr_code: string
  backup_codes: string[]
}

export interface TwoFactorStatus {
  enabled: boolean
  verified: boolean
  backup_codes_remaining: number
}

// Generate TOTP secret and QR code
export async function setupTwoFactor(): Promise<TwoFactorSetup> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('You must be logged in to set up 2FA.')
    }
    // Generate a random secret (in production, use a proper TOTP library)
    const secret = generateSecret()
    const qr_code = generateQRCode(secret)
    const backup_codes = generateBackupCodes()
    
    // Store the secret temporarily (in production, encrypt this)
    await supabase.auth.updateUser({
      data: {
        two_factor_secret: secret,
        two_factor_backup_codes: backup_codes,
        two_factor_enabled: false
      }
    })
    
    return {
      secret,
      qr_code,
      backup_codes
    }
  } catch (error) {
    console.error('Failed to setup 2FA:', error)
    throw error
  }
}

// Verify TOTP code
export async function verifyTwoFactorCode(code: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const secret = user.user_metadata?.two_factor_secret
    if (!secret) throw new Error('2FA not setup')
    
    // Verify the code (in production, use a proper TOTP library)
    const isValid = verifyTOTP(secret, code)
    
    if (isValid) {
      // Enable 2FA
      await supabase.auth.updateUser({
        data: {
          two_factor_enabled: true,
          two_factor_verified: true
        }
      })
      return true
    }
    
    return false
  } catch (error) {
    console.error('Failed to verify 2FA code:', error)
    return false
  }
}

// Verify backup code
export async function verifyBackupCode(code: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const backup_codes = user.user_metadata?.two_factor_backup_codes || []
    const codeIndex = backup_codes.indexOf(code)
    
    if (codeIndex === -1) return false
    
    // Remove used backup code
    backup_codes.splice(codeIndex, 1)
    await supabase.auth.updateUser({
      data: {
        two_factor_backup_codes: backup_codes
      }
    })
    
    return true
  } catch (error) {
    console.error('Failed to verify backup code:', error)
    return false
  }
}

// Get 2FA status
export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { enabled: false, verified: false, backup_codes_remaining: 0 }
    }
    return {
      enabled: user.user_metadata?.two_factor_enabled || false,
      verified: user.user_metadata?.two_factor_verified || false,
      backup_codes_remaining: (user.user_metadata?.two_factor_backup_codes || []).length
    }
  } catch (error) {
    console.error('Failed to get 2FA status:', error)
    return { enabled: false, verified: false, backup_codes_remaining: 0 }
  }
}

// Disable 2FA
export async function disableTwoFactor(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    await supabase.auth.updateUser({
      data: {
        two_factor_enabled: false,
        two_factor_verified: false,
        two_factor_secret: null,
        two_factor_backup_codes: []
      }
    })
    
    toast.success('Two-factor authentication disabled')
    return true
  } catch (error) {
    console.error('Failed to disable 2FA:', error)
    toast.error('Failed to disable two-factor authentication')
    return false
  }
}

// Generate new backup codes
export async function generateNewBackupCodes(): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')
    
    const newBackupCodes = generateBackupCodes()
    
    await supabase.auth.updateUser({
      data: {
        two_factor_backup_codes: newBackupCodes
      }
    })
    
    toast.success('New backup codes generated')
    return newBackupCodes
  } catch (error) {
    console.error('Failed to generate backup codes:', error)
    toast.error('Failed to generate backup codes')
    throw error
  }
}

// Helper functions (in production, use proper libraries)
function generateSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateQRCode(secret: string): string {
  // In production, use a proper QR code library
  const otpauth = `otpauth://totp/UrbanBarCRM:${encodeURIComponent('user@example.com')}?secret=${secret}&issuer=UrbanBarCRM`
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`
}

function generateBackupCodes(): string[] {
  const codes = []
  for (let i = 0; i < 10; i++) {
    codes.push(Math.random().toString(36).substring(2, 8).toUpperCase())
  }
  return codes
}

function verifyTOTP(secret: string, code: string): boolean {
  // In production, use a proper TOTP library like 'otplib'
  // This is a simplified implementation
  const timestamp = Math.floor(Date.now() / 30000) // 30-second window
  const expectedCode = generateTOTP(secret, timestamp)
  return code === expectedCode
}

function generateTOTP(secret: string, timestamp: number): string {
  // Simplified TOTP generation (in production, use proper library)
  const hash = btoa(secret + timestamp.toString())
  const code = parseInt(hash.substring(0, 6), 16) % 1000000
  return code.toString().padStart(6, '0')
} 