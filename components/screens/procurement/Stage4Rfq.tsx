"use client"

/**
 * Stage 4. The RFQ branch, as a first class path.
 *
 * Five steps as a horizontal progression with the current one expanded. The ranking
 * gates on feasibility before it looks at price, so the cheapest response loses when
 * it cannot arrive in time, and it says so on the row.
 */

import { useState } from "react"
import { SYSTEM_LABEL } from "@/data/nomenclature"
import {
  AWARD_JUSTIFICATION_PROMPT,
  RANKING_NOTE,
  RFQ_CHANNEL,
  RANKING_WEIGHTS,
  RFQ_STEPS,
} from "@/data/procurement-content"
import type { QuoteAnalysis, RankedQuote, Recommendation } from "@/lib/procurement"
import { Traced } from "@/components/lineage/Traced"
import { compactMoney, int, money, shortDate } from "@/lib/format"

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline/70 py-1 text-[11px] last:border-b-0">
      <span className="text-navy-muted">{label}</span>
      <span className="mono text-navy">{value}</span>
    </div>
  )
}

export function Stage4Rfq({
  recommendation,
  analysis,
  awarded,
  onAward,
}: {
  recommendation: Recommendation
  analysis: QuoteAnalysis
  awarded: { supplierId: string; justification: string } | null
  onAward: (supplierId: string, justification: string) => void
}) {
  const [step, setStep] = useState(1)
  const [choice, setChoice] = useState<string | null>(null)
  const [justification, setJustification] = useState("")

  const { set, ranked, quantity } = analysis
  const responded = ranked.filter((q) => q.quoted)
  const topRanked = ranked.find((q) => q.rank === 1) ?? null
  const cheapest = responded.reduce<RankedQuote | null>(
    (low, q) => (low === null || q.unitPrice < low.unitPrice ? q : low),
    null
  )
  const selected = ranked.find((q) => q.supplierId === choice) ?? null
  const needsJustification = Boolean(selected && selected.rank !== 1)
  const canAward = Boolean(selected && (!needsJustification || justification.trim().length > 8))
  const awardedQuote = awarded ? ranked.find((q) => q.supplierId === awarded.supplierId) : null

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/* Horizontal progression */}
      <ol className="flex items-center gap-1">
        {RFQ_STEPS.map((s, i) => {
          const active = s.n === step
          const done = s.n < step
          return (
            <li key={s.n} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStep(s.n)}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[10.5px] transition-colors ${
                  active
                    ? "border-cyan bg-cyan text-white"
                    : done
                      ? "border-cyan-line bg-cyan-soft text-navy"
                      : "border-hairline bg-surface text-navy-muted hover:border-cyan-line"
                }`}
              >
                <span className="mono">{s.n}</span>
                <span className={active ? "" : "hidden xl:inline"}>{active ? s.label : s.short}</span>
              </button>
              {i < RFQ_STEPS.length - 1 && <span className="text-[10px] text-navy-faint">›</span>}
            </li>
          )
        })}
      </ol>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-hairline bg-surface px-3 py-2">
        {step === 1 && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">
                Request created from the recommendation
              </p>
              <Row label="Part" value={recommendation.part.partNumber} />
              <Row label="Quantity" value={int(quantity)} />
              <Row label="Unit of measure" value={recommendation.part.unitOfMeasure ?? "not set"} />
              <Row label="Need by date" value={shortDate(recommendation.signal.predictedNeedOn)} />
              <Row label="Response deadline" value={shortDate(set.responseDeadline)} />
              <Row label="Estimated value" value={compactMoney(recommendation.lineValue)} />
            </div>
            <p className="self-start rounded border border-hairline bg-canvas px-2.5 py-2 text-[10.5px] leading-snug text-navy-muted">
              The request carries the same numbers the requisition would have carried. Both
              paths start from one recommendation, so a negotiation never means starting the
              analysis again.
            </p>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">
              Issued through {RFQ_CHANNEL} on{" "}
              <span className="mono normal-case text-navy-muted">{shortDate(set.issuedOn)}</span>
            </p>
            <ul className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ranked.map((quote) => (
                <li
                  key={quote.supplierId}
                  className="flex items-center justify-between gap-2 rounded border border-hairline bg-canvas px-2 py-1 text-[10.5px]"
                >
                  <span className="truncate text-navy">{quote.supplierName}</span>
                  <span className="mono shrink-0 text-navy-faint">{quote.supplierId}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10.5px] text-navy-muted">
              <span className="mono text-navy">{ranked.length}</span> suppliers invited,{" "}
              <span className="mono text-navy">{responded.length}</span> responded before the deadline.
            </p>
          </div>
        )}

        {step === 3 && (
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b border-hairline text-[9px] font-semibold uppercase tracking-wide text-navy-faint">
                <th className="py-1 text-left">Supplier</th>
                <th className="py-1 text-right">Unit price</th>
                <th className="py-1 text-right">Total</th>
                <th className="py-1 text-right">Lead offered</th>
                <th className="py-1 text-left">Terms</th>
                <th className="py-1 text-left">Responded</th>
                <th className="py-1 text-left">Declined</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((quote) => (
                <tr key={quote.supplierId} className="border-b border-hairline/70 last:border-b-0">
                  <td className="max-w-[164px] truncate py-1 text-navy">{quote.supplierName}</td>
                  <td className="mono py-1 text-right text-navy">
                    {quote.quoted ? money(quote.unitPrice, 2) : "—"}
                  </td>
                  <td className="mono py-1 text-right text-navy-muted">
                    {quote.quoted ? compactMoney(quote.total) : "—"}
                  </td>
                  <td
                    className={`mono py-1 text-right ${
                      quote.quoted && !quote.feasible ? "font-semibold text-blocked" : "text-navy-muted"
                    }`}
                  >
                    {quote.quoted ? `${quote.leadTimeDaysOffered}d` : "—"}
                  </td>
                  <td className="mono py-1 text-navy-muted">{quote.quoted ? quote.paymentTerms : "—"}</td>
                  <td className="mono py-1 text-navy-faint">{shortDate(quote.respondedOn)}</td>
                  <td className="py-1 text-navy-muted">
                    {quote.quoted
                      ? quote.declinedLines > 0
                        ? `${quote.declinedLines} line`
                        : "none"
                      : "all lines"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {step === 4 && (
          <div>
            <p className="rounded border border-attention/40 bg-attention-soft px-2.5 py-1.5 text-[10.5px] leading-snug text-attention">
              {RANKING_NOTE}
            </p>
            <p className="mt-1.5 text-[9.5px] text-navy-faint">
              Weights · price <span className="mono">{RANKING_WEIGHTS.price}</span> · delivery record{" "}
              <span className="mono">{RANKING_WEIGHTS.delivery}</span> · quality{" "}
              <span className="mono">{RANKING_WEIGHTS.quality}</span> · terms{" "}
              <span className="mono">{RANKING_WEIGHTS.terms}</span>
            </p>

            <table className="mt-1.5 w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="border-b border-hairline text-[9px] font-semibold uppercase tracking-wide text-navy-faint">
                  <th className="py-1 text-left">Rank</th>
                  <th className="py-1 text-left">Supplier</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Deliv</th>
                  <th className="py-1 text-right">Qual</th>
                  <th className="py-1 text-right">Terms</th>
                  <th className="py-1 text-right">Score</th>
                  <th className="py-1 text-left">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((quote) => {
                  const isCheapest = cheapest?.supplierId === quote.supplierId
                  return (
                    <tr
                      key={quote.supplierId}
                      className={`border-b border-hairline/70 last:border-b-0 ${
                        quote.rank === 1 ? "bg-healthy-soft/60" : !quote.feasible && quote.quoted ? "bg-blocked-soft/40" : ""
                      }`}
                    >
                      <td className="mono py-1 text-navy">{quote.rank ?? "—"}</td>
                      <td className="max-w-[150px] truncate py-1 text-navy">
                        {quote.supplierName}
                        {isCheapest && (
                          <span className="ml-1.5 rounded border border-hairline bg-canvas px-1 text-[8.5px] text-navy-muted">
                            cheapest
                          </span>
                        )}
                      </td>
                      <td className="mono py-1 text-right text-navy-muted">{quote.priceScore}</td>
                      <td className="mono py-1 text-right text-navy-muted">{quote.deliveryScore}</td>
                      <td className="mono py-1 text-right text-navy-muted">{quote.qualityScore}</td>
                      <td className="mono py-1 text-right text-navy-muted">{quote.termsScore}</td>
                      <td className="mono py-1 text-right font-medium text-navy">{quote.totalScore}</td>
                      <td
                        className={`py-1 ${quote.exclusionReason ? "text-blocked" : "text-healthy"}`}
                      >
                        {quote.exclusionReason ?? "Eligible"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {analysis.cheapestIsInfeasible && cheapest && (
              <p className="mt-2 rounded border border-blocked/30 bg-blocked-soft px-2.5 py-1.5 text-[10.5px] leading-snug text-blocked">
                <span className="font-semibold">{cheapest.supplierName}</span> is the cheapest response at{" "}
                <span className="mono">{money(cheapest.unitPrice, 2)}</span> and scores{" "}
                <span className="mono">{cheapest.totalScore}</span>, higher than any eligible response. It
                loses because it offers <span className="mono">{cheapest.leadTimeDaysOffered}</span> days
                against a need in <span className="mono">{set.daysUntilNeed}</span>. Buying it would save
                money and stop the asset.
              </p>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="grid grid-cols-[1fr_248px] gap-4">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">
                Human award decision
              </p>
              <ul className="mt-1.5 space-y-1">
                {ranked.map((quote) => {
                  const disabled = !quote.quoted
                  return (
                    <li key={quote.supplierId}>
                      <button
                        type="button"
                        disabled={disabled || Boolean(awarded)}
                        onClick={() => setChoice(quote.supplierId)}
                        className={`flex w-full items-center justify-between gap-2 rounded border px-2 py-1 text-left text-[10.5px] transition-colors ${
                          awardedQuote?.supplierId === quote.supplierId
                            ? "border-healthy bg-healthy-soft"
                            : choice === quote.supplierId
                              ? "border-cyan bg-cyan-soft"
                              : disabled
                                ? "cursor-not-allowed border-hairline bg-canvas opacity-50"
                                : "border-hairline bg-surface hover:border-cyan-line"
                        }`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="mono w-4 shrink-0 text-navy-faint">{quote.rank ?? "—"}</span>
                          <span className="truncate text-navy">{quote.supplierName}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="mono text-navy-muted">{money(quote.unitPrice, 2)}</span>
                          <span className="mono text-navy-faint">{quote.leadTimeDaysOffered}d</span>
                          {!quote.feasible && quote.quoted && (
                            <span className="rounded border border-blocked/30 bg-blocked-soft px-1 text-[8.5px] text-blocked">
                              too slow
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>

              {needsJustification && !awarded && (
                <div className="mt-2">
                  <p className="text-[10.5px] text-attention">{AWARD_JUSTIFICATION_PROMPT}</p>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={2}
                    placeholder="Why this supplier rather than the top ranked response"
                    className="mt-1 w-full rounded border border-attention/40 bg-attention-soft/40 px-2 py-1 text-[10.5px] text-navy placeholder:text-navy-faint"
                  />
                </div>
              )}

              {!awarded && (
                <button
                  type="button"
                  disabled={!canAward}
                  onClick={() => selected && onAward(selected.supplierId, justification.trim())}
                  className={`mt-2 rounded px-3 py-1.5 text-[11px] font-medium transition-colors ${
                    canAward
                      ? "bg-navy text-white hover:bg-[#163a5e]"
                      : "cursor-not-allowed bg-canvas text-navy-faint ring-1 ring-inset ring-hairline"
                  }`}
                >
                  Record award
                </button>
              )}
            </div>

            <aside className="rounded border border-hairline bg-canvas px-2.5 py-2">
              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">
                What the award would create
              </p>
              {awardedQuote ? (
                <>
                  <p className="mt-1 text-[10.5px] leading-snug text-navy">
                    Awarded to <span className="font-medium">{awardedQuote.supplierName}</span> at{" "}
                    <span className="mono">{money(awardedQuote.unitPrice, 2)}</span>.
                  </p>
                  {awarded?.justification && (
                    <p className="mt-1 rounded border border-attention/30 bg-attention-soft px-2 py-1 text-[10px] leading-snug text-attention">
                      {awarded.justification}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-[10.5px] leading-snug text-navy-muted">
                  Select a response to see what it would create.
                </p>
              )}

              <ul className="mt-2 space-y-1 text-[10px] leading-snug text-navy-muted">
                <li>
                  A standard purchase order in{" "}
                  <span className="text-navy">{SYSTEM_LABEL.ORACLE_EBS}</span>, referencing the winning
                  quotation, created <span className="font-medium text-navy">unapproved</span>.
                </li>
                <li>The award decision and its justification written to the audit trail.</li>
                <li>The signal on the planner board closed against this award.</li>
                <li>
                  No change in <span className="text-navy">{SYSTEM_LABEL.TEAMCENTER}</span>.
                </li>
              </ul>
              <p className="mt-2 rounded border border-attention/30 bg-attention-soft px-2 py-1 text-[9.5px] leading-snug text-attention">
                The order is still unapproved. Approval happens in the source system, by a person.
              </p>
            </aside>
          </div>
        )}
      </div>

      <p className="text-[10px] text-navy-faint">
        Quotation data is illustrative and seeded.{" "}
        <Traced sourceKey="RFQ.QUOTATION" label="Quotation ranking" tag="inline" detail="layer">
          <span>Ranking reads the supplier performance mart.</span>
        </Traced>
      </p>
    </div>
  )
}
