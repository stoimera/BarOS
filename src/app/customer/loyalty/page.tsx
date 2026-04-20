"use client";

import { useCallback, useEffect, useState } from "react";
import { LoyaltyTierCard } from "@/components/customers/LoyaltyTierCard";
import { AlcoholPunchCard } from "@/components/customers/AlcoholPunchCard";
import { CoffeePunchCard } from "@/components/customers/CoffeePunchCard";
import { LoyaltyTier } from "@/types/customer";
import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoyaltyPunchQrPanel } from "@/components/customer/LoyaltyPunchQrPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface LoyaltyRecord {
  tier: LoyaltyTier;
  total_points: number;
  lifetime_visits: number;
  alcohol_punch_count: number;
  alcohol_goal: number;
  alcohol_rewarded: boolean;
  coffee_punch_count: number;
  coffee_goal: number;
  coffee_rewarded: boolean;
}

interface PunchHistoryRow {
  id: string;
  description: string | null;
  punch_kind: string | null;
  claimed: boolean;
  claimed_at: string | null;
  redemption_code: string;
  created_at: string;
}

const supabase = createClient();

export default function LoyaltyPage() {
  const { user } = useAuth();
  const [loyalty, setLoyalty] = useState<LoyaltyRecord | null>(null);
  const [punchHistory, setPunchHistory] = useState<PunchHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLoyalty = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.id) {
      setLoading(false);
      return;
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("profile_id", profile.id)
      .maybeSingle();

    if (customerError || !customer?.id) {
      setLoading(false);
      return;
    }

    const { data: loyaltyData } = await supabase
      .from("loyalty")
      .select(
        "tier,total_points,lifetime_visits,alcohol_punch_count,alcohol_goal,alcohol_rewarded,coffee_punch_count,coffee_goal,coffee_rewarded"
      )
      .eq("customer_id", customer.id)
      .maybeSingle();

    setLoyalty(loyaltyData ?? null);

    const { data: history, error: historyError } = await supabase
      .from("enhanced_rewards")
      .select("id, description, punch_kind, claimed, claimed_at, redemption_code, created_at")
      .eq("customer_id", customer.id)
      .not("punch_kind", "is", null)
      .order("created_at", { ascending: false })
      .limit(12);

    if (!historyError && history) {
      setPunchHistory(history as PunchHistoryRow[]);
    } else {
      setPunchHistory([]);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    void loadLoyalty();
  }, [loadLoyalty]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void loadLoyalty();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [loadLoyalty]);

  const coffeeReady = !!loyalty && loyalty.coffee_punch_count >= loyalty.coffee_goal;
  const alcoholReady = !!loyalty && loyalty.alcohol_punch_count >= loyalty.alcohol_goal;

  return (
    <div className="min-h-screen bg-background py-4 sm:py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="mb-6 sm:mb-8">
            <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl">Loyalty Points</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Track your loyalty progress and rewards
            </p>
          </div>

          {loading && <p className="text-sm text-muted-foreground">Loading loyalty data...</p>}

          <LoyaltyTierCard
            tier={loyalty?.tier ?? LoyaltyTier.BRONZE}
            totalPoints={loyalty?.total_points ?? 0}
            lifetimeVisits={loyalty?.lifetime_visits ?? 0}
          />

          <div className="mt-6 sm:mt-8">
            <h2 className="mb-4 text-lg font-semibold text-foreground sm:mb-6 sm:text-xl">Punch Cards</h2>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
              <AlcoholPunchCard
                mode="customer"
                punchCount={loyalty?.alcohol_punch_count ?? 0}
                goal={loyalty?.alcohol_goal ?? 10}
                rewarded={loyalty?.alcohol_rewarded ?? false}
              />
              <CoffeePunchCard
                mode="customer"
                punchCount={loyalty?.coffee_punch_count ?? 0}
                goal={loyalty?.coffee_goal ?? 8}
                rewarded={loyalty?.coffee_rewarded ?? false}
              />
            </div>
          </div>

          {(coffeeReady || alcoholReady) && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Redeem at the bar</h2>
              {coffeeReady ? (
                <LoyaltyPunchQrPanel
                  punchKind="coffee"
                  title="Coffee punch card"
                  ready={coffeeReady}
                  onVoucherChange={() => void loadLoyalty()}
                />
              ) : null}
              {alcoholReady ? (
                <LoyaltyPunchQrPanel
                  punchKind="alcohol"
                  title="Alcohol punch card"
                  ready={alcoholReady}
                  onVoucherChange={() => void loadLoyalty()}
                />
              ) : null}
            </div>
          )}

          {punchHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Punch reward history</CardTitle>
                <p className="text-sm text-muted-foreground">
                  QR vouchers you used at the bar (punch line resets after each redeem).
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {punchHistory.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col gap-1 rounded-md border border-border p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {row.punch_kind === "coffee"
                          ? "Coffee punch reward"
                          : row.punch_kind === "alcohol"
                            ? "Alcohol punch reward"
                            : "Punch reward"}
                      </p>
                      {row.description ? (
                        <p className="text-xs text-muted-foreground">{row.description}</p>
                      ) : null}
                      <p className="font-mono text-xs text-muted-foreground">{row.redemption_code}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {row.claimed && row.claimed_at
                        ? `Redeemed ${format(new Date(row.claimed_at), "MMM d, yyyy")}`
                        : row.claimed
                          ? "Redeemed"
                          : "Waiting for staff scan"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
