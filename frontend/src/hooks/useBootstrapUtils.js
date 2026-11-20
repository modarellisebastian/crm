import { useEffect } from 'react'
import { Tooltip, Popover } from 'bootstrap'

const useBootstrapUtils = (pathName) => {
  useEffect(() => {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    tooltipTriggerList.forEach(el => new Tooltip(el))

    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    popoverTriggerList.forEach(el => new Popover(el))

    const handleResize = () => {
      const w = window.innerWidth
      if (w <= 1024) {
        document.documentElement.classList.remove('minimenu')
      } else if (w <= 1400) {
        document.documentElement.classList.add('minimenu')
      } else {
        document.documentElement.classList.remove('minimenu')
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [pathName])
}

export default useBootstrapUtils
