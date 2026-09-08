"use client"

import type { ReactNode } from "react"
import { DataViewProvider, useDataView } from "@/context/DataViewContext"
import { SessionProvider } from "@/context/SessionContext"
import { TopBar } from "@/components/TopBar"
import { LeftNav } from "@/components/LeftNav"
import { NextControl } from "@/components/NextControl"
import { IllustrativeDataBadge } from "@/components/IllustrativeDataBadge"
import { LineagePanel } from "@/components/lineage/LineagePanel"

/**
 * The frame every screen renders inside. Nav, top bar, next control, the always on
 * illustrative data badge and the lineage panel are all mounted once, here.
 *
 * When the lineage panel opens the content gives way to it rather than sitting
 * underneath it, so a presenter never loses the value they just clicked.
 */
function ShellBody({ children }: { children: ReactNode }) {
  const { activeKey, isDataView } = useDataView()
  const panelOpen = isDataView && activeKey !== null

  return (
    <>
      <TopBar />
      <LeftNav />
      <main
        className={`ml-nav min-h-screen pb-20 pt-14 transition-[margin] duration-150 ${
          panelOpen ? "mr-panel" : ""
        }`}
      >
        <div className="mx-auto max-w-[1120px] px-8 py-6">{children}</div>
      </main>
      <LineagePanel />
      <NextControl panelOpen={panelOpen} />
      <IllustrativeDataBadge />
    </>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <DataViewProvider>
      <SessionProvider>
        <ShellBody>{children}</ShellBody>
      </SessionProvider>
    </DataViewProvider>
  )
}
