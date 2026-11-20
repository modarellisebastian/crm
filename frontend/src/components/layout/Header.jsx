import { useContext, useRef, useState } from 'react'
import { FiMenu, FiMoon, FiSun, FiMaximize, FiLogOut, FiUser } from 'react-icons/fi'
import { NavigationContext } from '../../context/NavigationProvider'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { setNavigationOpen } = useContext(NavigationContext)
  const navigate = useNavigate()
  const isDark = useRef(localStorage.getItem('skinTheme') === 'dark')
  const [dark, setDark] = useState(isDark.current)

  function toggleTheme() {
    const next = !isDark.current
    isDark.current = next
    setDark(next)
    document.documentElement.classList.toggle('app-skin-dark', next)
    localStorage.setItem('skinTheme', next ? 'dark' : 'light')
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen()
    else document.exitFullscreen()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  // Reset común para todos los botones del header
  const btn = { border: 'none', background: 'transparent', cursor: 'pointer' }

  return (
    <header className="nxl-header">
      <div className="header-wrapper">

        {/* Izquierda: toggle sidebar */}
        <div className="nxl-h-item">
          <button
            className="nxl-head-link ms-1"
            style={btn}
            onClick={() => {
              if (window.innerWidth < 992) {
                setNavigationOpen(prev => !prev)
              } else {
                document.documentElement.classList.toggle('minimenu')
              }
            }}
            title="Menu"
          >
            <FiMenu size={20} />
          </button>
        </div>

        {/* Derecha: acciones */}
        <div className="nxl-h-item ms-auto d-flex align-items-center">
          <button className="nxl-head-link" style={btn} onClick={toggleTheme} title="Cambiar tema">
            {dark ? <FiSun size={18} /> : <FiMoon size={18} />}
          </button>
          <button className="nxl-head-link" style={btn} onClick={toggleFullscreen} title="Pantalla completa">
            <FiMaximize size={18} />
          </button>
          <span className="vr mx-2 my-3" />
          <button className="nxl-head-link" style={btn} onClick={handleLogout} title="Cerrar sesion">
            <FiLogOut size={18} />
          </button>
          <div className="ms-2 d-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"
            style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
            S
          </div>
        </div>

      </div>
    </header>
  )
}
