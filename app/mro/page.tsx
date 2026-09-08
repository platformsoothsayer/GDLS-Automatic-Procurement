import { ScreenPlaceholder } from "@/components/ui/ScreenPlaceholder"
import { SCREENS } from "@/lib/routes"

const SCREEN = SCREENS[3]

export default function Page() {
  return (
    <ScreenPlaceholder
      screen={SCREEN}
      intent="What the assets are telling us, ranked so the first thing on the list is the thing to do first."
      sourceChecks={[
        { key: "MRO.ASSET_REGISTER", label: "Asset", value: "AST-3084" },
        { key: "MRO.ASSET_CRITICALITY", label: "Criticality", value: "HIGH" },
        { key: "MRO.CONDITION_SIGNAL", label: "Signal score", value: "78.4" },
      ]}
    />
  )
}
