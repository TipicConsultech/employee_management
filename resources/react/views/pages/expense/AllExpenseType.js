import React, { useEffect, useState } from 'react';
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CRow,
  CFormSelect,
} from '@coreui/react';
import { MantineReactTable } from 'mantine-react-table';
import { deleteAPICall, getAPICall, post, put } from '../../../util/api';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';

const AllExpenseType = () => {
  const navigate = useNavigate();
  const [expenseType, setExpenseType] = useState([]);
  const [deleteResource, setDeleteResource] = useState();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { showToast } = useToast();
  const { t } = useTranslation("global");

  // New expense type form state
  const [newExpenseModalVisible, setNewExpenseModalVisible] = useState(false);
  const [editExpenseModalVisible, setEditExpenseModalVisible] = useState(false);
  const [validated, setValidated] = useState(false);
  const [expenseTypeForm, setExpenseTypeForm] = useState({
    name: '',
    localName: '',
    expense_category: '',
    desc: '',
    show: 1,
  });
  const [currentExpenseTypeId, setCurrentExpenseTypeId] = useState(null);

  const fetchExpenseType = async () => {
    try {
      const response = await getAPICall('/api/expenseType');
      setExpenseType(response); // Keep all fields, including 'id'
    } catch (error) {
      showToast('danger', 'Error occurred ' + error);
    }
  };

  useEffect(() => {
    fetchExpenseType();
  }, []);

  const handleDelete = (p) => {
    setDeleteResource(p); // Store the resource with the full data (including id)
    setDeleteModalVisible(true);
  };

  const onDelete = async () => {
    try {
      await deleteAPICall('/api/expenseType/' + deleteResource.id); // Use the expense `id` from the resource
      setDeleteModalVisible(false);
      fetchExpenseType();
      showToast('success', t("MSG.expense_type_deleted_successfully") || 'Expense type deleted successfully'); // Refresh the list after deletion
    } catch (error) {
      showToast('danger', 'Error occurred ' + error);
    }
  };

  const handleEdit = (p) => {
    setCurrentExpenseTypeId(p.id);
    setExpenseTypeForm({
      name: p.name || '',
      localName: p.localName || '',
      expense_category : p.expense_category || '',
      desc: p.desc || '',
      show: p.show,
    });
    setValidated(false);
    setEditExpenseModalVisible(true);
  };

  const handleNewExpenseTypeClick = () => {
    setExpenseTypeForm({
      name: '',
      localName: '',
      expense_category: '',
      desc: '',
      show: 1,
    });
    setValidated(false);
    setNewExpenseModalVisible(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setExpenseTypeForm({ ...expenseTypeForm, [name]: checked ? 1 : 0 });
    } else if (name === 'name') {
      // Only restrict the main name field to alphanumeric characters
      const regex = /^[a-zA-Z0-9 ]*$/;
      if (regex.test(value)) {
        setExpenseTypeForm({ ...expenseTypeForm, [name]: value });
      }
    } else {
      // Allow all characters for localName and other fields
      setExpenseTypeForm({ ...expenseTypeForm, [name]: value });
    }
  };

  const handleSubmitNewExpenseType = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);

    if (!expenseTypeForm.name) {
      return;
    }

    try {
      // Create a clean object for submission
      const submissionData = {
        name: expenseTypeForm.name,
        localName: expenseTypeForm.localName || '',
        expense_category: expenseTypeForm.expense_category || '',
        desc: expenseTypeForm.desc || '',
        show: expenseTypeForm.show === 1 ? 1 : 0,
        // Add the slug functionality here
        slug: expenseTypeForm.name.replace(/[^\w]/g, '_'), // This will generate a slug
      };

      const resp = await post('/api/expenseType', submissionData);
      if (resp) {
        showToast('success', t("MSG.expense_type_added_successfully_msg") || 'Expense type added successfully');
        setNewExpenseModalVisible(false);
        fetchExpenseType();
      } else {
        showToast('danger', t("MSG.failed_to_add_expense_type_msg") || 'Error occurred. Please try again later.');
      }
    } catch (error) {
      showToast('danger', 'Error occurred: ' + error);
    }
  };


  const handleSubmitEditExpenseType = async (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);

    if (!expenseTypeForm.name) {
      return;
    }

    try {
      // Create a clean object for submission
      const submissionData = {
        name: expenseTypeForm.name,
        localName: expenseTypeForm.localName || '',
        expense_category: expenseTypeForm.expense_category || '',
        desc: expenseTypeForm.desc || '',
        show: expenseTypeForm.show === 1 ? 1 : 0,
      };

      const resp = await put(`/api/expenseType/${currentExpenseTypeId}`, submissionData);
      if (resp) {
        showToast('success', t("MSG.expense_type_updated_successfully_msg") || 'Expense type updated successfully');
        setEditExpenseModalVisible(false);
        fetchExpenseType();
      } else {
        showToast('danger', t("MSG.failed_to_update_expense_type_msg") || 'Error occurred. Please try again later.');
      }
    } catch (error) {
      showToast('danger', 'Error occurred: ' + error);
    }
  };

  const columns = [
    { accessorKey: 'name', header: t("LABELS.name") },
    { accessorKey: 'localName', header: t("LABELS.local_name") },
     { accessorKey: 'expense_category', header: t("LABELS.expense_category") },
    { accessorKey: 'desc', header: t("LABELS.short_desc") },
    {
      accessorKey: 'show',
      header: t("LABELS.status"),
      Cell: ({ cell }) => (
        <CBadge color={cell.row.original.show === 1 ? 'success' : 'danger'}>
          {cell.row.original.show === 1 ? 'Visible' : 'Hidden'}
        </CBadge>
      ),
    },
    {
      accessorKey: 'actions',
      header: t("LABELS.actions"),
      Cell: ({ cell }) => (
        <div>
          <CBadge
            color="info"
            onClick={() => handleEdit(cell.row.original)}
            role="button"
          >
            {t("LABELS.edit")}
          </CBadge>{' '}
          &nbsp;
          <CBadge
            color="danger"
            onClick={() => handleDelete(cell.row.original)}
            role="button"
          >
            {t("LABELS.delete")}
          </CBadge>
        </div>
      ),
    },
  ];

  return (
    <CRow>
      {/* Confirmation Modal for Delete */}
      <ConfirmationModal
        visible={deleteModalVisible}
        setVisible={setDeleteModalVisible}
        onYes={onDelete}
        resource={'Delete expense type - ' + deleteResource?.name}
      />

      {/* New Expense Type Modal */}
      <CModal
        visible={newExpenseModalVisible}
        onClose={() => setNewExpenseModalVisible(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>{t("LABELS.new_expense_type") || "New Expense Type"}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm noValidate validated={validated} onSubmit={handleSubmitNewExpenseType}>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="name"><b>{t("LABELS.name") || "Name"}</b></CFormLabel>
                  <CFormInput
                    type="text"
                    id="name"
                    placeholder=""
                    name="name"
                    value={expenseTypeForm.name}
                    onChange={handleFormChange}
                    required
                    feedbackInvalid={t("MSG.please_provide_name_msg") || "Please provide a name. Only alphabets, numbers and spaces are allowed."}
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="localName"><b>{t("LABELS.local_name") || "Local Name"}</b></CFormLabel>
                  <CFormInput
                    type="text"
                    id="localName"
                    placeholder=""
                    name="localName"
                    value={expenseTypeForm.localName}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
             <div className="mb-3">
            <CFormLabel htmlFor="expense_category"><b>{t("LABELS.expense_category")}</b></CFormLabel>
            <CFormSelect
              id="expense_category"
              name="expense_category"
              value={expenseTypeForm.expense_category}
              onChange={handleFormChange}
              required
              feedbackInvalid="Please select an expense category."
            >
              <option value="">-- Select Category --</option>
              <option value="Operational Expense">Operational Expense</option>
              <option value="Capital Expense">Capital Expense</option>
            </CFormSelect>
          </div>
            <div className="row">
              <div className="col-sm-12">
                <div className="mb-3">
                  <CFormLabel htmlFor="desc"><b>{t("LABELS.short_desc") || "Short Description"}</b></CFormLabel>
                  <CFormInput
                    type="text"
                    id="desc"
                    placeholder=""
                    name="desc"
                    value={expenseTypeForm.desc}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <CFormCheck
                    id="show"
                    label={t("LABELS.visible") || "Visible"}
                    name="show"
                    checked={expenseTypeForm.show === 1}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setNewExpenseModalVisible(false)}
          >
            {t("LABELS.cancel") || "Cancel"}
          </CButton>
          <CButton
            color="primary"
            onClick={handleSubmitNewExpenseType}
          >
            {t("LABELS.submit") || "Submit"}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Edit Expense Type Modal */}
      <CModal
        visible={editExpenseModalVisible}
        onClose={() => setEditExpenseModalVisible(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>{t("LABELS.edit_expense_type") || "Edit Expense Type"}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm noValidate validated={validated} onSubmit={handleSubmitEditExpenseType}>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="edit-name"><b>{t("LABELS.name") || "Name"}</b></CFormLabel>
                  <CFormInput
                    type="text"
                    id="edit-name"
                    placeholder=""
                    name="name"
                    value={expenseTypeForm.name}
                    onChange={handleFormChange}
                    required
                    feedbackInvalid={t("MSG.please_provide_name_msg") || "Please provide a name. Only alphabets, numbers and spaces are allowed."}
                  />
                </div>
              </div>
              <div className="col-sm-6">
                <div className="mb-3">
                  <CFormLabel htmlFor="edit-localName"><b>{t("LABELS.local_name") || "Local Name"}</b></CFormLabel>
                  <CFormInput
                    type="text"
                    id="edit-localName"
                    placeholder=""
                    name="localName"
                    value={expenseTypeForm.localName}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
             <div className="mb-3">
            <CFormLabel htmlFor="expense_category"><b>{t("LABELS.expense_category")}</b></CFormLabel>
            <CFormSelect
              id="expense_category"
              name="expense_category"
              value={expenseTypeForm.expense_category}
              onChange={handleFormChange}
              required
              feedbackInvalid="Please select an expense category."
            >
              <option value="">-- Select Category --</option>
              <option value="Operational Expense">Operational Expense</option>
              <option value="Capital Expense">Capital Expense</option>
            </CFormSelect>
          </div>
            <div className="row">
              <div className="col-sm-12">
                <div className="mb-3">
                  <CFormLabel htmlFor="edit-desc"><b>{t("LABELS.short_desc") || "Short Description"}</b></CFormLabel>
                  <CFormInput
                    type="text"
                    id="edit-desc"
                    placeholder=""
                    name="desc"
                    value={expenseTypeForm.desc}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-6">
                <div className="mb-3">
                  <CFormCheck
                    id="edit-show"
                    label={t("LABELS.visible") || "Visible"}
                    name="show"
                    checked={expenseTypeForm.show === 1}
                    onChange={handleFormChange}
                  />
                </div>
              </div>
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setEditExpenseModalVisible(false)}
          >
            {t("LABELS.cancel") || "Cancel"}
          </CButton>
          <CButton
            color="primary"
            onClick={handleSubmitEditExpenseType}
          >
            {t("LABELS.update") || "Update"}
          </CButton>
        </CModalFooter>
      </CModal>

      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex justify-content-between align-items-center">
            <strong>{t("LABELS.all_expense_types") || "All Expense Types"}</strong>
            <CButton
              color="success"
              onClick={handleNewExpenseTypeClick}
            >
              {t("LABELS.new_expense_type") || "New Expense Type"}
            </CButton>
          </CCardHeader>
          <CCardBody>
            <MantineReactTable
              columns={columns}
              data={expenseType}
              enableFullScreenToggle={false}
              initialState={{ density: 'xs' }}
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default AllExpenseType;
