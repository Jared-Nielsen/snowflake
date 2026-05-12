import { useEffect, useRef } from 'react'
import { CommandBar } from './components/CommandBar'
import { TickerStrip } from './components/TickerStrip'
import { SideNav } from './components/SideNav'
import { StatusBar } from './components/StatusBar'
import { HomeTab } from './components/tabs/HomeTab'
import { MarginTab } from './components/tabs/MarginTab'
import { MaintenanceTab } from './components/tabs/MaintenanceTab'
import { ContractTab } from './components/tabs/ContractTab'
import { TradingTab } from './components/tabs/TradingTab'
import { SustainabilityTab } from './components/tabs/SustainabilityTab'
import { LogisticsTab } from './components/tabs/LogisticsTab'
import { CrossTab } from './components/tabs/CrossTab'
import { useUiStore } from './store/uiStore'
import { useStreamStore } from './store/streamStore'
import type { TabKey } from './types'

const TABS: Record<TabKey, () => JSX.Element> = {
  home: HomeTab,
  margin: MarginTab,
  maintenance: MaintenanceTab,
  contract: ContractTab,
  trading: TradingTab,
  sustainability: SustainabilityTab,
  logistics: LogisticsTab,
  cross: CrossTab,
}

export default function App() {
  const tab = useUiStore(s => s.tab)
  const start = useStreamStore(s => s.start)
  const mainRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    start()
  }, [start])

  // Reset scroll to top whenever the active tab changes — otherwise switching
  // toolkits while scrolled down feels disorienting.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [tab])

  const Active = TABS[tab]

  return (
    <div className="h-screen flex flex-col bg-bg-base relative">
      <CommandBar />
      <TickerStrip />
      <div className="flex flex-1 min-h-0">
        <SideNav />
        <main ref={mainRef} className="flex-1 overflow-auto relative">
          <div className="relative z-10">
            <Active key={tab} />
          </div>
        </main>
      </div>
      <StatusBar />
    </div>
  )
}
