import type { ReactNode } from "react"

type CardProps = {
  children: ReactNode
  /** Primary cards carry the 3px cyan top bar. It is the only gradient in the build. */
  primary?: boolean
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Card({ children, primary = false, title, subtitle, actions, className = "" }: CardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-card border border-hairline bg-surface shadow-card ${
        primary ? "card-topbar" : ""
      } ${className}`}
    >
      {(title || actions) && (
        <header className={`flex items-start justify-between gap-4 px-6 ${primary ? "pt-6" : "pt-5"} pb-3`}>
          <div>
            {title && <h2 className="text-[15px] font-semibold leading-tight text-navy">{title}</h2>}
            {subtitle && <p className="mt-1 text-[13px] leading-snug text-navy-muted">{subtitle}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      <div className={`px-6 pb-6 ${title || actions ? "" : primary ? "pt-6" : "pt-5"}`}>{children}</div>
    </section>
  )
}
