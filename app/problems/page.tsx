import { ScreenPlaceholder } from "@/components/ui/ScreenPlaceholder"
import { SCREENS } from "@/lib/routes"

const SCREEN = SCREENS[0]

export default function Page() {
  return (
    <ScreenPlaceholder
      screen={SCREEN}
      intent="Pick the problem the room actually cares about. Everything after this screen follows from that choice."
      sourceChecks={[
        { key: "FABRIC.GOLD_PART_MASTER", label: "Parts in the item master", value: "2,400" },
        { key: "DUP.CLUSTER_MEMBERSHIP", label: "Duplicate clusters found", value: "140" },
        { key: "FABRIC.GOLD_MRO", label: "Maintainable assets", value: "210" },
      ]}
    />
  )
}
