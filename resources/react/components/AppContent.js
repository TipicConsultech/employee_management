import React, { Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'

// routes config
import fetchRoutes from '../routes'
import { getUserData } from '../util/session'

const AppContent = () => {
  //let routes = [];
  const [routes, setRoutes] = useState([])
  useEffect(()=>{
    const allRoutes = fetchRoutes();
    setRoutes(allRoutes)
  },[])

  const userData = getUserData()
    const user = userData?.type
    const attendance_type = userData?.attendance_type

  const getEmployeePath = (type) => {
  switch (type) {
    case 'face_attendance':
       case 'both':
      return '/checkInWithSelfie';

   
    case 'location':
      return '/employee_tracker';

    default:
      return '/employee_tracker'; // fallback if type is unknown or undefined
  }
};

  return (
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
          <Route path="/" element={user==1 ? (<Navigate to="/dashboard" replace />):(<Navigate to={getEmployeePath(attendance_type)} replace />)} />
        </Routes>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
