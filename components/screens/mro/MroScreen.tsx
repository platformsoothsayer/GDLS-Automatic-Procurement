"use client"

/**
 * Screen 4. Deliberately lean.
 *
 * This screen exists to produce a signal that screen 5 consumes. It is not a
 * maintenance product, so there is an asset register, the two conditions that fire a
 * signal, and one action.
 */

import { useState } from "react"
import type { AssetRow, Signal } from "@/lib/mro"
import { AssetTable } from "@/components/screens/mro/AssetTable"
import { SignalPanel } from "@/components/screens/mro/SignalPanel"

export function MroScreen({ rows, signals }: { rows: AssetRow[]; signals: Signal[] }) {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)

  const select = (assetNumber: string) => {
    setSelectedAsset(assetNumber)
    document.getElementById(`signal-${assetNumber}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" })
  }

  return (
    <div className="grid h-[calc(100vh-184px)] grid-cols-[3fr_2fr] gap-3">
      <AssetTable rows={rows} selectedAsset={selectedAsset} onSelect={select} />
      <SignalPanel signals={signals} selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />
    </div>
  )
}
