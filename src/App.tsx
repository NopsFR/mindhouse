import { useEffect } from 'react'
import { AnimatePresence, LayoutGroup } from 'motion/react'
import { useFacilityStore } from './state/store'
import { Intro } from './components/Intro'
import { Facility } from './world/Facility'
import { CentralChamber } from './rooms/CentralChamber'
import { MancyRoom } from './rooms/MancyRoom'
import { NullRoom } from './rooms/NullRoom'
import { AtlasRoom } from './rooms/AtlasRoom'
import { OrbitRoom } from './rooms/OrbitRoom'

export default function App() {
  const view = useFacilityStore((s) => s.view)
  const checkDevTools = useFacilityStore((s) => s.checkDevTools)

  // Harmless everywhere: on the deployed static site this endpoint doesn't exist and the check
  // just resolves to "unavailable" — see devtools/client.ts and vite-plugins/devTools.ts.
  useEffect(() => {
    void checkDevTools()
  }, [checkDevTools])

  return (
    <div className="grain relative h-full w-full">
      <div className="vignette" />
      <LayoutGroup>
        <AnimatePresence>
          {view === 'intro' && <Intro key="intro" />}
          {view === 'facility' && <Facility key="facility" />}
          {view === 'jarvis' && <CentralChamber key="jarvis" />}
          {view === 'mancy' && <MancyRoom key="mancy" />}
          {view === 'null' && <NullRoom key="null" />}
          {view === 'atlas' && <AtlasRoom key="atlas" />}
          {view === 'orbit' && <OrbitRoom key="orbit" />}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  )
}
