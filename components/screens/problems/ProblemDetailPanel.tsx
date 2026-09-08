"use client"

/**
 * The three highlighted problems, one column each.
 *
 * In Data view the value estimate and each source chip carry a tag, so the room can
 * see the estimate is derived from a named source rather than asserted.
 *
 * Clicking a column selects that problem into session state. Screens 5 and 6 read it.
 */

import { HIGHLIGHTED_PROBLEMS, type CandidateProblem } from "@/data/problems"
import { Traced } from "@/components/lineage/Traced"
import { useDataView } from "@/context/DataViewContext"
import { useSession } from "@/context/SessionContext"
import { compactMoney } from "@/lib/format"

function EstateBar({ fraction }: { fraction: number }) {
  return (
    <div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-canvas ring-1 ring-inset ring-hairline">
        <div className="h-full rounded-full bg-cyan" style={{ width: `${fraction}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-navy-faint">
        <span className="mono text-navy-muted">{fraction.toFixed(1)}%</span>{" "}
        <span>of the application estate</span>
      </p>
    </div>
  )
}

function Column({ problem, selected, onSelect }: { problem: CandidateProblem; selected: boolean; onSelect: () => void }) {
  const detail = problem.detail!
  const { isDataView } = useDataView()

  // In Business view the whole column is the click target, which gives the presenter
  // a large, forgiving one. In Data view the traced values are the click targets, so
  // the column steps back rather than nesting controls inside a control.
  const Frame = isDataView ? "div" : "button"
  const frameProps = isDataView
    ? {}
    : { type: "button" as const, onClick: onSelect, "aria-pressed": selected }

  return (
    <Frame
      {...frameProps}
      className={`card-topbar relative flex h-full min-h-[268px] flex-col gap-2 rounded-card border bg-surface px-4 pb-3.5 pt-5 text-left shadow-card transition-colors ${
        selected ? "border-cyan ring-1 ring-cyan" : "border-hairline"
      } ${isDataView ? "" : "hover:border-cyan-line"}`}
    >
      <h3 className="text-[13.5px] font-semibold leading-snug text-navy">{problem.name}</h3>

      <p className="text-[11.5px] leading-[1.45] text-navy-muted">{detail.statement}</p>

      <Traced sourceKey={detail.valueSourceKey} label={`${problem.name} · annual value`} tag="inline">
        <span className="mono text-[20px] font-medium leading-none text-cyan">
          {compactMoney(problem.annualValue)}
        </span>
      </Traced>

      <div className="flex flex-wrap gap-1">
        {detail.sources.map((source) => (
          <Traced key={source.key + source.label} sourceKey={source.key} label={source.label} tag="inline">
            <span className="inline-block rounded border border-hairline bg-canvas px-1.5 py-0.5 text-[10px] leading-4 text-navy-muted">
              {source.label}
            </span>
          </Traced>
        ))}
      </div>

      <div className="mt-auto pt-0.5">
        <EstateBar fraction={detail.estateFractionPct} />
      </div>
    </Frame>
  )
}

export function ProblemDetailPanel() {
  const { selectedProblemId, selectProblem } = useSession()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 items-stretch gap-3.5">
        {HIGHLIGHTED_PROBLEMS.map((problem) => (
          <Column
            key={problem.id}
            problem={problem}
            selected={selectedProblemId === problem.id}
            onSelect={() => selectProblem(problem.id, problem.name)}
          />
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <p className="text-[13px] font-medium text-navy">
          Three problems. Two source systems. Four percent of the application estate.
        </p>
        <p className="text-[10px] text-navy-faint">All value estimates are illustrative.</p>
      </div>
    </div>
  )
}
