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
        component: CNavGroup,
        name: t('LABELS.user_management'),
        icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.all_Users'),   to: 'usermanagement/all-users', className: 'ms-4' },
          { component: CNavItem, name: t('LABELS.create_user'), to: 'usermanagement/create-user', className: 'ms-4' },
        ],
      }
    ]
  }

  /* ─────────── MANAGER ─────────── */
  else if (user === 2) {
    _nav = [
      {
        component: CNavGroup,
        name: t('LABELS.user_management'),
        icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.all_Users'),   to: 'usermanagement/all-users', className: 'ms-4' },
          { component: CNavItem, name: t('LABELS.create_user'), to: 'usermanagement/create-user', className: 'ms-4' },
        ],
      },
    ]
  }

  /* ─────────── PRODUCT ENGINEER ─────────── */
  else if (user === 3) {
    _nav = [
      {
        component: CNavGroup,
        name: t('LABELS.user_management'),
        icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.all_Users'),   to: 'usermanagement/all-users', className: 'ms-4' },
          { component: CNavItem, name: t('LABELS.create_user'), to: 'usermanagement/create-user', className: 'ms-4' },
        ],
      },
    ]
  }

  /* ─────────── DELIVERY TEAM ─────────── */
  else if (user === 4) {
    _nav = [
    {
        component: CNavGroup,
        name: t('LABELS.user_management'),
        icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.all_Users'),   to: 'usermanagement/all-users', className: 'ms-4' },
          { component: CNavItem, name: t('LABELS.create_user'), to: 'usermanagement/create-user', className: 'ms-4' },
        ],
      },
    ]
  }

  /* ─────────── LAB TECHNICIAN ─────────── */
  else if (user === 5) {
    _nav = [
       {
        component: CNavGroup,
        name: t('LABELS.user_management'),
        icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.all_Users'),   to: 'usermanagement/all-users', className: 'ms-4' },
          { component: CNavItem, name: t('LABELS.create_user'), to: 'usermanagement/create-user', className: 'ms-4' },
        ],
      },
    ]         // all dairy pages were removed, so nothing to show here
  }

  return _nav
}
