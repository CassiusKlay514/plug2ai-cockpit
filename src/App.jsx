import { useState } from 'react'
import Header from './components/Header.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CFO from './pages/CFO.jsx'

export default function App() {
  const [page, setPage] = useState('crm')

  return (
    <div className="min-h-screen text-ink">
      <Header currentPage={page} onNavigate={setPage} />
      {page === 'crm' && <Dashboard />}
      {page === 'cfo' && <CFO />}
    </div>
  )
}
