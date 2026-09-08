import { ScreenPlaceholder } from "@/components/ui/ScreenPlaceholder"
import { SCREENS } from "@/lib/routes"
import { SYSTEM_LABEL } from "@/data/nomenclature"

const SCREEN = SCREENS[1]

export default function Page() {
  return (
    <ScreenPlaceholder
      screen={SCREEN}
      intent="The shape of the fabric before anything is loaded into it. Sources, layers and what each layer is for."
      sourceChecks={[
        { key: "FABRIC.BRONZE_ORACLE", label: `${SYSTEM_LABEL.ORACLE_EBS} landing`, value: "Bronze" },
        { key: "FABRIC.BRONZE_TEAMCENTER", label: `${SYSTEM_LABEL.TEAMCENTER} landing`, value: "Bronze" },
        { key: "FABRIC.SILVER_PART_CONFORMED", label: "Conformed part record", value: "Silver" },
      ]}
    />
  )
}
