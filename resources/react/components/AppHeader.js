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
  CBreadcrumb,
  CBreadcrumbItem,
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
import { useLocation } from 'react-router-dom'
import getRoutes from '../routes'

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

    // Add mobile-only fixed header styles
    const style = document.createElement('style');
    style.textContent = `
      /* Desktop - keep default sticky behavior */
      @media (min-width: 769px) {
        .app-header {
          position: sticky !important;
          top: 0 !important;
          z-index: 1030 !important;
          background-color: var(--cui-header-bg, #fff) !important;
          border-bottom: 1px solid var(--cui-border-color, #dee2e6) !important;
        }
      }
      
      /* Mobile - fixed header that always goes behind sidebar */
      @media (max-width: 768px) {
        .app-header {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          z-index: 1030 !important;
          background-color: var(--cui-header-bg, #fff) !important;
          border-bottom: 1px solid var(--cui-border-color, #dee2e6) !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
        }
        
        /* Ensure content doesn't overlap with fixed header on mobile */
        .app-content-wrapper {
          padding-top: 60px !important;
        }
        
        /* Ensure sidebar is always above header */
        .sidebar {
          z-index: 1050 !important;
        }
        
        /* Sidebar backdrop should also be above header */
        .sidebar-backdrop {
          z-index: 1045 !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      // Cleanup function to remove style when component unmounts
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
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
      <CHeader 
        className="mb-2 p-0 app-header"
        ref={headerRef}
      >
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
              <CNavLink href="#/invoice">{t("LABELS.invoice")}</CNavLink>
            </CNavItem> */}
            {/* <CNavItem>
              <CNavLink href="#/delivery">{t("LABELS.delivery")}</CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink href="#/booking">{t("LABELS.booking")}</CNavLink>
            </CNavItem> */}
            {/* <CNavItem>
              <CNavLink href="#/Reports/Customer_Report">Report</CNavLink>
            </CNavItem> */}
          </CHeaderNav>
          
          <CHeaderNav className="ms-auto">
            {/* <CHeaderNav>
              <AppHeaderHelp />
            </CHeaderNav> */}
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
      </CHeader>
    </div>
  )
}

export default AppHeader