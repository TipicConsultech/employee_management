import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilFile,
  cilDollar,
  cilPlus,
  cilTruck,
  cilAddressBook,
  cilNotes,
  cilGroup,
  cibElasticStack,
  cibPostgresql,
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'
import { getUserData } from './util/session'

export default function fetchNavItems(t1) {
  const userData = getUserData()
  const user = userData?.type
  const t = t1

  let _nav = []

  /* ─────────── SUPER‑ADMIN ─────────── */
  if (user === 0) {
    _nav = [
      {
        component: CNavGroup,
        name: t('LABELS.company'),
        icon: <CIcon icon={cibElasticStack} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.new_company'),  to: '/company/new' },
          { component: CNavItem, name: t('LABELS.all_companies'), to: '/company/all' },
          { component: CNavItem, name: 'Company Subscription',   to: '/company/companyReceipt' },
        ],
      },
      {
        component: CNavItem,
        name: t('LABELS.plans'),
        to: '/plans',
        icon: <CIcon icon={cibPostgresql} customClassName="nav-icon" />,
      },
      {
        component: CNavGroup,
        name: t('LABELS.user_management'),
        icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.all_Users'),   to: 'usermanagement/all-users' },
          { component: CNavItem, name: t('LABELS.create_user'), to: 'usermanagement/create-user' },
        ],
      },
    ]
  }

  /* ─────────── ADMIN ─────────── */
  else if (user === 1) {
    _nav = [

      {
              component: CNavItem,
              name: t("LABELS.dashboard"),
              to: '/dashboard2',
              icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: t("LABELS.docs_verification"),
        to: '/Document_verification',
        icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      },
      {
              component: CNavItem,
              name: t("LABELS.credit_screen"),
              to: '/credit_screen',
              icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      },
      {
              component: CNavItem,
              name: t("LABELS.employee_registration"),
              to: '/employee_registration',
              icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      },
      // {
      //         component: CNavItem,
      //         name: t("LABELS.employee_tracker"),
      //         to: '/employee_tracker',
      //         icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      // },
      {
              component: CNavItem,
              name: t("LABELS.set_coordinates"),
              to: '/set_coordinates',
              icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      },
      {
              component: CNavItem,
              name: t("LABELS.bulk_employee_tracker"),
              to: '/bulk_employee_tracker',
              icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      }
    ]
  }



  else if (user === 10){
    _nav = [
       {
              component: CNavItem,
              name: t("LABELS.employee_tracker"),
              to: '/employee_tracker',
              icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      }
    ]
  }

  return _nav
}
