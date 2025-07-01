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
  CRow,
} from '@coreui/react';
import { MantineReactTable } from 'mantine-react-table';
import { deleteAPICall, getAPICall } from '../../../util/api';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';
import CIcon from '@coreui/icons-react';
import { cilMoney } from '@coreui/icons';

const AllExpenses = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [deleteResource, setDeleteResource] = useState();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { showToast } = useToast();
  const { t } = useTranslation("global");
  
  // Date filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // const fetchExpenses = async () => {
  //   if (!startDate || !endDate) {
  //     showToast('warning', t("MSG.please_select_date_range") || 'Please select a date range');
  //     return;
  //   }
    
  //   setIsLoading(true);
  //   try {
  //     const response = await getAPICall(`/api/expense?startDate=${startDate}&endDate=${endDate}`);
  //     if (response.error) {
  //       showToast('danger', response.error);
  //     } else {
  //       setExpenses(response);
  //     }
  //   } catch (error) {
  //     showToast('danger', 'Error occurred: ' + error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const fetchExpenses = async (filter = false) => {
  setIsLoading(true);
  try {
    let url = '/api/expense';
    if (filter && startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }

    const response = await getAPICall(url);

    if (response.error) {
      showToast('danger', response.error);
    } else {
      setExpenses(response);
    }
  } catch (error) {
    showToast('danger', 'Error occurred: ' + error);
  } finally {
    setIsLoading(false);
  }
};


  // useEffect(() => {
  //   // Set default date range to current month
  //   const today = new Date();
  //   const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  //   const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
  //   setStartDate(firstDay.toISOString().split('T')[0]);
  //   setEndDate(lastDay.toISOString().split('T')[0]);
  // }, []);

  // const handleDelete = (expense) => {
  //   setDeleteResource(expense);
  //   setDeleteModalVisible(true);
  // };
  useEffect(() => {
  // Set default date range to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  setStartDate(firstDay.toISOString().split('T')[0]);
  setEndDate(lastDay.toISOString().split('T')[0]);

  fetchExpenses(); // Fetch all expenses initially
}, []);


  const onDelete = async () => {
    try {
      await deleteAPICall('/api/expense/' + deleteResource.id);
      setDeleteModalVisible(false);
      fetchExpenses(); // Refresh the list after deletion
      showToast('success', t("MSG.expense_deleted_successfully") || 'Expense deleted successfully');
    } catch (error) {
      showToast('danger', 'Error occurred: ' + error);
    }
  };

  const handleEdit = (expense) => {
    navigate('/expense/edit/' + expense.id);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR', // Indian Rupee
    }).format(amount);
  };
  

  const columns = [
   {
  accessorKey: 'expense_date', 
  header: t("LABELS.date") || 'Date',
  Cell: ({ cell }) => {
    const date = new Date(cell.getValue());
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
},

    { accessorKey: 'name', header: t("LABELS.expense_name") || 'Expense Name' },
    {
    accessorKey: 'expense_type.expense_category',
    header: t("LABELS.expense_category") || 'Expense Category',
    Cell: ({ cell }) => cell.getValue() || '-', // fallback if null
  },
    { 
      accessorKey: 'price', 
      header: t("LABELS.price_per_unit") || 'Price Per Unit',
      Cell: ({ cell }) => formatCurrency(cell.getValue())
    },
    { accessorKey: 'qty', header: t("LABELS.quantity") || 'Quantity' },
    { 
      accessorKey: 'total_price', 
      header: t("LABELS.total_price") || 'Total Price',
      Cell: ({ cell }) => formatCurrency(cell.getValue())
    },
    {
      accessorKey: 'actions',
      header: t("LABELS.actions") || 'Actions',
      Cell: ({ cell }) => (
        <div>
          
          <CBadge
            color="danger"
            onClick={() => handleDelete(cell.row.original)}
            role="button"
          >
            {t("LABELS.delete") || 'Delete'}
          </CBadge>
        </div>
      ),
    },
  ];

  return (
    <CRow>
      <ConfirmationModal
        visible={deleteModalVisible}
        setVisible={setDeleteModalVisible}
        onYes={onDelete}
        resource={`Delete expense - ${deleteResource?.name}`}
      />
      
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{t("LABELS.all_expenses") || "All Expenses"}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm className="mb-4">
              <CRow>
                <CCol md={3}>
                  <CFormLabel htmlFor="startDate">{t("LABELS.start_date") || "Start Date"}</CFormLabel>
                  <CFormInput
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel htmlFor="endDate">{t("LABELS.end_date") || "End Date"}</CFormLabel>
                  <CFormInput
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </CCol>
                <CCol md={2} className="d-flex align-items-end">
                  {/* <CButton 
                    color="primary" 
                    onClick={fetchExpenses}
                    disabled={isLoading}
                  >
                    {isLoading ? t("LABELS.loading") || "Loading..." : t("LABELS.filter") || "Filter"}
                  </CButton> */}
                  <CCol md={4} className="d-flex align-items-end gap-2 mt-2">
                  <CButton 
  color="primary" 
  onClick={() => fetchExpenses(true)} // pass `true` to apply date filtering
  disabled={isLoading}
>
  {isLoading ? t("LABELS.loading") || "Loading..." : t("LABELS.filter") || "Filter"}
</CButton>
 <CButton 
    color="secondary" 
    variant="outline"
    onClick={() => {
      setStartDate('');
      setEndDate('');
      fetchExpenses(); // no filter = fetch all
    }}
  >
    {t("LABELS.reset") || "Reset"}
  </CButton>
  </CCol>

                </CCol>
                {/* <CCol md={4} className="d-flex align-items-end justify-content-end">
                  <CButton 
                    color="success" 
                    onClick={() => navigate('/expense/new')}
                  >
                    {t("LABELS.new_expense") || "New Expense"}
                  </CButton>
                </CCol> */}
              </CRow>
            </CForm>
            
            {/* <MantineReactTable
              columns={columns}
              data={expenses}
              enableFullScreenToggle={false}
              state={{ isLoading }}
              initialState={{
                sorting: [{ id: 'expense_date', desc: true }],
              }}
              renderEmptyState={() => (
                <div className="p-4 text-center">
                  {startDate && endDate ? (
                    <div>
                      <p>{t("MSG.no_expenses_found") || "No expenses found for the selected date range."}</p>
                      <CButton 
                        color="primary" 
                        onClick={() => navigate('/expense/new')}
                        size="sm"
                      >
                        {t("LABELS.add_expense") || "Add Expense"}
                      </CButton>
                    </div>
                  ) : (
                    <p>{t("MSG.select_date_range_to_view_expenses") || "Select a date range to view expenses."}</p>
                  )}
                </div>
              )}
            /> */}

{/* Total Footer
{expenses.length > 0 && (
  <div className="d-flex justify-content-between mt-3 pe-3">
    <h5>
      {t("LABELS.total_expense") || "Total Expense"}:{' '}
      <strong>
        {new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(
          expenses.reduce((total, item) => total + parseFloat(item.total_price || 0), 0)
        )}
      </strong>
    </h5>
  </div>
)} */}
{expenses.length > 0 && (
  <CCard className="mt-4 shadow-sm border-0">
    <CCardBody className="d-flex justify-content-end align-items-center">
      <div className="d-flex align-items-center">
        <CIcon
          icon={cilMoney} // Make sure to import the icon
          size="xl"
          className="me-3 text-success"
        />
        <h5 className="mb-0">
          {t("LABELS.total_expense") || "Total Expense"}:
        </h5> &nbsp;&nbsp;&nbsp;
      </div>
      <h4 className="mb-0 fw-bold text-success">
        {new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
        }).format(
          expenses.reduce((total, item) => total + parseFloat(item.total_price || 0), 0)
        )}
      </h4>
    </CCardBody>
  </CCard>
)}


            <MantineReactTable
  columns={columns}
  data={expenses}
  enableFullScreenToggle={false}
  state={{ isLoading }}
   initialState={{
            density: 'xs',
            sorting: [{ id: 'expense_date', desc: true }],
          }}
  renderEmptyState={() => (
    <div className="p-4 text-center">
      {startDate && endDate ? (
        <div>
          <p>{t("MSG.no_expenses_found") || "No expenses found for the selected date range."}</p>
          <CButton 
            color="primary" 
            onClick={() => navigate('/expense/new')}
            size="sm"
          >
            {t("LABELS.add_expense") || "Add Expense"}
          </CButton>
        </div>
      ) : (
        <p>{t("MSG.select_date_range_to_view_expenses") || "Select a date range to view expenses."}</p>
      )}
    </div>
  )}
/>



          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default AllExpenses;