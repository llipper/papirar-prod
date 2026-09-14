import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { SubscriptionManagementCard } from "@/components/subscription/subscription-management-card"

export default function SubscriptionPage() {
  return (
    <DashboardShell title="Assinatura" description="Gerencie seu Papirar Premium">
      <div className="mx-auto w-full max-w-2xl">
        <SubscriptionManagementCard />
      </div>
    </DashboardShell>
  )
}
