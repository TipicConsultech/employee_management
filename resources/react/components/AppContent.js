import React, { Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

// routes config
import fetchRoutes from '../routes'

const AppContent = () => {
  const [routes, setRoutes] = useState([])

  useEffect(() => {
    const allRoutes = fetchRoutes();
    setRoutes(allRoutes)
  }, [])

  // Add mobile content padding styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Mobile - add padding for fixed header plus extra space */
      @media (max-width: 768px) {
        .app-content-wrapper {
          padding-top: 80px !important; /* Increased from 60px to 80px for more space */
        }
      }
      
     
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  return (
    <div className="app-content-wrapper">
      <CContainer lg>
        <Suspense fallback={<CSpinner color="primary" />}>
          <Routes>
            {routes.map((route, idx) => {
              return (
                route.element && (
                  <Route
                    key={idx}
                    path={route.path}
                    exact={route.exact}
                    name={route.name}
                    element={<route.element />}
                  />
                )
              )
            })}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </CContainer>
    </div>
  )
}

export default React.memo(AppContent)