// Calculate stock status based on quantity and threshold
export function calculateStockStatus(quantity: number, threshold: number): {
  status: 'out_of_stock' | 'low_stock' | 'in_stock'
  label: string
  color: string
  icon: string
} {
  if (quantity === 0) {
    return {
      status: 'out_of_stock',
      label: 'Out of Stock',
      color: 'bg-red-100 text-red-800',
      icon: '❌'
    }
  } else if (quantity <= threshold) {
    return {
      status: 'low_stock',
      label: 'Low Stock',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '⚠️'
    }
  } else {
    return {
      status: 'in_stock',
      label: 'In Stock',
      color: 'bg-green-100 text-green-800',
      icon: '✅'
    }
  }
}

// Calculate new quantity after stock adjustment
export function calculateNewQuantity(currentQuantity: number, change: number): number {
  return currentQuantity + change
}

// Validate stock adjustment to prevent negative quantities
export function validateStockAdjustment(
  currentQuantity: number,
  change: number
): { isValid: boolean; error?: string } {
  if (change === 0) {
    return { isValid: false, error: 'Change amount cannot be zero' }
  }

  const newQuantity = calculateNewQuantity(currentQuantity, change)
  
  if (newQuantity < 0) {
    return { 
      isValid: false, 
      error: `Cannot remove more than current stock (${currentQuantity})` 
    }
  }

  return { isValid: true }
}

// Calculate total inventory value based on quantity and cost
export function calculateInventoryValue(quantity: number, cost: number): number {
  return quantity * cost
}

// Format currency amounts with proper symbols
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  if (currency === 'EUR') {
    const fixedAmount = Number(amount).toFixed(2)
    return `€${fixedAmount}`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

// Calculate profit margin percentage
export function calculateProfitMargin(cost: number, price: number): number {
  if (price === 0) return 0
  return ((price - cost) / price) * 100
}

// Categorize profit margin into business categories
export function getMarginCategory(margin: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (margin >= 80) return 'excellent'
  if (margin >= 60) return 'good'
  if (margin >= 40) return 'fair'
  return 'poor'
}

// Calculate event revenue estimates with marketing costs
export function calculateEventRevenue(
  ticketPrice: number,
  expectedAttendance: number,
  capacity: number,
  marketingBudget: number = 0
): {
  potentialRevenue: number
  netRevenue: number
  attendanceRate: number
} {
  const attendanceRate = Math.min(expectedAttendance / capacity, 1)
  const actualAttendance = Math.floor(capacity * attendanceRate)
  const potentialRevenue = actualAttendance * ticketPrice
  const netRevenue = potentialRevenue - marketingBudget

  return {
    potentialRevenue,
    netRevenue,
    attendanceRate: attendanceRate * 100
  }
}

// Calculate loyalty reward cost
export function calculateLoyaltyRewardCost(
  rewardValue: number,
  redemptionRate: number,
  totalCustomers: number
): number {
  const expectedRedemptions = Math.floor(totalCustomers * (redemptionRate / 100))
  return expectedRedemptions * rewardValue
} 