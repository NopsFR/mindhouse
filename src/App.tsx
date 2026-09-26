import { AnimatePresence } from 'motion/react'
import { useFacilityStore } from './state/store'
import { Intro } from './components/Intro'
import { Building } from './world/Building'
import { CentralChamber } from './rooms/CentralChamber'
import { MancyRoom } from './rooms/MancyRoom'
import { NullRoom } from './rooms/NullRoom'
import { AtlasRoom } from './rooms/AtlasRoom'
import { OrbitRoom } from './rooms/OrbitRoom'

export default function App() {
  const view = useFacilityStore((s) => s.view)

  return (
    <div className="grain relative h-full w-full">
      <div className="vignette" />
      <AnimatePresence mode="wait">
        {view === 'intro' && <Intro key="intro" />}
        {view === 'facility' && <Building key="facility" />}
        {view === 'jarvis' && <CentralChamber key="jarvis" />}
        {view === 'mancy' && <MancyRoom key="mancy" />}
        {view === 'null' && <NullRoom key="null" />}
        {view === 'atlas' && <AtlasRoom key="atlas" />}
        {view === 'orbit' && <OrbitRoom key="orbit" />}
      </AnimatePresence>
    </div>
  )
}
