import React from 'react'
import {
  CAvatar,
  CBadge,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react'
import { cilLockLocked,cilApplications, cilMobile, cilSettings, cilUser } from '@coreui/icons'
import CIcon from '@coreui/icons-react'

import avatar8 from './../../assets/images/user.webp';

import { logout } from '../../util/api'
import { deleteUserData, getUserData } from '../../util/session'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next';

const AppHeaderDropdown = () => {
  const { t, i18n } = useTranslation("global");
  const navigate = useNavigate()
  const user = getUserData();
  const handleLogout = async () => {
    await logout()
    deleteUserData()
    navigate('/login')
  }
  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>
      <CDropdownMenu className="pt-0" placement="bottom-end">
      <CDropdownItem>
          <CIcon icon={cilUser} className="me-2" />
          {user?.name}<br/>
        </CDropdownItem>
        <CDropdownItem>
        <CIcon icon={cilMobile} className="me-2" />
          {user?.mobile}
        </CDropdownItem>

        <CDropdownHeader className="bg-body-secondary fw-semibold my-2">{t('LABELS.setting')}</CDropdownHeader>
        
        <CDropdownItem >
          <Link style={{ textDecoration: 'none', color: 'inherit' }} to="/resetPassword"><CIcon icon={cilSettings} className="me-2" /> {t('LABELS.change_password')}</Link>
        </CDropdownItem>
        {/* <Link to="/sendEmailForResetLink" style={{ textDecoration: 'none', color: 'inherit' }}>
          <CDropdownItem>
            <CIcon icon={cilApplications} className="me-2" />
            Forgot Password
          </CDropdownItem>
        </Link> */}
        <CDropdownDivider />
        <CDropdownItem onClick={handleLogout}>
          {/* <button onClick={handleLogout}> */}
          <CIcon icon={cilLockLocked} className="me-2" />
          {t('LABELS.logout')}
          {/* </button> */}
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}

export default AppHeaderDropdown
