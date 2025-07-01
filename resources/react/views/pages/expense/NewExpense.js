import React, { useEffect, useState } from 'react';
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';
import { getAPICall, post } from '../../../util/api';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';

const NewExpense = () => {
  const [validated, setValidated] = useState(false);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [expensesList, setExpensesList] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation("global");
  const [state, setState] = useState({
    name: '',
    desc: '',
    expense_id: undefined,
    typeNotSet: true,
    qty: 0,
    price: 0,
    total_price: 0,
    expense_date: new Date().toISOString().split('T')[0],
    show: true,
  });

  // Helper function to get current language
  const getCurrentLanguage = () => {
    return localStorage.getItem('i18nextLng') || 'en';
  };

  const fetchExpenseTypes = async () => {
    try {
      const response = await getAPICall('/api/expenseType');
      const options = ['Select Expense Type'];
      options.push(
        ...response
          .filter((p) => p.show === 1)
          .map((p) => ({
            label: getCurrentLanguage() === 'mr' ? (p.localname || p.name) : p.name,
            value: p.id,
            disabled: p.show !== 1,
            name: p.name,
            localname: p.localname,
          }))
      );
      setExpenseTypes(options);
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
  };

  useEffect(() => {
    fetchExpenseTypes();
  }, []);

  // Refetch expense types when language changes
  useEffect(() => {
    fetchExpenseTypes();
  }, [t]);

  const calculateFinalAmount = (old) => {
    old.total_price = (parseFloat(old.price) || 0) * (parseInt(old.qty) || 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price' || name === 'qty') {
      setState((prev) => {
        const old = { ...prev };
        old[name] = value;
        calculateFinalAmount(old);
        return { ...old };
      });
    } else if (name === 'expense_id') {
      setState((prev) => {
        const old = { ...prev };
        old[name] = value;
        old.typeNotSet = !value;

        return { ...old };
      });
    } else if (name === 'name') {
      const regex = /^[a-zA-Z0-9 ]*$/;
      if (regex.test(value)) {
        setState({ ...state, [name]: value });
      }
    } else {
      setState({ ...state, [name]: value });
    }
  };

  const addToExpensesList = () => {
    if (state.expense_id && state.price > 0 && state.qty > 0 && state.name) {
      const expenseType = expenseTypes.find(type => type.value === parseInt(state.expense_id));
      const newExpense = {
        ...state,
        expense_type_name: expenseType ? 
          (getCurrentLanguage() === 'mr' ? (expenseType.localname || expenseType.name) : expenseType.name) 
          : 'Unknown',
        id: Date.now() // Temporary ID for display
      };
      
      if (editingExpense) {
        // Update existing expense
        const updatedList = expensesList.map(expense => 
          expense.id === editingExpense.id ? { ...newExpense, id: editingExpense.id } : expense
        );
        setExpensesList(updatedList);
        showToast('success', t("MSG.expense_updated_successfully"));
        setEditingExpense(null);
      } else {
        // Add new expense
        setExpensesList([...expensesList, newExpense]);
        showToast('success', t("MSG.expense_added_to_list"));
      }
      
      handleClear();
    } else {
      setState((old) => ({ ...old, typeNotSet: old.expense_id === undefined }));
      showToast('danger', t("MSG.fill_required_fields"));
    }
  };

  const editExpenseFromList = (expense) => {
    setState({
      name: expense.name,
      desc: expense.desc || '',
      expense_id: expense.expense_id,
      typeNotSet: false,
      qty: expense.qty,
      price: expense.price,
      total_price: expense.total_price,
      expense_date: expense.expense_date,
      show: expense.show,
    });
    setEditingExpense(expense);
    setValidated(false);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('info', t("MSG.expense_loaded_for_editing"));
  };

  const cancelEdit = () => {
    setEditingExpense(null);
    handleClear();
    showToast('info', t("MSG.edit_cancelled"));
  };

  const removeFromExpensesList = (id) => {
    const updatedList = expensesList.filter((expense) => expense.id !== id);
    setExpensesList(updatedList);
    
    // If we're editing the expense being removed, cancel the edit
    if (editingExpense && editingExpense.id === id) {
      setEditingExpense(null);
      handleClear();
    }
    
    showToast('info', t("MSG.expense_removed_from_list"));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);

    if (state.expense_id && state.price > 0 && state.qty > 0 && state.name) {
      try {
        const resp = await post('/api/expense', { ...state });
        if (resp) {
          showToast('success', t("MSG.new_expense_added_successfully_msg"));
        } else {
          showToast('danger', t("MSG.error_occured_please_try_again_later_msg"));
        }
        handleClear();
      } catch (error) {
        showToast('danger', 'Error occured ' + error);
      }
    } else {
      setState((old) => ({ ...old, typeNotSet: old.expense_id === undefined }));
    }
  };

  const submitAllExpenses = async () => {
    if (expensesList.length === 0) {
      showToast('warning', t("MSG.add_atleast_one_expense"));
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmitAllExpenses = async () => {
    try {
      const promises = expensesList.map(expense => {
        const { id, expense_type_name, ...expenseData } = expense;
        return post('/api/expense', expenseData);
      });

      const results = await Promise.all(promises);
      const successCount = results.filter(result => result).length;

      if (successCount === expensesList.length) {
        showToast('success', t("MSG.expenses_submitted_successfully", { count: successCount }));
        setExpensesList([]);
        setEditingExpense(null);
      } else {
        showToast('warning', t("MSG.partial_expenses_submitted", { success: successCount, total: expensesList.length }));
      }
    } catch (error) {
      showToast('danger', t("MSG.error_occurred") + ': ' + error);
    }
    
    setShowConfirmModal(false);
  };

  const getTotalAmount = () => {
    return expensesList.reduce((total, expense) => total + expense.total_price, 0).toFixed(2);
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const today = new Date().toISOString().split('T')[0];
  const handleClear = async () => {
    setState({
      name: '',
      desc: '',
      expense_id: state.expense_id, // Keep the selected expense type
      qty: 0,
      price: 0,
      total_price: 0,
      expense_date: today,
      show: true,
      typeNotSet: false, // Don't reset type validation since we're keeping the expense_id
    });
    setValidated(false);
  };

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <div className="d-flex justify-content-between align-items-center">
                <strong>
                  {editingExpense ? t("LABELS.edit_expense") : t("LABELS.new_expense")}
                  {editingExpense && (
                    <span className="ms-2 badge bg-warning text-dark">
                      {t("LABELS.editing_mode")}
                    </span>
                  )}
                </strong>
                <CButton
                  color="danger"
                  size="sm"
                  onClick={() => window.location.href = "/#/expense/new-type"}
                >
                  {t("LABELS.new_expense_type")}
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <CForm noValidate validated={validated} onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-sm-4">
                    <div className="">
                      <CFormLabel htmlFor="expense_id"><b>{t("LABELS.expense_type")}</b></CFormLabel>
                    </div>
                    <CFormSelect
                      aria-label={t("MSG.select_expense_type_msg")}
                      value={state.expense_id}
                      id="expense_id"
                      name="expense_id"
                      onChange={handleChange}
                      required
                      feedbackInvalid={t("MSG.select_expense_type_validation")}
                    >
                      <option value="">{t("MSG.select_expense_type_msg")}</option>
                     {expenseTypes.slice(1).map((type) => (
 <option key={type.value} value={type.value} disabled={type.disabled}>
  {getCurrentLanguage() === 'mr' ? (type.localname || type.name) : type.name}
</option>

))}

                    </CFormSelect>
                  </div>
                  <div className="col-sm-4">
                    <div className="mb-3">
                      <CFormLabel htmlFor="name"><b>{t("LABELS.about_expense")}</b></CFormLabel>
                     <CFormInput
  type="text"
  id="name"
  placeholder={t("LABELS.enter_expense_description")}
  name="name"
  value={state.name}
  onChange={(e) => {
    // Remove any numeric characters from the input
    const filteredValue = e.target.value.replace(/[0-9]/g, '');
    
    // Create a synthetic event with the filtered value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: filteredValue,
        name: e.target.name
      }
    };
    
    handleChange(syntheticEvent);
  }}
  onKeyPress={(e) => {
    // Prevent numeric keys from being entered
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  }}
  required
  feedbackInvalid={t("MSG.expense_description_validation")}
/>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="mb-3">
                      <CFormLabel htmlFor="expense_date"><b>{t("LABELS.expense_date")}</b></CFormLabel>
                      <CFormInput
                        type="date"
                        id="expense_date"
                        name="expense_date"
                        max={today}
                        value={state.expense_date}
                        onChange={handleChange}
                        required
                        feedbackInvalid={t("MSG.select_date_validation")}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-3">
                      <CFormLabel htmlFor="price"><b>{t("LABELS.price_per_unit")}</b></CFormLabel>
                      <CFormInput
                        type="number"
                        min="0"
                        id="price"
                        placeholder="0.00"
                        name="price"
                        onFocus={() => setState(prev => ({ ...prev, price: '' }))}
                        value={state.price}
                        onChange={handleChange}
                        required
                        feedbackInvalid={t("MSG.price_validation")}
                      />
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="mb-3">
                      <CFormLabel htmlFor="qty"><b>{t("LABELS.total_units")}</b></CFormLabel>
                      <CFormInput
                        type="number"
                        id="qty"
                        placeholder="1"
                        name="qty"
                        min="0"
                        value={state.qty}
                        onFocus={() => setState(prev => ({ ...prev, qty: '' }))}
                        onChange={handleChange}
                        required
                        feedbackInvalid={t("MSG.quantity_validation")}
                      />
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="mb-3">
                      <CFormLabel htmlFor="total_price"><b>{t("LABELS.total_price")}</b></CFormLabel>
                      <CFormInput
                        type="number"
                        min="0"
                        id="total_price"
                        placeholder=""
                        name="total_price"
                       
                        value={state.total_price}
                        onChange={handleChange}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                <div className="mb-3 mt-3">
                  <CButton color="success" type="submit">
                    {t("LABELS.submit")}
                  </CButton>
                  &nbsp;
                  <CButton color="primary" type="button" onClick={addToExpensesList}>
                    {editingExpense ? t("LABELS.update_in_list") : t("LABELS.add_to_list")}
                  </CButton>
                  &nbsp;
                  {editingExpense && (
                    <>
                      <CButton color="warning" type="button" onClick={cancelEdit}>
                        {t("LABELS.cancel_edit")}
                      </CButton>
                      &nbsp;
                    </>
                  )}
                  <CButton color="secondary" onClick={handleClear}>
                    {t("LABELS.clear")}
                  </CButton>
                </div>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Expenses List */}
      {expensesList.length > 0 && (
        <CRow>
          <CCol xs={12}>
            <CCard className="mb-4">
              <CCardHeader>
                <div className="d-flex justify-content-between align-items-center">
                  <strong>{t("LABELS.expenses_list")} ({expensesList.length})</strong>
                  <span>{t("LABELS.total_amount")}: <strong>{formatCurrency(getTotalAmount())}</strong></span>
                </div>
              </CCardHeader>
              <CCardBody>
                <div className="table-responsive">
                  <CTable striped hover>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Expense Type</CTableHeaderCell>
                        <CTableHeaderCell>Description</CTableHeaderCell>
                        <CTableHeaderCell>Date</CTableHeaderCell>
                        <CTableHeaderCell>Price</CTableHeaderCell>
                        <CTableHeaderCell>Quantity</CTableHeaderCell>
                        <CTableHeaderCell>Total</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {expensesList.map((expense) => (
                        <CTableRow 
                          key={expense.id}
                          className={editingExpense && editingExpense.id === expense.id ? 'table-warning' : ''}
                        >
                          <CTableDataCell>{expense.expense_type_name}</CTableDataCell>
                          <CTableDataCell>{expense.name}</CTableDataCell>
                          <CTableDataCell>{expense.expense_date}</CTableDataCell>
                          <CTableDataCell>{formatCurrency(expense.price)}</CTableDataCell>
                          <CTableDataCell>{expense.qty}</CTableDataCell>
                          <CTableDataCell>{formatCurrency(expense.total_price)}</CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="info"
                              size="sm"
                              onClick={() => editExpenseFromList(expense)}
                              className="me-1"
                              disabled={editingExpense && editingExpense.id === expense.id}
                            >
                              {editingExpense && editingExpense.id === expense.id 
                                ? t("LABELS.editing") 
                                : t("LABELS.edit")
                              }
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              onClick={() => removeFromExpensesList(expense.id)}
                            >
                              {t("LABELS.remove")}
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
                <div className="mt-3">
                  <CButton 
                    color="success" 
                    size="lg" 
                    onClick={submitAllExpenses}
                    disabled={editingExpense !== null}
                  >
                    {t("LABELS.submit_all_expenses")} ({expensesList.length})
                  </CButton>
                  {editingExpense && (
                    <div className="mt-2">
                      <small className="text-warning">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        {t("MSG.complete_edit_before_submit")}
                      </small>
                    </div>
                  )}
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}

      {/* Confirmation Modal */}
      <CModal visible={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <CModalHeader>
          <CModalTitle>{t("LABELS.confirm_submission")}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>{t("MSG.confirm_submit_expenses", { count: expensesList.length })}</p>
          <p><strong>{t("LABELS.total_amount")}: {formatCurrency(getTotalAmount())}</strong></p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowConfirmModal(false)}>
            {t("LABELS.cancel")}
          </CButton>
          <CButton color="primary" onClick={confirmSubmitAllExpenses}>
            {t("LABELS.confirm_submit")}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default NewExpense;