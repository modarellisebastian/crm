import { createContext, useState } from 'react'

export const NavigationContext = createContext()

const NavigationProvider = ({ children }) => {
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [navigationExpend, setNavigationExpend] = useState(false)

  return (
    <NavigationContext.Provider value={{ navigationOpen, setNavigationOpen, navigationExpend, setNavigationExpend }}>
      {children}
    </NavigationContext.Provider>
  )
}

export default NavigationProvider
