import { CButton, CForm, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CInputGroup, CInputGroupText, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow } from '@coreui/react'
import { useEffect, useState } from 'react'
import { register } from '../../util/api'
import { useToast } from './toast/ToastContext'
import { useTranslation } from 'react-i18next'
import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilMobile, cilPeople, cilUser } from '@coreui/icons'

export default function NewUserModal({ data, visible, setVisible }) {
  const { showToast } = useToast();
  const { t } = useTranslation("global");
  const [validated, setValidated] = useState(false);
  
  // State variables instead of useRef
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('1');

  useEffect(() => {
    console.log("useEffect",data);
    if (data.company_id) {
      setName('Shop Owner');
      setEmail(data.email_id);
      setMobile(data.phone_no);
      setPassword('');
      setConfirmPassword('');
    }
  }, [data]);


  const userTypes = [
    { label: 'Admin', value: '1' },
    { label: 'User', value: '2' }
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget;

    if (form.checkValidity() === false) {
      setValidated(true);
      return;
    }

    const userData = {
      name,
      email,
      mobile,
      password,
      password_confirmation: confirmPassword,
      type: userType,
      company_id: data.company_id,
    };

    try {
      const resp = await register(userData);
      if (resp) {
        setVisible(false);
        showToast('success', 'New user is created successfully');
      } else {
        showToast('danger', 'Error occurred, please try again later.');
      }
    } catch (error) {
      showToast('danger', 'Error occurred ' + error);
    }
  }

  return (
    <>
      <CModal
        backdrop="static"
        visible={visible}
        onClose={() => { setVisible(false); }}
        aria-labelledby="StaticBackdropExampleLabel"
      >
        <CModalHeader>
          <CModalTitle>Create User</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm noValidate validated={validated} onSubmit={handleSubmit}>
            <CInputGroup className="mb-4">
              <CInputGroupText>
                <CIcon icon={cilPeople} />
              </CInputGroupText>
              <CFormSelect
                aria-label="Default select example"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                options={userTypes}
                feedbackInvalid="Please select a valid option."
              />
            </CInputGroup>

            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilUser} />
              </CInputGroupText>
              <CFormInput
                value={name}
                onChange={(e) => setName(e.target.value)}
                type='username'
                placeholder="Username"
                autoComplete="name"
                required
                feedbackInvalid="Please provide name."
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>@</CInputGroupText>
              <CFormInput
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                autoComplete="email"
                type='email'
                required
                feedbackInvalid="Please provide email."
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilMobile} />
              </CInputGroupText>
              <CFormInput
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="Mobile"
                autoComplete="phone"
                type='mobile'
                required
                feedbackInvalid="Please provide mobile number."
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>
                <CIcon icon={cilLockLocked} />
              </CInputGroupText>
              <CFormInput
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter New Password"
                autoComplete="new-password"
                required
                feedbackInvalid="Please provide password."
              />
            </CInputGroup>
            <CInputGroup className="mb-4">
              <CInputGroupText>
                <CIcon icon={cilLockLocked} />
              </CInputGroupText>
              <CFormInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                required
                feedbackInvalid="Please provide confirm password."
              />
            </CInputGroup>
            <div className="d-grid col-sm-3">
              <CButton color="success" type="submit">
                Save
              </CButton>
            </div>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  )
}
