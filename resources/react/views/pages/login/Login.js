import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowThickFromTop, cilLockLocked, cilUser } from '@coreui/icons';
import { login } from '../../../util/api';
import { isLogIn, storeUserData } from '../../../util/session';

import logo from './../../../assets/brand/factory_logo.png';
import { useToast } from '../../common/toast/ToastContext';

const Login = () => {
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const navigate = useNavigate();
  const userNameRef = useRef();
  const userPwdRef = useRef();
  const { showToast } = useToast();

  useEffect(() => {
    if (isLogIn()) {
      navigate('/');
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const onInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
        setShowInstall(false);
      }
    }
  };

  const getRedirectPathByUserType = (userType) => {
    switch (userType) {
      case 0:
        return '/company/new';
      case 1:
      case 2:
        return '/dashboard';
      case 3:
        return '/CreateFactoryProduct';
      case 4:
        return '/delivery';
      case 5:
        return '/LaboratoryUser';
      default:
        return '/dashboard';
    }
  };

  const handleLogin = async (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();

    if (form.checkValidity() !== true) {
      setValidated(true);
      return;
    }

    setValidated(true);
    const email = userNameRef.current?.value;
    const password = userPwdRef.current?.value;

    try {
      const resp = await login({ email, password });
      if (resp.blocked) {
        showToast('danger', resp.message);
      } else {
        const user = resp?.user;
        if (user) {
          storeUserData(resp);
          const redirectPath = getRedirectPathByUserType(user.type);
          navigate(redirectPath);
        } else {
          showToast('danger', 'Please provide valid email and password');
        }
      }
    } catch (error) {
      showToast('danger', 'Please provide valid email and password');
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCardGroup>
              <CCard className="p-4">
                <CCardBody>
                  <CForm noValidate validated={validated} onSubmit={handleLogin}>
                    <img
                      src={logo}
                      style={{ width: '100%', height: 'auto', maxHeight: '200px' }}
                      className="object-fit-contain"
                      alt="Logo"
                    />
                    <p className="text-body-secondary">Sign In to your account</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        ref={userNameRef}
                        id="username"
                        placeholder="Username"
                        autoComplete="username"
                        feedbackInvalid="Please provide username."
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4 position-relative">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        ref={userPwdRef}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        autoComplete="current-password"
                        feedbackInvalid="Please provide password."
                        required
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '10px',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          zIndex: 10,
                        }}
                      >
                        {showPassword ? '🔒' : '👁️'}
                      </button>
                    </CInputGroup>

                    <CRow className="justify-content-center">
                      <CCol xs={12} className="text-center mb-2">
                        <CButton color="primary" type="submit" className="px-4">
                          Login
                        </CButton>
                      </CCol>
                      <CCol xs={12} className="text-center">
                        <CButton
                          color="link"
                          className="px-0"
                          onClick={() => navigate('/sendEmailForResetLink')}
                        >
                          Forgot password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>

      {showInstall && (
        <CButton
          onClick={onInstall}
          color="success"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          <CIcon icon={cilArrowThickFromTop} style={{ fontSize: '24px', color: 'white' }} />
        </CButton>
      )}
    </div>
  );
};

export default Login;
