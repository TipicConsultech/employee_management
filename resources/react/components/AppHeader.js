import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector, useDispatch } from 'react-redux'
import {
  CContainer,
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CHeader,
  CHeaderNav,
  CHeaderToggler,
  CNavLink,
  CNavItem,
  useColorModes,
  CBreadcrumbItem,
  CBreadcrumb,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilContrast,
  cilEnvelopeOpen,
  cilLanguage,
  cilList,
  cilMenu,
  cilMoon,
  cilSun,
} from '@coreui/icons'

import { AppBreadcrumb } from './index'
import { AppHeaderDropdown } from './header/index'
import AppHeaderHelp from './header/AppHeaderHelp'
import getRoutes from '../routes'
import { useLocation } from 'react-router-dom'

const AppHeader = () => {
  const headerRef = useRef()
  const { t, i18n } = useTranslation("global");


  const dispatch = useDispatch()
  const sidebarShow = useSelector((state) => state.sidebarShow)

  const handleChange = (langLocal) => {
    i18n.changeLanguage(langLocal);
    localStorage.setItem('languageLocal',langLocal);
  };

  useEffect(() => {
    document.addEventListener('scroll', () => {
      headerRef.current &&
        headerRef.current.classList.toggle('shadow-sm', document.documentElement.scrollTop > 0)
    })
    i18n.changeLanguage(localStorage.getItem('languageLocal') ?? 'en')
  }, [])

    const currentLocation = useLocation().pathname
    const [routes, setRoutes] = useState([])
    useEffect(()=>{
      const allRoutes = getRoutes();
      setRoutes(allRoutes)
    },[])
  
    const getRouteName = (pathname, routes) => {
      const currentRoute = routes.find((route) => route.path === pathname)
      return currentRoute ? currentRoute.name : false
    }
  
    const getBreadcrumbs = (location) => {
      const breadcrumbs = []
      location.split('/').reduce((prev, curr, index, array) => {
        const currentPathname = `${prev}/${curr}`
        const routeName = getRouteName(currentPathname, routes)
        routeName &&
          breadcrumbs.push({
            pathname: currentPathname,
            name: routeName,
            active: index + 1 === array.length ? true : false,
          })
        return currentPathname
      })
      return breadcrumbs
    }
  
    const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <div className='no-print'>
      <CHeader position="sticky" className="mb-2 p-0 " ref={headerRef}>
        <CContainer className="border-bottom px-4" fluid>
          <CHeaderToggler
            onClick={() => dispatch({ type: 'set', sidebarShow: !sidebarShow })}
            style={{ marginInlineStart: '-14px' }}
          >
            <CIcon icon={cilMenu} size="lg" />
          </CHeaderToggler>
          <CHeaderNav className="d-md-flex">
             <CBreadcrumb className="my-0 ">
                 {/* <CBreadcrumbItem href="/#/dashboard">Home</CBreadcrumbItem> */}
                 {breadcrumbs.map((breadcrumb, index) => {
                   return (
                     <CBreadcrumbItem
                       {...(breadcrumb.active ? { active: true } : { href: breadcrumb.pathname })}
                       key={index}
                     >
                       {breadcrumb.name}
                     </CBreadcrumbItem>
                   )
                 })}
               </CBreadcrumb>
            {/* <CNavItem>
              <CNavLink href="#/booking">{t("LABELS.booking")}</CNavLink>
            </CNavItem> */}
            {/* <CNavItem>
              <CNavLink href="#/Reports/Customer_Report">Report</CNavLink>
            </CNavItem> */}
          </CHeaderNav>
          <CHeaderNav className="ms-auto">
          <CHeaderNav>
        
        </CHeaderNav>
            {/* <CNavItem>
              <CNavLink href="#">
                <CIcon icon={cilBell} size="lg" />
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink href="#">
                <CIcon icon={cilList} size="lg" />
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink href="#">
                <CIcon icon={cilEnvelopeOpen} size="lg" />
              </CNavLink>
            </CNavItem> */}
          </CHeaderNav>
          <CHeaderNav>
            <li className="nav-item py-1">
              <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
            </li>
            <CDropdown variant="nav-item" placement="bottom-end">
              <CDropdownToggle caret={false}>
                <CIcon icon={cilLanguage} size="lg" />
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => handleChange("en")}
                >
                English
                </CDropdownItem>
                <CDropdownItem
                  className="d-flex align-items-center"
                  as="button"
                  type="button"
                  onClick={() => handleChange("mr")}
                >
                मराठी
                </CDropdownItem>
              
              </CDropdownMenu>
            </CDropdown>
            <li className="nav-item py-1">
              <div className="vr h-100 mx-2 text-body text-opacity-75"></div>
            </li>
            <AppHeaderDropdown />
          </CHeaderNav>
        </CContainer>
        {/* <CContainer className="px-4" fluid>
          <AppBreadcrumb />
        </CContainer> */}
      </CHeader>
    </div>
  )
}

export default AppHeader
