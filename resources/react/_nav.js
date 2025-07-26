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
  cilCamera,
  cilCheck,
  cilChartLine,
  cilSearch,
  cilMoney,
  cilPeople,
  cilPin,
  cilLocationPin,
  cibPivotaltracker,
  cilAsteriskCircle,
} from '@coreui/icons'
import { CNavGroup, CNavItem } from '@coreui/react'
import { getUserData } from './util/session'

export default function fetchNavItems(t1) {
  const userData = getUserData()
  const user = userData?.type
  const attendance_type = userData?.attendance_type


  const t = t1

  let _nav = []

  /* ─────────── SUPER‑ADMIN ─────────── */
  if (user === 0) {
    _nav = [
      //   {
      //   component: CNavItem,
      //   name: t('LABELS.TipicDashboard'),
      //   to: '/tipicDashboard',
      //   icon: <CIcon icon={cibPostgresql} customClassName="nav-icon" />,
      // },
      {
        component: CNavGroup,
        name: t('LABELS.company'),
        icon: <CIcon icon={cibElasticStack} customClassName="nav-icon" />,
        items: [
          { component: CNavItem, name: t('LABELS.new_company'),  to: '/company/new' },
          { component: CNavItem, name: t('LABELS.all_companies'), to: '/company/all' },
          // { component: CNavItem, name: 'Company Subscription',   to: '/company/companyReceipt' },
        ],
      },
      {
        component: CNavItem,
        name: t('LABELS.plans'),
        to: '/plans',
        icon: <CIcon icon={cibPostgresql} customClassName="nav-icon" />,
      }
      // {
      //   component: CNavItem,
      //   name: t('LABELS.onboarding-partner-configure'),
      //   to: '/onboarding-partner-configure',
      //   icon: <CIcon icon={cibPostgresql} customClassName="nav-icon" />,
      // },
      // {
      //   component: CNavGroup,
      //   name: t('LABELS.user_management'),
      //   icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
      //   items: [
      //     { component: CNavItem, name: t('LABELS.all_Users'),   to: 'usermanagement/all-users' },
      //     { component: CNavItem, name: t('LABELS.create_user'), to: 'usermanagement/create-user' },
      //   ],
      // },
      // {
      //   component: CNavGroup,
      //   name: t('LABELS.Onboarding_Partners'),
      //   icon: <CIcon icon={cilGroup} customClassName="nav-icon" />,
      //   items: [
      //     { component: CNavItem, name: t('LABELS.New_Partners'),   to: '/OnboardingNewPartnere' },
      //     { component: CNavItem, name: t('LABELS.All_Partners'), to: '/OnboardingAllPartnere' },
      //   ],
      // },
    ]
  }

  /* ─────────── ADMIN ─────────── */
  else if (user === 1) {
    _nav = [

      {
              component: CNavItem,
              name: t("LABELS.dashboard"),
              to: '/dashboard',
              icon: <CIcon icon={cilChartLine} customClassName="nav-icon"/>,
      },
      {
        component: CNavItem,
        name: t("LABELS.docs_verification"),
        to: '/Document_verification',
        icon: <CIcon icon={cilSearch} customClassName="nav-icon" />,
      },
      {
              component: CNavItem,
              name: t("LABELS.credit_screen"),
              to: '/credit_screen',
              icon: <CIcon icon={cilMoney} customClassName="nav-icon" />,
      },
      {
              component: CNavItem,
              name: t("LABELS.employee_registration"),
              to: '/employee_registration',
              icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
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
              icon: <CIcon icon={cilLocationPin} customClassName="nav-icon" />,
      },
      // {
      //         component: CNavItem,
      //         name: t("LABELS.bulk_employee_tracker"),
      //         to: '/bulk_employee_tracker',
      //         icon: <CIcon icon={cilAsteriskCircle} customClassName="nav-icon" />,
      // },
      {
              component: CNavItem,
              name: t("LABELS.payrollAndAttendanceReport"),
              to: '/payrollAndAttendanceReport',
              icon: <CIcon icon={cilCheck} customClassName="nav-icon" />,
      }
    ]
  }



  else if (user === 10){
   _nav = [
  // show “Employee Tracker” when attendance is location‑based or both
  ...(attendance_type === "location"
    ? [{
        component: CNavItem,
        name: t("LABELS.employee_tracker"),
        to: '/employee_tracker',
        icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      }]
    : []),

  // show “Check‑in with Selfie” when attendance uses face recognition
  ...(attendance_type === "face_attendance"
    ? [{
        component: CNavItem,
        // name: t("LABELS.checkInWithSelfie"),
        name: t("LABELS.employee_tracker"),
        to: '/checkInWithSelfie',
        icon: <CIcon icon={cilCamera} customClassName="nav-icon" />,
      }]
    : []),
     ...(attendance_type === "both"
    ? [{
        component: CNavItem,
        // name: t("LABELS.checkInWithSelfie"),
        name: t("LABELS.employee_tracker"),
        to: '/checkInWithSelfie',
        icon: <CIcon icon={cilCamera} customClassName="nav-icon" />,
      }]
    : [])
];

  }

  return _nav
}
