import { useLocation, Outlet } from 'react-router-dom'
import Header from './layout/Header'
import Sidebar from './layout/Sidebar'
import useBootstrapUtils from '../hooks/useBootstrapUtils'

function Layout() {
  const { pathname } = useLocation()
  useBootstrapUtils(pathname)

  return (
    <>
      <Header />
      <Sidebar />
      <main className="nxl-container">
        <div className="nxl-content">
          <div className="main-content">
            <Outlet />
          </div>
        </div>
      </main>
    </>
  )
}

export default Layout
