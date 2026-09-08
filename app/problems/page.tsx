import { ProblemScatter } from "@/components/screens/problems/ProblemScatter"
import { ProblemDetailPanel } from "@/components/screens/problems/ProblemDetailPanel"

/**
 * Screen 1. Runs for about ninety seconds.
 *
 * The point is that the problem is chosen before any tool is shown, so the text on
 * screen stays minimal and the presenter speaks the method.
 */
export default function ProblemsPage() {
  return (
    <div className="flex screen-h flex-col gap-3.5">
      <section className="card-topbar relative flex min-h-0 flex-1 flex-col rounded-card border border-hairline bg-surface px-5 pb-4 pt-6 shadow-card">
        <ProblemScatter />
      </section>

      <ProblemDetailPanel />
    </div>
  )
}
