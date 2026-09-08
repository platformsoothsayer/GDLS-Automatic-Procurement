import { ScreenPlaceholder } from "@/components/ui/ScreenPlaceholder"
import { SignalReceipt } from "@/components/screens/mro/SignalReceipt"
import { buildSignals } from "@/lib/mro"
import { SCREENS } from "@/lib/routes"

const SCREEN = SCREENS[4]

export default function Page() {
  return (
    <>
      {/* Screen 5 is not built yet. This is what makes the handoff from screen 4
          visible on arrival rather than implied. */}
      <SignalReceipt signals={buildSignals()} />
      <ScreenPlaceholder
        screen={SCREEN}
        intent="From a signal to a proposed requisition, with the reasoning shown at every step. Nothing releases without a person."
        sourceChecks={[
          { key: "MRO.WORK_ORDER_MATERIAL", label: "Demand from work orders", value: "38 lines" },
          { key: "SUP.APPROVED_LIST", label: "Approved supplier", value: "SUP-10142" },
          { key: "REQ.LINE", label: "Proposed requisition", value: "REQ-51236" },
        ]}
      />
    </>
  )
}
