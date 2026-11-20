import { Fragment, useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import PerfectScrollbar from 'react-perfect-scrollbar'
import 'react-perfect-scrollbar/dist/css/styles.css'
import { FiHome, FiUsers, FiList, FiSearch, FiBarChart2, FiDollarSign, FiFileText } from 'react-icons/fi'
import { NavigationContext } from '../../context/NavigationProvider'

const menuItems = [
  {
    section: 'Principal',
    items: [
      { label: 'Dashboard',     path: '/',         icon: <FiHome /> },
      { label: 'Leads',         path: '/leads',    icon: <FiList /> },
      { label: 'Clientes',      path: '/clientes', icon: <FiUsers /> },
    ],
  },
  {
    section: 'Herramientas',
    items: [
      { label: 'Scraper',       path: '/scraper',  icon: <FiSearch /> },
      { label: 'Reportes',      path: '/reportes',   icon: <FiBarChart2 /> },
      { label: 'Propuestas',    path: '/propuestas', icon: <FiFileText /> },
    ],
  },
  {
    section: 'Casa',
    items: [
      { label: 'Finanzas Casa', path: '/casa',     icon: <FiDollarSign /> },
    ],
  },
]

export default function Sidebar() {
  const { navigationOpen, setNavigationOpen } = useContext(NavigationContext)
  const { pathname } = useLocation()

  return (
    <nav className={`nxl-navigation ${navigationOpen ? 'mob-navigation-active' : ''}`}>
      <div className="navbar-wrapper">
        <div className="m-header">
          <Link to="/" className="b-brand">
            <img src="/Logo_Axano_Negro.svg" alt="Axano" className="logo logo-lg" style={{ height: 28, width: 'auto' }} />
            <img src="/Iso_Axano_Negro.svg"  alt="Axano" className="logo logo-sm" style={{ height: 28, width: 'auto' }} />
          </Link>
        </div>

        <div className="navbar-content">
          <PerfectScrollbar>
            <ul className="nxl-navbar">
              {menuItems.map(({ section, items }) => (
                <Fragment key={section}>
                  <li className="nxl-item nxl-caption">
                    <label>{section}</label>
                  </li>
                  {items.map(({ label, path, icon }) => (
                    <li key={path} className={`nxl-item ${pathname === path ? 'active' : ''}`}>
                      <Link to={path} className="nxl-link">
                        <span className="nxl-micon">{icon}</span>
                        <span className="nxl-mtext">{label}</span>
                      </Link>
                    </li>
                  ))}
                </Fragment>
              ))}
            </ul>
          </PerfectScrollbar>
        </div>
      </div>
      <div
        onClick={() => setNavigationOpen(false)}
        className={navigationOpen ? 'nxl-menu-overlay' : ''}
      />
    </nav>
  )
}
