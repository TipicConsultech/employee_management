import React, { useEffect, useState } from 'react';
import { CBadge, CButton, CCol, CRow, CForm, CFormInput, CInputGroup, CInputGroupText } from '@coreui/react';
import { MantineReactTable } from 'mantine-react-table';
import CIcon from '@coreui/icons-react';
import { 
  cilPlus, 
  cilPeople, 
  cilMoney,
  cilPencil,
  cilTrash
} from '@coreui/icons';
import { deleteAPICall, getAPICall, post, put } from '../../../util/api';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useToast } from '../../common/toast/ToastContext';

const OnboardingPartnerTypes = () => {
  const { showToast } = useToast();

  const [partnerTypes, setPartnerTypes] = useState([]);
  const [deletePartnerType, setDeletePartnerType] = useState();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Add Partner Type Modal State
  const [addPartnerTypeModal, setAddPartnerTypeModal] = useState({
    visible: false,
    validated: false,
    formData: {
      partner_type: '',
      commission: '',
    }
  });

  // Edit Partner Type Modal State
  const [editPartnerTypeModal, setEditPartnerTypeModal] = useState({
    visible: false,
    validated: false,
    formData: {
      id: '',
      partner_type: '',
      commission: '',
    }
  });

  const fetchPartnerTypes = async () => {
    try {
      setLoading(true);
      const response = await getAPICall('/api/partner-types');
      setPartnerTypes(response || []);
    } catch (error) {
      showToast('danger', 'Error fetching partner types: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerTypes();
  }, []);

  const validateCommission = (commission) => {
    const num = parseFloat(commission);
    return !isNaN(num) && num >= 0 && num <= 100;
  };

  const handleInputValidation = (field, value, modalType) => {
    let error = '';
    
    switch (field) {
      case 'partner_type':
        if (!value || value.trim().length < 2) {
          error = 'Partner type must be at least 2 characters long';
        }
        break;
      case 'commission':
        if (!value || !validateCommission(value)) {
          error = 'Commission must be a number between 0 and 100';
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

  const handleDelete = (partnerType) => {
    setDeletePartnerType(partnerType);
    setDeleteModalVisible(true);
  };

  const onDelete = async () => {
    try {
      await deleteAPICall(`/api/partner-types/${deletePartnerType.id}`);
      setDeleteModalVisible(false);
      showToast('success', 'Partner type deleted successfully!');
      fetchPartnerTypes();
    } catch (error) {
      showToast('danger', 'Error deleting partner type: ' + error.message);
    }
  };

  const handleEdit = (partnerType) => {
    setEditPartnerTypeModal({
      visible: true,
      validated: false,
      formData: {
        id: partnerType.id,
        partner_type: partnerType.partner_type || '',
        commission: partnerType.commission || '',
      }
    });
    setValidationErrors({});
  };

  // Add Partner Type Modal Functions
  const openAddPartnerTypeModal = () => {
    setAddPartnerTypeModal({
      visible: true,
      validated: false,
      formData: {
        partner_type: '',
        commission: '',
      }
    });
    setValidationErrors({});
  };

  const closeAddPartnerTypeModal = () => {
    setAddPartnerTypeModal(prev => ({ ...prev, visible: false, validated: false }));
    setValidationErrors({});
  };

  const handleAddPartnerTypeChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Handle special input processing
    if (name === 'commission') {
      // Allow decimal numbers
      processedValue = value.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const parts = processedValue.split('.');
      if (parts.length > 2) {
        processedValue = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    setAddPartnerTypeModal(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: processedValue }
    }));

    // Validate input
    handleInputValidation(name, processedValue, 'add');
  };

  const handleAddPartnerTypeSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    let hasErrors = false;

    // Custom validations
    const { partner_type, commission } = addPartnerTypeModal.formData;

    if (!partner_type || partner_type.trim().length < 2) {
      setValidationErrors(prev => ({ ...prev, add_partner_type: 'Partner type must be at least 2 characters long' }));
      hasErrors = true;
    }

    if (!commission || !validateCommission(commission)) {
      setValidationErrors(prev => ({ ...prev, add_commission: 'Commission must be a number between 0 and 100' }));
      hasErrors = true;
    }

    if (!form.checkValidity() || hasErrors) {
      setAddPartnerTypeModal(prev => ({ ...prev, validated: true }));
      return;
    }

    try {
      const response = await post('/api/partner-types', addPartnerTypeModal.formData);
      if (response) {
        showToast('success', 'Partner type created successfully');
        closeAddPartnerTypeModal();
        fetchPartnerTypes();
      } else {
        showToast('danger', 'Error occurred, please try again later.');
      }
    } catch (error) {
      showToast('danger', 'Error creating partner type: ' + error.message);
    }
  };

  // Edit Partner Type Modal Functions
  const closeEditPartnerTypeModal = () => {
    setEditPartnerTypeModal(prev => ({ ...prev, visible: false, validated: false }));
    setValidationErrors({});
  };

  const handleEditPartnerTypeChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Handle special input processing
    if (name === 'commission') {
      // Allow decimal numbers
      processedValue = value.replace(/[^0-9.]/g, '');
      // Prevent multiple decimal points
      const parts = processedValue.split('.');
      if (parts.length > 2) {
        processedValue = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    setEditPartnerTypeModal(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: processedValue }
    }));

    // Validate input
    handleInputValidation(name, processedValue, 'edit');
  };

  const handleEditPartnerTypeSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.target;
    let hasErrors = false;

    // Custom validations
    const { partner_type, commission } = editPartnerTypeModal.formData;

    if (!partner_type || partner_type.trim().length < 2) {
      setValidationErrors(prev => ({ ...prev, edit_partner_type: 'Partner type must be at least 2 characters long' }));
      hasErrors = true;
    }

    if (!commission || !validateCommission(commission)) {
      setValidationErrors(prev => ({ ...prev, edit_commission: 'Commission must be a number between 0 and 100' }));
      hasErrors = true;
    }

    if (!form.checkValidity() || hasErrors) {
      setEditPartnerTypeModal(prev => ({ ...prev, validated: true }));
      return;
    }

    try {
      const response = await put(`/api/partner-types/${editPartnerTypeModal.formData.id}`, editPartnerTypeModal.formData);
      if (response) {
        showToast('success', 'Partner type updated successfully');
        closeEditPartnerTypeModal();
        fetchPartnerTypes();
      } else {
        showToast('danger', 'Error occurred, please try again later.');
      }
    } catch (error) {
      showToast('danger', 'Error updating partner type: ' + error.message);
    }
  };

  const columns = [
    {
      accessorKey: 'index',
      header: '#',
      size: 60,
      Cell: ({ row }) => row.index + 1,
    },
    { 
      accessorKey: 'partner_type', 
      header: 'Partner Type',
      size: 200,
    },
    {
      accessorKey: 'commission',
      header: 'Commission (%)',
      size: 150,
      Cell: ({ cell }) => `${cell.getValue()} %`,
    },
    
    {
      accessorKey: 'actions',
      header: 'Actions',
      size: 150,
      Cell: ({ cell }) => (
        <div className="d-flex flex-wrap gap-2">
          <CBadge
            role="button"
            color="info"
            className="d-flex align-items-center gap-1"
            onClick={() => handleEdit(cell.row.original)}
          >
            <CIcon icon={cilPencil} size="sm" />
            Edit
          </CBadge>
          <CBadge
            role="button"
            color="danger"
            className="d-flex align-items-center gap-1"
            onClick={() => handleDelete(cell.row.original)}
          >
            <CIcon icon={cilTrash} size="sm" />
            Delete
          </CBadge>
        </div>
      ),
    },
  ];

  const data = partnerTypes.map((partnerType, index) => ({
    ...partnerType,
    index: index + 1,
  }));

  return (
    <>
      <CRow className="mb-3">
        <CCol xs={12} className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Partner Types Management</h4>
          <CButton 
            color="primary" 
            onClick={openAddPartnerTypeModal}
            className="d-flex align-items-center gap-2"
          >
            <CIcon icon={cilPlus} />
            Add Partner Type
          </CButton>
        </CCol>
      </CRow>

      <CRow>
        <ConfirmationModal
          visible={deleteModalVisible}
          setVisible={setDeleteModalVisible}
          onYes={onDelete}
          resource={`Delete partner type - ${deletePartnerType?.partner_type}`}
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
              style: { padding: '8px', fontSize: '12px' },
            }}
            muiTableHeadCellProps={{
              style: { padding: '8px', fontSize: '13px', fontWeight: 'bold' },
            }}
          />
        </CCol>
      </CRow>

      {/* Add Partner Type Modal */}
      {addPartnerTypeModal.visible && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add New Partner Type</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeAddPartnerTypeModal}
                ></button>
              </div>
              <div className="modal-body">
                <CForm 
                  className="needs-validation" 
                  noValidate 
                  validated={addPartnerTypeModal.validated}
                  onSubmit={handleAddPartnerTypeSubmit}
                >
                  {/* Partner Type Name */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilPeople} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="partner_type"
                      placeholder="Partner Type Name (e.g., Retailer, Distributor)"
                      value={addPartnerTypeModal.formData.partner_type}
                      onChange={handleAddPartnerTypeChange}
                      invalid={!!validationErrors.add_partner_type}
                      required
                      feedbackInvalid={validationErrors.add_partner_type || "Please provide partner type name."}
                    />
                  </CInputGroup>

                  {/* Commission */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilMoney} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="commission"
                      placeholder="Commission Percentage (e.g., 15.50)"
                      value={addPartnerTypeModal.formData.commission}
                      onChange={handleAddPartnerTypeChange}
                      invalid={!!validationErrors.add_commission}
                      required
                      feedbackInvalid={validationErrors.add_commission || "Please provide commission percentage."}
                    />
                    <CInputGroupText>%</CInputGroupText>
                  </CInputGroup>

                  <div className="modal-footer">
                    <CButton color="secondary" onClick={closeAddPartnerTypeModal}>
                      Cancel
                    </CButton>
                    <CButton color="success" type="submit">
                      Create Partner Type
                    </CButton>
                  </div>
                </CForm>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Partner Type Modal */}
      {editPartnerTypeModal.visible && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Partner Type</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeEditPartnerTypeModal}
                ></button>
              </div>
              <div className="modal-body">
                <CForm 
                  className="needs-validation" 
                  noValidate 
                  validated={editPartnerTypeModal.validated}
                  onSubmit={handleEditPartnerTypeSubmit}
                >
                  {/* Partner Type Name */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilPeople} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="partner_type"
                      placeholder="Partner Type Name (e.g., Retailer, Distributor)"
                      value={editPartnerTypeModal.formData.partner_type}
                      onChange={handleEditPartnerTypeChange}
                      invalid={!!validationErrors.edit_partner_type}
                      required
                      feedbackInvalid={validationErrors.edit_partner_type || "Please provide partner type name."}
                    />
                  </CInputGroup>

                  {/* Commission */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilMoney} />
                    </CInputGroupText>
                    <CFormInput
                      type="text"
                      name="commission"
                      placeholder="Commission Percentage (e.g., 15.50)"
                      value={editPartnerTypeModal.formData.commission}
                      onChange={handleEditPartnerTypeChange}
                      invalid={!!validationErrors.edit_commission}
                      required
                      feedbackInvalid={validationErrors.edit_commission || "Please provide commission percentage."}
                    />
                    <CInputGroupText>%</CInputGroupText>
                  </CInputGroup>

                  <div className="modal-footer">
                    <CButton color="secondary" onClick={closeEditPartnerTypeModal}>
                      Cancel
                    </CButton>
                    <CButton color="success" type="submit">
                      Update Partner Type
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

export default OnboardingPartnerTypes;