import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
// import './sidebar.css'


import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  // CSidebarToggler,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'

import logo from './../assets/brand/tipic.webp'
import { useTranslation } from 'react-i18next'

// sidebar nav config
import fetchNavItems from '../_nav'

// import the CSS for scrollbar styling
import '../components/SidebarStyles.css'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const [navigation, setNavigation] = useState([])
  const { t } = useTranslation("global")

  useEffect(() => {
    const navItems = fetchNavItems(t)
    setNavigation(navItems)
  }, [t])

  return (
    <CSidebar
      className="border-end no-print custom-scrollbar"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >

      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/" className="ms-5">
          {unfoldable ? (
            <img src={logo} height={50} width={50} alt="logo" />
          ) : (
            <img src={logo} height={50} width={90} alt="logo" />
          )}
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>

      <AppSidebarNav items={navigation} />

      <CSidebarFooter className="border-top d-none d-lg-flex">
        {/* <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        /> */}
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
