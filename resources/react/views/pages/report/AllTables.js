// import React from 'react';
// import { MantineReactTable,useMantineReactTable } from 'mantine-react-table';
// import { CBadge } from '@coreui/react';
// import { useTranslation } from 'react-i18next';


// function All_Tables({ selectedOption, salesData, expenseData, pnlData, expenseType }) {
//   const salesColumns = [
//     { accessorKey: 'invoiceDate', header: 'Invoice Date' },
//     { accessorKey: 'totalAmount', header: 'Total Amount' },
//     { accessorKey: 'paidAmount', header: 'Paid Amount' },
//     { accessorKey: 'remainingAmount', header: 'Remaining Amount' },
//   ];
// const { t } = useTranslation("global");
//   const expenseColumns = [
  
//     { accessorKey: 'expense_date', header: 'Date' },

//     { accessorKey: 'name', header: 'Details' },
//     {
//     accessorKey: 'expense_type.expense_category',
//     header: t("LABELS.expense_category") || 'Expense Category',
//     Cell: ({ cell }) => cell.getValue() || '-', // fallback if null
//   },
//     { accessorKey: 'qty', header: 'Quantity' },
//     { accessorKey: 'price', header: 'Price Per Unit' },
//     { accessorKey: 'total_price', header: 'Total Cost' },

//   ];

//   const pnlColumns = [
//     { accessorKey: 'date', header: 'Date' },
//     { accessorKey: 'totalSales', header: 'Total Sales' },
//     { accessorKey: 'totalExpenses', header: 'Total Expenses' },
//     {
//       accessorKey: 'profitOrLoss',
//       header: 'Profit/Loss',
//       Cell: ({ cell }) => (
//         <CBadge color={cell.getValue() >= 0 ? 'success' : 'danger'}>
//           {cell.getValue()}
//         </CBadge>
//       ),
//     },
//   ];

//   return (
//     <div>
//       {selectedOption === '1' && (
//         <MantineReactTable columns={salesColumns} data={salesData.data} enableFullScreenToggle={false}/>
//       )}
//       {selectedOption === '2' && (
//         <MantineReactTable columns={expenseColumns} data={expenseData.data} enableFullScreenToggle={false}/>
//       )}
//       {selectedOption === '3' && (
//         <MantineReactTable columns={pnlColumns} data={pnlData.Data} enableFullScreenToggle={false} />
//       )}
//     </div>
//   );
// }

// export default All_Tables;
import React from 'react';
import { MantineReactTable } from 'mantine-react-table';
import { CBadge } from '@coreui/react';
import { useTranslation } from 'react-i18next';

function All_Tables({
  selectedOption,
  salesData,
  expenseData,
  pnlData,
  expenseType,
  productWiseData,
}) {
  const { t } = useTranslation('global');

  const salesColumns = [
    { accessorKey: 'invoiceDate', header: 'Invoice Date' },
    { accessorKey: 'totalAmount', header: 'Total Amount' },
    { accessorKey: 'paidAmount', header: 'Paid Amount' },
    { accessorKey: 'remainingAmount', header: 'Remaining Amount' },
  ];

  const expenseColumns = [
    { accessorKey: 'expense_date', header: 'Date' },
    { accessorKey: 'name', header: 'Details' },
    {
      accessorKey: 'expense_type.expense_category',
      header: t('LABELS.expense_category') || 'Expense Category',
      Cell: ({ cell }) => cell.getValue() || '-',
    },
    { accessorKey: 'qty', header: 'Quantity' },
    { accessorKey: 'price', header: 'Price Per Unit' },
    { accessorKey: 'total_price', header: 'Total Cost' },
  ];

  const pnlColumns = [
    { accessorKey: 'date', header: 'Date' },
    { accessorKey: 'totalSales', header: 'Total Sales' },
    { accessorKey: 'totalExpenses', header: 'Total Expenses' },
    {
      accessorKey: 'profitOrLoss',
      header: 'Profit/Loss',
      Cell: ({ cell }) => (
        <CBadge color={cell.getValue() >= 0 ? 'success' : 'danger'}>
          ₹{Number(cell.getValue() || 0).toLocaleString()}
        </CBadge>
      ),
    },
  ];

  const productEarningsColumns = [
  { accessorKey: 'product_name', header: 'Product Name' },
  {
    accessorKey: 'product_oPrice',
    header: 'Price / Product',
    Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
  },
  {
    accessorKey: 'totalQty',
    header: 'Quantity Sold',
    Cell: ({ cell }) => cell.getValue() || 0,
  },
  {
    accessorKey: 'totalRevenue',
    header: 'Total Revenue (₹)',
    Cell: ({ cell }) => `₹${Number(cell.getValue() || 0).toLocaleString()}`,
  },
];


  return (
    <div>
      {selectedOption === '1' && (
        <MantineReactTable
          columns={salesColumns}
          data={salesData?.data || []}
          initialState={{ density: 'xs' }}
          enableFullScreenToggle={false}
        />
      )}

      {selectedOption === '2' && (
        <MantineReactTable
          columns={expenseColumns}
          data={expenseData?.data || []}
          initialState={{ density: 'xs' }}
          enableFullScreenToggle={false}
        />
      )}

      {selectedOption === '3' && (
        <MantineReactTable
          columns={pnlColumns}
          data={pnlData?.Data || []}
          initialState={{ density: 'xs' }}
          enableFullScreenToggle={false}
        />
      )}

      {selectedOption === '4' && (
        <MantineReactTable
          columns={productEarningsColumns}
          // data={
          //   Array.isArray(productWiseData)
          //     ? productWiseData.map((item) => ({
          //         ...item,
          //         totalQty: `${Number(item.totalQty)}` + ` ${item?.product_unit}`,
          //         totalRevenue: Number(item.totalRevenue) ,
          //       }))
          //     : []
          // }
          data={ productWiseData.map((item) => ({
    ...item,
    // Fix: Use template literal or proper string concatenation
    totalQty: item?.totalQty + " "+item?.product_unit,
    totalRevenue: Number(item.totalRevenue),
  }))}
          initialState={{ density: 'xs' }}
          enableFullScreenToggle={false}
        />
      )}
    </div>
  );
}

export default All_Tables;
