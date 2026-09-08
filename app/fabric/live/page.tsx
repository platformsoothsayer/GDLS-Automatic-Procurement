import { ScreenPlaceholder } from "@/components/ui/ScreenPlaceholder"
import { SCREENS } from "@/lib/routes"

const SCREEN = SCREENS[5]

export default function Page() {
  return (
    <ScreenPlaceholder
      screen={SCREEN}
      intent="The same fabric, now carrying what happened in this session rather than a set of fixed numbers."
      sourceChecks={[
        { key: "FABRIC.GOLD_PART_MASTER", label: "Part master mart", value: "2,400 rows" },
        { key: "FABRIC.GOLD_PROCUREMENT", label: "Procurement mart", value: "5,600 rows" },
        { key: "FABRIC.GOLD_MRO", label: "Reliability mart", value: "210 rows" },
      ]}
    />
  )
}
