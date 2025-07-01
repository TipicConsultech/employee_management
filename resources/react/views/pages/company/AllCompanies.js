import React, { useEffect, useState } from 'react';
import { CBadge, CRow } from '@coreui/react';
import { MantineReactTable } from 'mantine-react-table';
import { getAPICall, put } from '../../../util/api';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../common/toast/ToastContext';
import { getUserData } from '../../../util/session';
import NewUserModal from '../../common/NewUserModal';
import EditCompanyModal from './EditCompanyModal';

const AllCompanies = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [blockCompany, setBlockCompany] = useState();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRow, setSelectedRow] = useState({});
  const { showToast } = useToast();
  const user = getUserData();
  const userType = user.type;

  const fetchCompanies = async () => {
    try {
      const response = await getAPICall('/api/company');
      if(userType == 0){
        setCustomers(response);
      }else{
        setCustomers(response.filter(r=> r.refer_by_id == user.id))
      }
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleBlock = (p) => {
    setBlockCompany(p);
    setDeleteModalVisible(true);
  };

  const onDelete = async () => {
    try {
      await put('/api/company/'+blockCompany.company_id, {...blockCompany, block_status: blockCompany.block_status == 0});
      setDeleteModalVisible(false);
      fetchCompanies();
      showToast('success', 'Updated successfully');
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
  };

  const handleEdit = (p) => {
    setSelectedRow(p);
    setEditModalVisible(true);
  };

  const handleUserCreation = (p) => {
    setSelectedRow(p);
    setUserModalVisible(true);
  };

  const columns = [
    { accessorKey: 'index', header: 'Id' },
    { accessorKey: 'company_name', header: 'Name' },
    { accessorKey: 'phone_no', header: 'Mobile' },
    { accessorKey: 'email_id', header: 'Email' },
    { accessorKey: 'Tal', header: 'Address',
      Cell: ({ cell }) => (
        <>{cell.row.original.land_mark}</>
      ),
     },
     { accessorKey: 'subscription_validity', header: 'Valid Till' },
    {
      accessorKey: 'block_status',
      header: 'Status',
      Cell: ({ cell }) => (
        cell.row.original.block_status == 0 ? (
          <CBadge color="success">Active</CBadge>
        ) : (
          <CBadge color="danger">Blocked</CBadge>
        )
      ),
    },
    {
      accessorKey: 'actions',
      header: 'Actions',
      Cell: ({ cell }) => (
        userType == 0 ?
        <div>
          <CBadge
            role="button"
            color="success"
            onClick={() => handleUserCreation(cell.row.original)}
          >
            Create User
          </CBadge>
          &nbsp;
          <CBadge
            role="button"
            color="info"
            onClick={() => handleEdit(cell.row.original)}
          >
            Edit
          </CBadge>
          &nbsp;
          <CBadge
            role="button"
            color="danger"
            onClick={() => handleBlock(cell.row.original)}
          >
            {cell.row.original.block_status == 0 ? 'Block' : 'Unblock'}
          </CBadge>
        </div>
        :
        <div>
          <CBadge
            role="button"
            color="info"
            onClick={() => handleEdit(cell.row.original)}
          >
            Edit
          </CBadge>
          &nbsp;
          <CBadge
            role="button"
            color="danger"
            onClick={() => handleBlock(cell.row.original)}
          >
            {cell.row.original.block_status == 0 ? 'Block' : 'Unblock'}
          </CBadge>
        </div>
      ),
    },
  ];

  const data = customers.map((p, index) => ({
    ...p,
    index: index + 1,
  }));

  return (
    <CRow>
      <ConfirmationModal
        visible={deleteModalVisible}
        setVisible={setDeleteModalVisible}
        onYes={onDelete}
        resource={'Block company "' + blockCompany?.company_name +'"'}
      />
      <NewUserModal
        visible={userModalVisible}
        setVisible={setUserModalVisible}
        data={selectedRow}
      />
      <EditCompanyModal
        visible={editModalVisible}
        setVisible={setEditModalVisible}
        companyData={selectedRow}
        onSuccess={fetchCompanies}
      />
      <MantineReactTable 
      defaultColumn={{
          maxSize: 400,
          minSize: 80,
          size: 100, //default size is usually 180
        }} 
        enableStickyHeader={true}
        enableStickyFooter={true}
        enableDensityToggle={false}
        initialState={{density: 'sm'}}
        enableColumnResizing 
        columns={columns} 
        data={data} 
        enableFullScreenToggle={false}/>
    </CRow>
  );
};

export default AllCompanies;