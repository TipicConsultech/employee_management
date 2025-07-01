import React, { useState, useEffect } from 'react';
import {
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
} from '@coreui/react';
import { getAPICall, put } from '../../../util/api';
import NewPlanModal from './NewPlanModal';

function Plans() {
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false)

    const fetchPlans = async () => {
        try {
            const response = await getAPICall('/api/plan');
            setPlans(response);
        } catch (error) {
            console.error('Error fetching Plans:', error);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    
    const toggleVisibility = async (plan) => {
        const uPlan = { ...plan, isActive: plan.isActive === 1 ? 0 : 1 };
        try {
            await put('/api/plan/'+uPlan.id, uPlan);
            setPlans((prevPlans) =>
                prevPlans.map((u) =>
                    u.id === plan.id ? uPlan : u
                )
            );
        } catch (error) {
            console.error('Error updating plan:', error);
        }
    };

    return (
        <CRow>
            <NewPlanModal onSuccess={fetchPlans} visible={showModal} setVisible={setShowModal}/>
            <CCol xs={12}>
                <CCard className="mb-4">
                    <CCardHeader>
                        <div className="d-flex justify-content-between align-items-center">
                            <strong>All Plans</strong>
                            <CButton size="sm" color="primary" onClick={() => setShowModal(true)}>New</CButton>
                        </div>   
                    </CCardHeader>
                    <CCardBody>
                        <div className="table-responsive">
                            <CTable>
                                <CTableHead>
                                    <CTableRow>
                                        <CTableHeaderCell scope="col">Id</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">Description</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">Price</CTableHeaderCell>
                                        <CTableHeaderCell scope="col">plan Limit</CTableHeaderCell>
                                        {/* <CTableHeaderCell scope="col">Access Level</CTableHeaderCell> */}
                                        <CTableHeaderCell scope="col">Active</CTableHeaderCell>
                                    </CTableRow>
                                </CTableHead>
                                <CTableBody>
                                    {plans.map((plan, index) => (
                                        <CTableRow key={plan.id}>
                                            <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                                            <CTableDataCell>{plan.name}</CTableDataCell>
                                            <CTableDataCell>{plan.description}</CTableDataCell>
                                            <CTableDataCell>{plan.price}</CTableDataCell>
                                            <CTableDataCell>{plan.userLimit}</CTableDataCell>
                                            <CTableDataCell>
                                            <CFormSwitch
                                                id={`formSwitchCheckDefault${plan.id}`}
                                                checked={plan.isActive === 1}
                                                onChange={() => toggleVisibility(plan)}
                                                  />
                                            </CTableDataCell>
                                            
                                        </CTableRow>
                                    ))}
                                </CTableBody>
                            </CTable>
                        </div>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    );
}

export default Plans;
