"use client"

/**
 * Stage 2. What to buy, how much, when by, from whom, at what price, and why.
 *
 * The reasoning is a list rather than a paragraph, because a buyer needs to see which
 * input produced which number and argue with the one they disagree with.
 */

import type { Recommendation } from "@/lib/procurement"
import { Traced } from "@/components/lineage/Traced"
import { compactMoney, money, shortDate } from "@/lib/format"

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded border border-hairline bg-surface px-2.5 py-1.5">
      <p className="text-[9.5px] font-semibold uppercase tracking-wide text-navy-faint">{title}</p>
      <div className="mt-1">{children}</div>
    </section>
  )
}

export function Stage2Recommendation({ recommendation }: { recommendation: Recommendation }) {
  const { signal, part, quantity, suppliers, costOfInaction } = recommendation
  const late = recommendation.daysOfSlack < 0

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-y-auto pr-0.5">
      <div className="grid grid-cols-[1fr_268px] gap-2">
        <Block title="What to buy">
          <Traced sourceKey="PART.ORACLE_IDENTITY" label="Part" tag="inline" detail="layer">
            <span className="mono text-[14px] font-medium text-navy">{part.partNumber}</span>
          </Traced>
          <p className="mt-0.5 text-[11px] leading-snug text-navy-muted">{part.description}</p>
        </Block>

        <section className="row-span-3 rounded-card border border-attention/40 bg-attention-soft px-3 py-2">
          <p className="text-[9.5px] font-semibold uppercase tracking-wide text-attention">
            Estimated cost of not acting
          </p>
          <p className="mono mt-1 text-[22px] font-medium leading-none text-attention">
            {compactMoney(costOfInaction.total)}
          </p>
          <dl className="mt-2 space-y-1 text-[10.5px]">
            {[
              ["Expected downtime", `${costOfInaction.downtimeHours} h`],
              ["Downtime cost", compactMoney(costOfInaction.downtimeCost)],
              ["Criticality weighting", `×${costOfInaction.criticalityWeight.toFixed(2)}`],
              ["Expedite premium", compactMoney(costOfInaction.expeditePremium)],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-2">
                <dt className="text-attention/80">{label}</dt>
                <dd className="mono text-attention">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-[9.5px] leading-snug text-attention/80">
            Illustrative rates, to be set with the manufacturer's own downtime costing before
            anyone relies on this number.
          </p>
          <p className="mono mt-2 border-t border-attention/30 pt-1.5 text-[10px] text-attention/80">
            {signal.signalId}
          </p>
        </section>

        <div className="col-start-1 grid grid-cols-2 gap-2">
          <Block title="How much">
            <dl className="space-y-0.5 text-[10.5px]">
              {[
                ["Annual usage", `${quantity.annualDemand}`],
                ["Economic order quantity", `${quantity.economicOrderQty}`],
                ["Minimum order quantity", quantity.minimumOrderQty === null ? "not set" : `${quantity.minimumOrderQty}`],
                ["Order multiple", quantity.orderMultiple === null ? "not set" : `${quantity.orderMultiple}`],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-navy-muted">{label}</dt>
                  <dd className="mono text-navy">{value}</dd>
                </div>
              ))}
              <div className="mt-1 flex items-baseline justify-between gap-2 border-t border-hairline pt-1">
                <dt className="text-[11px] font-medium text-navy">Rounded quantity</dt>
                <dd className="mono text-[15px] font-medium text-cyan">{quantity.roundedQty}</dd>
              </div>
            </dl>
          </Block>

          <Block title="When to order by">
            <p className={`mono text-[15px] font-medium ${late ? "text-blocked" : "text-navy"}`}>
              {shortDate(recommendation.orderByOn)}
            </p>
            <p className="mt-0.5 text-[10.5px] leading-snug text-navy-muted">
              Need date <span className="mono">{shortDate(signal.predictedNeedOn)}</span> less a{" "}
              <span className="mono">{signal.leadTimeDays}</span> day lead time.
            </p>
            <p className={`mt-1 text-[11px] font-medium ${late ? "text-blocked" : "text-healthy"}`}>
              {late
                ? `${Math.abs(recommendation.daysOfSlack)} days past the order by date`
                : `${recommendation.daysOfSlack} days of slack`}
            </p>
          </Block>
        </div>

        <div className="col-start-1">
          <Block title="At what price">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Traced sourceKey="PO.LINE" label="Line price" tag="inline" detail="layer">
                <span className="mono text-[15px] font-medium text-navy">
                  {money(recommendation.effectivePrice, 2)}
                </span>
              </Traced>
              <span
                className={`rounded border px-1.5 py-px text-[9.5px] font-semibold uppercase ${
                  recommendation.priceBasis === "CONTRACT"
                    ? "border-healthy/40 bg-healthy-soft text-healthy"
                    : "border-attention/40 bg-attention-soft text-attention"
                }`}
              >
                {recommendation.priceBasis === "CONTRACT" ? "contract price" : "last paid, no agreement"}
              </span>
              <span className="text-[10.5px] text-navy-muted">
                line value <span className="mono text-navy">{compactMoney(recommendation.lineValue)}</span>
              </span>
            </div>
          </Block>
        </div>
      </div>

      <Block title="From whom · approved supplier list">
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="text-[9px] uppercase tracking-wide text-navy-faint">
                <th className="py-0.5 text-left font-semibold">Supplier</th>
                <th className="py-0.5 text-right font-semibold">On time</th>
                <th className="py-0.5 text-right font-semibold">Quality</th>
                <th className="py-0.5 text-right font-semibold">Last paid</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((option) => (
                <tr key={option.supplierId} className="border-t border-hairline/70">
                  <td className="py-0.5">
                    <span className="text-navy">{option.supplierName}</span>
                    <span
                      className={`ml-1.5 rounded border px-1 text-[8.5px] uppercase ${
                        option.role === "PRIMARY"
                          ? "border-cyan bg-cyan-soft text-navy"
                          : "border-hairline bg-canvas text-navy-faint"
                      }`}
                    >
                      {option.role === "PRIMARY" ? "primary" : "alternate"}
                    </span>
                  </td>
                  <td className="mono py-0.5 text-right text-navy-muted">{option.onTimeDeliveryPct}%</td>
                  <td className="mono py-0.5 text-right text-navy-muted">{option.qualityRatePct}%</td>
                  <td className="mono py-0.5 text-right text-navy-muted">
                    {option.lastPricePaid === null ? "—" : money(option.lastPricePaid, 2)}
                    {option.lastPriceBasis === "COMMODITY" && (
                      <span className="ml-1 text-[8.5px] text-navy-faint">commodity</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Block>

      <Block title="Reasoning">
        <ul className="divide-y divide-hairline/70">
          {recommendation.reasoning.map((line) => (
            <li key={line.input} className="grid grid-cols-[140px_216px_1fr] items-baseline gap-3 py-[3px] text-[10.5px] leading-tight">
              <span className="text-navy-muted">{line.input}</span>
              <span className="mono truncate text-navy">{line.value}</span>
              <span className="text-navy-faint">{line.effect}</span>
            </li>
          ))}
        </ul>
      </Block>

    </div>
  )
}
