import { useState } from 'react'
import Header from './components/Header.jsx'
import Home from './pages/Home.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CFO from './pages/CFO.jsx'
import CMO from './pages/CMO.jsx'
import COO from './pages/COO.jsx'
import CTO from './pages/CTO.jsx'
import Agenda from './pages/Agenda.jsx'
import CEO from './pages/CEO.jsx'
import Veille from './pages/Veille.jsx'
import Connaissance from './pages/Connaissance.jsx'

export default function App() {
  const [page, setPage] = useState('home')

  return (
    <div className="min-h-screen text-ink">
      <Header currentPage={page} onNavigate={setPage} />
      {page === 'home'    && <Home onNavigate={setPage} />}
      {page === 'crm'     && <Dashboard />}
      {page === 'cfo'     && <CFO />}
      {page === 'cmo'     && <CMO />}
      {page === 'coo'     && <COO />}
      {page === 'cto'     && <CTO />}
      {page === 'agenda'  && <Agenda />}
      {page === 'ceo'     && <CEO />}
      {page === 'veille'  && <Veille />}
      {page === 'kb'      && <Connaissance />}
    </div>
  )
}
