import React, { useEffect, useState } from 'react';
import { CBadge, CRow, CButton } from '@coreui/react';
import { MantineReactTable } from 'mantine-react-table';
import { getAPICall } from '../../../util/api';
import { useToast } from '../../common/toast/ToastContext';

const CompanyReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const { showToast } = useToast();

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const response = await getAPICall(`/api/company-receipts?page=${page}&search=${search}&status=${filterStatus}`);
      setReceipts(response.data.data || []);
      setTotalPages(response.data.last_page || 1);
    } catch (error) {
      showToast('danger', 'Error fetching company receipts');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReceipts();
  }, [page, search, filterStatus]);

  const columns = [
    { accessorKey: 'index', header: 'Id' },
    { accessorKey: 'company.company_name', header: 'Company Name' },
    { accessorKey: 'company.phone_no', header: 'Mobile' },
    { accessorKey: 'company.email_id', header: 'Email' },
    { accessorKey: 'plan.name', header: 'Plan' },
    { accessorKey: 'total_amount', header: 'Total Amount' },
    { accessorKey: 'transaction_id', header: 'Transaction ID' },
    { accessorKey: 'valid_till', header: 'Valid Till' },
    {
      accessorKey: 'transaction_status',
      header: 'Status',
      Cell: ({ cell }) => (
        cell.getValue() === 'success' ? (
          <CBadge color="success">Success</CBadge>
        ) : (
          <CBadge color="danger">Failed</CBadge>
        )
      ),
    },
  ];

  const data = receipts.map((r, index) => ({
    ...r,
    index: index + 1,
  }));

  return (
    <CRow>
      
      <MantineReactTable 
        columns={columns} 
        data={data} 
        enableStickyHeader={true}
        enableStickyFooter={true}
        enableDensityToggle={false}
        enableColumnResizing 
        enableFullScreenToggle={false}
      />
      <div className="d-flex justify-content-between align-items-center mt-3">
        <CButton disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</CButton>
        <span>Page {page} of {totalPages}</span>
        <CButton disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</CButton>
      </div>
    </CRow>
  );
};

export default CompanyReceipts;
