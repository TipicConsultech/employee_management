import React, { useState, useEffect, useCallback } from 'react';
import {
    CBadge,
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CFormSwitch,
    CRow,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
    CSpinner,
    CAlert
} from '@coreui/react';
import { getAPICall, put } from '../../../util/api';
import { useTranslation } from 'react-i18next';

function AllUsers() {
    // Add translation hook
    const { t } = useTranslation("global");

    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    // Memoized helper function for showing notifications
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        // Auto hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 3000);
        }
    }, []);

    // Fetch users function
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAPICall('/api/appUsers');
            if (response.data) {
                setAllUsers(response.data);
            } else {
                showNotification('warning', t('MSG.failedToFetchUsers'));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [showNotification, t]);

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Toggle user blocked status
    const toggleVisibility = async (user) => {
        const updatedUser = { ...user, blocked: user.blocked === 1 ? 0 : 1 };

        try {
            const response = await put('/api/appUsers', updatedUser);
            if (response.success) {
                setAllUsers((prevUsers) =>
                    prevUsers.map((u) =>
                        u.id === user.id ? updatedUser : u
                    )
                );
                showNotification('success', user.blocked === 1 ?
                    t('MSG.userUnblockedSuccess') :
                    t('MSG.userBlockedSuccess')
                );
            } else {
                showNotification('warning', t('MSG.failedToUpdateUser'));
            }
        } catch (error) {
            console.error('Error updating user:', error);
            showNotification('warning', `${t('MSG.error')}: ${error.message}`);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <CSpinner color="primary" />
            </div>
        );
    }

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4 shadow-sm">
                    <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                        <div className="d-flex justify-content-between align-items-center flex-wrap">
                            <strong>{t('LABELS.allUsers')}</strong>
                        </div>
                    </CCardHeader>

                    {/* Notifications */}
                    {notification.show && (
                        <CAlert color={notification.type} dismissible onClose={() => setNotification({ show: false, type: '', message: '' })}>
                            {notification.message}
                        </CAlert>
                    )}

                    <CCardBody>
                        <div className="table-responsive">
                            <CTable>
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell scope="col">{t('LABELS.id')}</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">{t('LABELS.name')}</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">{t('LABELS.email')}</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">{t('LABELS.mobile')}</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">{t('LABELS.type')}</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">{t('LABELS.blocked')}</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {allUsers.length > 0 ? (
                                        allUsers.map((user, index) => (
                                            <CTableRow key={user.id}>
                                                <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                                                <CTableDataCell>{user.name}</CTableDataCell>
                                                <CTableDataCell>{user.email}</CTableDataCell>
                                                <CTableDataCell>{user.mobile}</CTableDataCell>
                                                <CTableDataCell>{user.type}</CTableDataCell>
                                                <CTableDataCell>
                                                    <CFormSwitch
                                                        id={`formSwitchCheckDefault${user.id}`}
                                                        checked={user.blocked === 1}
                                                        onChange={() => toggleVisibility(user)}
                                                        label={user.blocked === 1 ? t('LABELS.blocked') : t('LABELS.active')}
                                                    />
                                                </CTableDataCell>
                                            </CTableRow>
                                        ))
                                    ) : (
                                        <CTableRow>
                                            <CTableDataCell colSpan="6" className="text-center">
                                                {t('MSG.noUsersAvailable')}
                                            </CTableDataCell>
                                        </CTableRow>
                                    )}
                                </CTableBody>
                            </CTable>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    );
}

export default AllUsers;

//-------------------------------------------------

// import React, { useState, useEffect } from 'react';
// import {
//     CBadge,
//     CButton,
//     CCard,
//     CCardBody,
//     CCardHeader,
//     CCol,
//     CFormSwitch,
//     CRow,
//     CTable,
//     CTableBody,
//     CTableDataCell,
//     CTableHead,
//     CTableHeaderCell,
//     CTableRow,
// } from '@coreui/react';
// import { getAPICall, put } from '../../../util/api';

// function AllUsers() {
//     const [AllUsers, setAllUsers] = useState([]);

//     useEffect(() => {
//         const fetchUsers = async () => {
//             try {
//                 const response = await getAPICall('/api/appUsers');
//                 setAllUsers(response.data);
//             } catch (error) {
//                 console.error('Error fetching users:', error);
//             }
//         };

//         fetchUsers();
//     }, []);


//     const toggleVisibility = async (user) => {
//         const updatedUser = { ...user, blocked: user.blocked === 1 ? 0 : 1 };

//         try {
//             await put('/api/appUsers', updatedUser);
//             setAllUsers((prevUsers) =>
//                 prevUsers.map((u) =>
//                     u.id === user.id ? updatedUser : u
//                 )
//             );
//         } catch (error) {
//             console.error('Error updating user:', error);
//         }
//     };

//     return (
//         <CRow>
//             <CCol xs={12}>
//                 <CCard className="mb-4">
//                     <CCardHeader>
//                         <strong>All Users</strong>
//                     </CCardHeader>
//                     <CCardBody>
//                         <div className="table-responsive">
//                             <CTable>
//                                 <CTableHead>
//                                     <CTableRow>
//                                         <CTableHeaderCell scope="col">Id</CTableHeaderCell>
//                                         <CTableHeaderCell scope="col">Name</CTableHeaderCell>
//                                         <CTableHeaderCell scope="col">Email</CTableHeaderCell>
//                                         <CTableHeaderCell scope="col">Mobile</CTableHeaderCell>
//                                         <CTableHeaderCell scope="col">Type</CTableHeaderCell>
//                                         <CTableHeaderCell scope="col">Blocked</CTableHeaderCell>

//                                     </CTableRow>
//                                 </CTableHead>
//                                 <CTableBody>
//                                     {AllUsers.map((user, index) => (
//                                         <CTableRow key={user.id}>
//                                             <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
//                                             <CTableDataCell>{user.name}</CTableDataCell>
//                                             <CTableDataCell>{user.email}</CTableDataCell>
//                                             <CTableDataCell>{user.mobile}</CTableDataCell>
//                                             <CTableDataCell>{user.type}</CTableDataCell>
//                                             <CTableDataCell>
//                                             <CFormSwitch
//                                                 id={`formSwitchCheckDefault${user.id}`}
//                                                 checked={user.blocked === 1}
//                                                 onChange={() => toggleVisibility(user)}

//                                                   />

//                                             </CTableDataCell>

//                                         </CTableRow>
//                                     ))}
//                                 </CTableBody>
//                             </CTable>
//                         </div>
//                     </CCardBody>
//                 </CCard>
//             </CCol>
//         </CRow>
//     );
// }

// export default AllUsers;
