import { ScreenPlaceholder } from "@/components/ui/ScreenPlaceholder"
import { SCREENS } from "@/lib/routes"

const SCREEN = SCREENS[6]

export default function Page() {
  return (
    <ScreenPlaceholder
      screen={SCREEN}
      intent="What it takes to build this for real. Scope, sequence, the people needed and the assumptions to close first."
      sourceChecks={[
        { key: "FABRIC.SILVER_PART_CONFORMED", label: "Mappings to verify", value: "45" },
        { key: "SUP.APPROVED_LIST", label: "Highest risk assumption", value: "Approved supplier list" },
        { key: "DUP.CAUSE_REVISION_ABUSE", label: "Root cause to confirm", value: "Revision abuse" },
      ]}
    />
  )
}
