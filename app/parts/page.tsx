import { ScreenPlaceholder } from "@/components/ui/ScreenPlaceholder"
import { SCREENS } from "@/lib/routes"

const SCREEN = SCREENS[2]

export default function Page() {
  return (
    <ScreenPlaceholder
      screen={SCREEN}
      intent="What the part master really contains once the two systems are put side by side."
      sourceChecks={[
        { key: "PART.ORACLE_IDENTITY", label: "Part number", value: "4821907-014" },
        { key: "PART.TC_REVISION", label: "Current revision", value: "C" },
        { key: "DUP.SPEND_EXPOSURE", label: "Spend across the cluster", value: "$1.42M" },
      ]}
    />
  )
}
