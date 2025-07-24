import React, { useEffect, useState } from 'react';
import { CBadge, CButton, CCol, CRow, CForm, CFormInput, CFormSelect, CInputGroup, CInputGroupText } from '@coreui/react';
import { MantineReactTable } from 'mantine-react-table';
import CIcon from '@coreui/icons-react';
import { 
  cilUser, 
  cilMobile, 
  cilPeople, 
  cilEnvelopeClosed,
  cilBank,
  cilCreditCard,
  cilCode,
  cilMoney
} from '@coreui/icons';
import { deleteAPICall, getAPICall, post, put } from '../../../util/api';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useToast } from '../../common/toast/ToastContext';

const OnboardingPartners = () => {
  const { showToast } = useToast();

  const [partners, setPartners] = useState([]);
  const [partnerTypes, setPartnerTypes] = useState([]);
  const [deletePartner, setDeletePartner] = useState();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Edit Partner Modal State
  const [editPartnerModal, setEditPartnerModal] = useState({
    visible: false,
    validated: false,
    formData: {
      id: '',
      name: '',
      email: '',
      mobile: '',
      type_id: '',
      bank_name: '',
      account_number: '',
      ifsc_code: '',
      commission: '',
    }
  });


  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await getAPICall('/api/partners');
      setPartners(response || []);
    } catch (error) {
      showToast('danger', 'Error fetching partners: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerTypes = async () => {
    try {
      const response = await getAPICall('/api/partner-types');
      if (response?.length) {
        const mappedTypes = response.map(type => ({ 
          label: type.partner_type, 
          value: type.id.toString(),
          commission: type.commission 
        }));
        setPartnerTypes([
          { label: 'Select Partner Type', value: '' },
          ...mappedTypes
        ]);
      }
    } catch (error) {
      console.error('Error fetching partner types:', error);
      // Fallback types if API fails
      setPartnerTypes([
        { label: 'Select Partner Type', value: '' },
        { label: 'Retailer', value: '1' },
        { label: 'Distributor', value: '2' },
        { label: 'Wholesaler', value: '3' }
      ]);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchPartnerTypes();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateIFSC = (ifsc) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc.toUpperCase());
  };

  const handleInputValidation = (field, value, modalType) => {
    let error = '';
    
    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'mobile':
        if (value && !validateMobile(value)) {
          error = 'Mobile number must be exactly 10 digits';
        }
        break;
      case 'ifsc_code':
        if (value && !validateIFSC(value)) {
          error = 'Please enter a valid IFSC code (e.g., SBIN0000123)';
        }
        break;
      default:
        break;
    }
    
    setValidationErrors(prev => ({ 
      ...prev, 
      [`${modalType}_${field}`]: error 
    }));
  };

  const handleDelete = (partner) => {
    setDeletePartner(partner);
    setDeleteModalVisible(true);
  };

  const onDelete = async () => {
    try {
      await deleteAPICall(`/api/partners/${deletePartner.id}`);
      setDeleteModalVisible(false);
      showToast('success', 'Partner deleted successfully!');
      fetchPartners();
    } catch (error) {
      showToast('danger', 'Error deleting partner: ' + error.message);
    }
  };

  const handleEdit = (partner) => {
    setEditPartnerModal({
      visible: true,
      validated: false,
      formData: {
        id: partner.id,
        name: partner.name || '',
        email: partner.email || '',
        mobile: partner.mobile || '',
        type_id: partner.partner_types?.id?.toString() || '',
        bank_name: partner.bank_name || '',
        account_number: partner.account_number || '',
        ifsc_code: partner.ifsc_code || '',
        commission: partner.partner_types?.commission || '15.00',
      }
    });
    setValidationErrors({});
  };

  // Edit Partner Modal Functions
  const closeEditPartnerModal = () => {
    setEditPartnerModal(prev => ({ ...prev, visible: false, validated: false }));
    setValidationErrors({});
  };

  const handleEditPartnerChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Handle special input processing
    if (name === 'mobile' || name === 'account_number') {
      processedValue = value.replace(/\D/g, '');
    } else if (name === 'ifsc_code') {
      processedValue = value.toUpperCase();
    }

    setEditPartnerModal(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: processedValue }
    }));

    // Validate input
    handleInputValidation(name, processedValue, 'edit');
  };

  const handleEditPartnerSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    let hasErrors = false;

    // Custom validations
    const { email, mobile, ifsc_code, type_id } = editPartnerModal.formData;

    if (!email || !validateEmail(email)) {
      setValidationErrors(prev => ({ ...prev, edit_email: 'Please enter a valid email address' }));
      hasErrors = true;
    }

    if (!mobile || !validateMobile(mobile)) {
      setValidationErrors(prev => ({ ...prev, edit_mobile: 'Mobile number must be exactly 10 digits' }));
      hasErrors = true;
    }

    if (!ifsc_code || !validateIFSC(ifsc_code)) {
      setValidationErrors(prev => ({ ...prev, edit_ifsc_code: 'Please enter a valid IFSC code' }));
      hasErrors = true;
    }

    if (!type_id) {
      setValidationErrors(prev => ({ ...prev, edit_type_id: 'Please select a partner type' }));
      hasErrors = true;
    }

    if (!form.checkValidity() || hasErrors) {
      setEditPartnerModal(prev => ({ ...prev, validated: true }));
      return;
    }

    try {
      const response = await put(`/api/partners/${editPartnerModal.formData.id}`, editPartnerModal.formData);
      if (response) {
        showToast('success', 'Partner updated successfully');
        closeEditPartnerModal();
        fetchPartners();
      } else {
        showToast('danger', 'Error occurred, please try again later.');
      }
    } catch (error) {
      showToast('danger', 'Error updating partner: ' + error.message);
    }
  };

  const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'mobile', header: 'Mobile' },
    {
      accessorKey: 'partner_type',
      header: 'Partner Type',
      Cell: ({ cell }) => cell.row.original.partner_types?.partner_type || 'N/A',
    },
    {
      accessorKey: 'commission',
      header: 'Commission (%)',
      Cell: ({ cell }) => cell.row.original.partner_types?.commission || 'N/A',
    },
    { accessorKey: 'bank_name', header: 'Bank Name' },
    { accessorKey: 'account_number', header: 'Account Number' },
    { accessorKey: 'ifsc_code', header: 'IFSC Code' },
    {
      accessorKey: 'actions',
      header: 'Actions',
      Cell: ({ cell }) => (
        <div className="d-flex flex-wrap">
          <CBadge
            role="button"
            color="info"
            className="me-2 mb-2"
            onClick={() => handleEdit(cell.row.original)}
          >
            Edit
          </CBadge>
          <CBadge
            role="button"
            color="danger"
            className="mb-2"
            onClick={() => handleDelete(cell.row.original)}
          >
            Delete
          </CBadge>
        </div>
      ),
    },
  ];

  const data = partners.map((partner, index) => ({
    ...partner,
    index: index + 1,
  }));

  return (
    <>
      <CRow>
        <ConfirmationModal
          visible={deleteModalVisible}
          setVisible={setDeleteModalVisible}
          onYes={onDelete}
          resource={`Delete partner - ${deletePartner?.name}`}
        />
        <CCol xs={12}>
          <MantineReactTable
            columns={columns}
            data={data}
            enableFullScreenToggle={false}
            enableColumnResizing
            enableStickyHeader
            initialState={{ density: 'xs' }}
            enableRowNumbers={false}
            state={{ isLoading: loading }}
            defaultColumn={{
              size: 130,
              Cell: ({ cell }) => (
                <div style={{ fontSize: '12px', padding: '5px' }}>
                  {cell.getValue()}
                </div>
              ),
            }}
            muiTableBodyCellProps={{
              style: { padding: '5px', fontSize: '12px' },
            }}
          />
        </CCol>
      </CRow>

      {/* Edit Partner Modal */}
      {editPartnerModal.visible && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Partner</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditPartnerModal}
                ></button>
              </div>
              <div className="modal-body">
                <CForm 
                  className="needs-validation" 
                  noValidate 
                  validated={editPartnerModal.validated}
                  onSubmit={handleEditPartnerSubmit}
                >
                  {/* Partner Type Selection */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilPeople} />
                    </CInputGroupText>
                    <CFormSelect
                      name="type_id"
                      value={editPartnerModal.formData.type_id}
                      onChange={handleEditPartnerChange}
                      invalid={!!validationErrors.edit_type_id}
                      required
                    >
                      {partnerTypes.map((type, index) => (
                        <option key={index} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </CFormSelect>
                    <div className="invalid-feedback">
                      {validationErrors.edit_type_id || 'Please select a partner type.'}
                    </div>
                  </CInputGroup>

                  {/* Name */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="name"
                      placeholder="Partner Name"
                      value={editPartnerModal.formData.name}
                      onChange={handleEditPartnerChange}
                      required
                      feedbackInvalid="Please provide partner name."
                    />
                  </CInputGroup>

                  {/* Email */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilEnvelopeClosed} />
                    </CInputGroupText>
                    <CFormInput
                      type="email"
                      name="email"
                      placeholder="Email Address"
                      value={editPartnerModal.formData.email}
                      onChange={handleEditPartnerChange}
                      invalid={!!validationErrors.edit_email}
                      required
                      feedbackInvalid={validationErrors.edit_email || "Please provide a valid email address."}
                    />
                  </CInputGroup>

                  {/* Mobile */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilMobile} />
                    </CInputGroupText>
                    <CFormInput
                      type="tel"
                      name="mobile"
                      placeholder="Mobile Number (10 digits)"
                      maxLength={10}
                      value={editPartnerModal.formData.mobile}
                      onChange={handleEditPartnerChange}
                      invalid={!!validationErrors.edit_mobile}
                      required
                      feedbackInvalid={validationErrors.edit_mobile || "Please provide a valid 10-digit mobile number."}
                    />
                  </CInputGroup>

                  {/* Bank Name */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilBank} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="bank_name"
                      placeholder="Bank Name"
                      value={editPartnerModal.formData.bank_name}
                      onChange={handleEditPartnerChange}
                      required
                      feedbackInvalid="Please provide bank name."
                    />
                  </CInputGroup>

                  {/* Account Number */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilCreditCard} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="account_number"
                      placeholder="Account Number"
                      maxLength={50}
                      value={editPartnerModal.formData.account_number}
                      onChange={handleEditPartnerChange}
                      required
                      feedbackInvalid="Please provide account number."
                    />
                  </CInputGroup>

                  {/* IFSC Code */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilCode} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="ifsc_code"
                      placeholder="IFSC Code (e.g., SBIN0000123)"
                      maxLength={11}
                      value={editPartnerModal.formData.ifsc_code}
                      onChange={handleEditPartnerChange}
                      invalid={!!validationErrors.edit_ifsc_code}
                      required
                      feedbackInvalid={validationErrors.edit_ifsc_code || "Please provide a valid IFSC code."}
                    />
                  </CInputGroup>

                  <div className="modal-footer">
                    <CButton color="secondary" onClick={closeEditPartnerModal}>
                      Cancel
                    </CButton>
                    <CButton color="success" type="submit">
                      Update Partner
                    </CButton>
                  </div>
                </CForm>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OnboardingPartners;