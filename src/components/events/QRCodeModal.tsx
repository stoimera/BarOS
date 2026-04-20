"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import QRCode from "qrcode"
import { FormModal } from "@/components/shared/FormModal"
import Image from 'next/image'
import { Skeleton } from "@/components/ui/skeleton"

interface QRCodeModalProps {
  open: boolean
  onClose: () => void
  eventId: string
  eventTitle: string
}

export function QRCodeModal({ open, onClose, eventId, eventTitle }: QRCodeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [imageError, setImageError] = useState(false)

  const checkInUrl = `${window.location.origin}/checkin/${eventId}`

  const generateQRCode = useCallback(async () => {
    setLoading(true)
    try {
      const dataUrl = await QRCode.toDataURL(checkInUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch {
      toast.error("Failed to generate QR code")
    } finally {
      setLoading(false)
    }
  }, [checkInUrl])

  useEffect(() => {
    if (open && eventId) {
      void generateQRCode()
    }
  }, [open, eventId, generateQRCode])

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return
    
    const link = document.createElement('a')
    link.download = `checkin-${eventId}.png`
    link.href = qrCodeDataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("QR code downloaded")
  }

  const copyCheckInUrl = async () => {
    try {
      await navigator.clipboard.writeText(checkInUrl)
      toast.success("Check-in URL copied to clipboard")
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onClose}
      title="QR Code"
      onSubmit={() => {}} // No submit action needed
      onCancel={onClose}
      submitText=""
      cancelText="Close"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">{eventTitle}</p>
          <p className="text-xs text-muted-foreground">Scan this QR code to check in attendees</p>
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-center">
              {loading ? (
                <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : qrCodeDataUrl ? (
                <div className="relative w-48 h-48 sm:w-64 sm:h-64">
                  {imageLoading && (
                    <Skeleton className="w-48 h-48 sm:w-64 sm:h-64 absolute inset-0" />
                  )}
                  {!imageError ? (
                    <Image
                      src={qrCodeDataUrl}
                      alt="Check-in QR Code"
                      fill
                      className={`transition-opacity duration-300 ${
                        imageLoading ? 'opacity-0' : 'opacity-100'
                      }`}
                      onLoad={() => setImageLoading(false)}
                      onError={() => {
                        setImageError(true);
                        setImageLoading(false);
                      }}
                      sizes="(max-width: 640px) 192px, 256px"
                      priority={true}
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">Failed to load QR code</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-48 h-48 sm:w-64 sm:h-64 bg-gray-100 rounded flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Failed to generate QR code</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Check-in URL:</p>
          <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs font-mono break-all">
            {checkInUrl}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={downloadQRCode} 
            disabled={!qrCodeDataUrl || loading}
            className="w-full sm:flex-1"
          >
            <span className="mr-2">⬇</span>
            Download
          </Button>
          <Button 
            variant="outline" 
            onClick={copyCheckInUrl}
            className="w-full sm:flex-1"
          >
            <span className="mr-2">📋</span>
            Copy URL
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          <p>• Display this QR code at your event entrance</p>
          <p>• Attendees can scan to check in automatically</p>
          <p>• Works with any QR code scanner app</p>
        </div>
      </div>
    </FormModal>
  )
} 