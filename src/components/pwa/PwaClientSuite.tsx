"use client"

import { PwaInstallExperience } from "@/components/pwa/PwaInstallExperience"
import { PwaUpdateNotifier } from "@/components/pwa/PwaUpdateNotifier"
import { PushNotificationsBar } from "@/components/pwa/PushNotificationsBar"

export function PwaClientSuite() {
  return (
    <>
      <PwaUpdateNotifier />
      <PwaInstallExperience />
      <PushNotificationsBar />
    </>
  )
}
