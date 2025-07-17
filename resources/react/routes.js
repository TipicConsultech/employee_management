import React from 'react'
import { getUserType } from './util/session'

/* ─────────────────────────────  core pages ───────────────────────────── */
const Dashboard       = React.lazy(() => import('./views/dashboard/Dashboard'))

/* ───── register / user management ───── */
const NewUsers        = React.lazy(() => import('./views/pages/register/NewUsers'))
const AllUser         = React.lazy(() => import('./views/pages/register/AllUser'))

/* ───── invoices & delivery ───── */
const Delivery        = React.lazy(() => import('./views/pages/invoice/Delivery'))
const Invoice         = React.lazy(() => import('./views/pages/invoice/Invoice'))
const FactoryInvoice  = React.lazy(() => import('./views/pages/invoice/FactoryInvoice'))
const Booking         = React.lazy(() => import('./views/pages/invoice/Booking'))
const Orders          = React.lazy(() => import('./views/pages/invoice/Orders'))
const InvoiceDetails  = React.lazy(() => import('./views/pages/invoice/InvoiceDetails'))

/* ───── companies ───── */
const NewCompany      = React.lazy(() => import('./views/pages/company/NewCompany'))
const AllCompanies    = React.lazy(() => import('./views/pages/company/AllCompanies'))
const EditCompany     = React.lazy(() => import('./views/pages/company/EditCompany'))
const CompanyReceipts = React.lazy(() => import('./views/pages/company/CompanyReceipt'))

/* ───── products ───── */
const NewProduct      = React.lazy(() => import('./views/pages/products/NewProduct'))
const AllProducts     = React.lazy(() => import('./views/pages/products/AllProducts'))
const EditProduct     = React.lazy(() => import('./views/pages/products/EditProduct'))

/* ───── customers ───── */
const NewCustomer     = React.lazy(() => import('./views/pages/customer/NewCustomer'))
const AllCustomers    = React.lazy(() => import('./views/pages/customer/AllCustomers'))
const EditCustomer    = React.lazy(() => import('./views/pages/customer/EditCustomer'))

/* ───── expenses ───── */
const AllExpenseType  = React.lazy(() => import('./views/pages/expense/AllExpenseType'))
const EditExpenseType = React.lazy(() => import('./views/pages/expense/EditExpenseType'))
const NewExpenseType  = React.lazy(() => import('./views/pages/expense/NewExpenseType'))
const NewExpense      = React.lazy(() => import('./views/pages/expense/NewExpense'))
const expense         = React.lazy(() => import('./views/pages/expense/ExpenseReport'))

/* ───── reports ───── */
const ExpenseReport   = React.lazy(() => import('./views/pages/report/ExpenseReport'))
const CreditReport    = React.lazy(() => import('./views/pages/report/CreditReport'))
const CustomerReport  = React.lazy(() => import('./views/pages/report/CustomerReport'))
const SalesReport     = React.lazy(() => import('./views/pages/report/SalesReport'))
const PnLReport       = React.lazy(() => import('./views/pages/report/PnLReport'))
const All_Reports     = React.lazy(() => import('./views/pages/report/AllReports'))
const creditreport2   = React.lazy(() => import('./views/pages/report/creditreport2'))

/* ───── password / auth helpers ───── */
const Resetpassword   = React.lazy(() => import('./views/pages/Password/Newpassword'))
const Updatepassword  = React.lazy(() => import('./views/pages/Password/updatePassword'))

/* ───── misc ───── */
const JarMap          = React.lazy(() => import('./views/pages/map/Map'))   // (currently unused)
const Plans           = React.lazy(() => import('./views/pages/plans/Plans'))

/* ───── employee_management_pages ───── */
const DocumentVerification = React.lazy(() => import('./views/pages/employee_management_pages/Document_Verification'))
const EmployeeRegistration = React.lazy(() => import('./views/pages/employee_management_pages/Employee_Registration'))
const CreditScreen = React.lazy(() => import('./views/pages/employee_management_pages/CreditScreen'))
const EmployeeTracker = React.lazy(() => import('./views/pages/employee_management_pages/EmployeeTracker'))
const Dashboard2 = React.lazy(() => import('./views/pages/employee_management_pages/Dashboard2'))
const EmployeeDetails = React.lazy(() => import('./views/pages/employee_management_pages/EmployeeDetailsPage'))
const SetCoordinates = React.lazy(() => import('./views/pages/employee_management_pages/SetCoordinates'))
const BulkEmployeeTracker = React.lazy(() => import('./views/pages/employee_management_pages/BulkEmployeeTracker'))
const checkInWithSelfie = React.lazy(() => import('./views/pages/employee_management_pages/CheckInWithSelfie'))
const PayrollAndAttendanceReport = React.lazy(() => import('./views/pages/employee_management_pages/WeeklyPayrollandAttendanceReport'))
const Edit_Employee_Details = React.lazy(() => import('./views/pages/employee_management_pages/Edit_Employee_Details'))
/* ====================================================================== */

export default function fetchRoutes () {
  const user = getUserType()
  let routes = []

  /* ─────────────────────────────  SUPER‑ADMIN  (user === 0) ───────────────────────────── */
  if (user === 0) {
    routes = [
      { path: '/', exact: true, name: 'Home' },

      { path: '/booking',                   name: 'Booking',                    element: Booking },
      { path: '/newCustomer',               name: 'New Customer',               element: Delivery },
      { path: '/company/new',               name: 'New Company',                element: NewCompany },
      { path: '/company/edit/:companyId',   name: 'Edit Company',               element: EditCompany },
      { path: '/company/all',               name: 'All Companies',              element: AllCompanies },
      { path: '/invoice-details/:id',       name: 'Invoice Details',            element: InvoiceDetails },

      { path: '/bookings',                  name: 'Advance Bookings',           element: Orders },
      { path: '/regular',                   name: 'Regular Orders',             element: Orders },
      { path: '/order',                     name: 'All Orders',                 element: Orders },

      { path: '/products/new',              name: 'New Product',                element: NewProduct },
      { path: '/products/all',              name: 'All Products',               element: AllProducts },
      { path: '/products/edit/:id',         name: 'Edit Product',               element: EditProduct },

      { path: '/customer/new',              name: 'New Customer',               element: NewCustomer },
      { path: '/customer/all',              name: 'All Customers',              element: AllCustomers },
      { path: '/customer/edit/:id',         name: 'Edit Customer',              element: EditCustomer },

      { path: '/expense/new-type',          name: 'New Expense Type',           element: NewExpenseType },
      { path: '/expense/edit-type/:id',     name: 'Edit Expense Type',          element: EditExpenseType },
      { path: '/expense/all-type',          name: 'All Expense Types',          element: AllExpenseType },
      { path: '/expense/new',               name: 'New Expense',                element: NewExpense },

      { path: '/Reports/Customer_Report',   name: 'Customer Report',            element: CustomerReport },
      { path: '/Reports/Expense_Report',    name: 'Expense Report',             element: ExpenseReport },
      { path: '/Reports/crateReport',       name: 'Credit Report',              element: CreditReport },
      { path: 'Reports/Sales_Report',       name: 'Sales Report',               element: SalesReport },
      { path: 'Reports/pnl_Report',         name: 'Profit & Loss Report',       element: PnLReport },
      { path: '/Reports/Reports',           name: 'All Reports',                element: All_Reports },

      { path: '/resetPassword',             name: 'Update Password',            element: Resetpassword },
      { path: '/updatepassword',            name: 'Reset Password',             element: Updatepassword },

      { path: '/usermanagement/create-user', name: 'Create User',               element: NewUsers },
      { path: 'usermanagement/all-users',    name: 'All Users',                 element: AllUser },

      { path: 'plans',                      name: 'Plans',                      element: Plans },
      { path: '/company/companyReceipt',    name: 'Company Receipt',            element: CompanyReceipts },
    ]
  }

  /* ─────────────────────────────  ADMIN  (user === 1) ───────────────────────────── */
  else if (user === 1) {
    routes = [
      { path: '/', exact: true, name: 'Home' },
      { path: '/delivery',                 name: 'Delivery',                   element: Delivery },
      { path: '/invoice',                  name: 'Invoice',                    element: Invoice },
      { path: '/factory-invoice',          name: 'Factory Invoice',            element: FactoryInvoice },
      { path: '/invoice-details/:id',      name: 'Invoice Details',            element: InvoiceDetails },

      { path: '/bookings',                 name: 'Advance Bookings',           element: Orders },
      { path: '/regular',                  name: 'Regular Orders',             element: Orders },
      { path: '/order',                    name: 'All Orders',                 element: Orders },

      { path: '/customer/new',             name: 'New Customer',               element: NewCustomer },
      { path: '/customer/all',             name: 'All Customers',              element: AllCustomers },
      { path: '/customer/edit/:id',        name: 'Edit Customer',              element: EditCustomer },

      { path: '/products/new',             name: 'New Product',                element: NewProduct },
      { path: '/products/all',             name: 'All Products',               element: AllProducts },
      { path: '/products/edit/:id',        name: 'Edit Product',               element: EditProduct },

      { path: '/expense/new-type',         name: 'New Expense Type',           element: NewExpenseType },
      { path: '/expense/edit-type/:id',    name: 'Edit Expense Type',          element: EditExpenseType },
      { path: '/expense/all-type',         name: 'All Expense Types',          element: AllExpenseType },
      { path: '/expense/reportExpense',    name: 'Expense Report',             element: expense },
      { path: '/expense/new',              name: 'New Expense',                element: NewExpense },

      { path: '/resetPassword',            name: 'Update Password',            element: Resetpassword },
      { path: '/updatepassword',           name: 'Reset Password',             element: Updatepassword },

      { path: '/Reports/Customer_Report',  name: 'Customer Report',            element: CustomerReport },
      { path: '/Reports/crateReport',      name: 'Credit Report',              element: CreditReport },
      { path: '/Reports/Expense_Report',   name: 'Expense Report',             element: ExpenseReport },
      { path: 'Reports/Sales_Report',      name: 'Sales Report',               element: SalesReport },
      { path: 'Reports/pnl_Report',        name: 'Profit & Loss Report',       element: PnLReport },
      { path: '/Reports/Reports',          name: 'All Reports',                element: All_Reports },

      { path: '/usermanagement/create-user', name: 'Create User',              element: NewUsers },
      { path: 'usermanagement/all-users',    name: 'All Users',                element: AllUser },
      { path: '/Document_verification',    name: ' Document Verification',                element: DocumentVerification },
      { path: '/employee_registration',    name: 'Employee Registration ',                element: EmployeeRegistration },
      { path: '/credit_screen',    name: 'Advance Payment',                element: CreditScreen },
      { path: '/employee_tracker',    name: 'Employee Attendance',                element: EmployeeTracker },
      { path: '/set_coordinates',    name: 'Set Company Location',                element: SetCoordinates },
      { path: '/dashboard',                name: 'Dashboard',                  element: Dashboard2 },
      { path: '/employees/:id',              name: 'Employee Details',           element: EmployeeDetails },
      { path: '/bulk_employee_tracker',              name: 'Employee Details',           element: BulkEmployeeTracker },
      { path: '/checkInWithSelfie',              name: 'Employee Attendance',           element: checkInWithSelfie },
      { path: '/payrollAndAttendanceReport',              name: 'Payroll And Attendace Report',           element: PayrollAndAttendanceReport},
      { path: '/editEmployeeDetails/:id',              name: 'Edit Employee Details',           element: Edit_Employee_Details}
    ]           
  }

  /* ─────────────────────────────  MANAGER  (user === 2) ───────────────────────────── */
  else if (user === 2) {
    routes = [
      { path: '/', exact: true, name: 'Home' },


      { path: '/delivery',                name: 'Delivery',                   element: Delivery },
      { path: '/invoice',                 name: 'Invoice',                    element: Invoice },
      { path: '/factory-invoice',         name: 'Factory Invoice',            element: FactoryInvoice },
      { path: '/booking',                 name: 'Booking',                    element: Booking },
      { path: '/invoice-details/:id',     name: 'Invoice Details',            element: InvoiceDetails },

      { path: '/customer/new',            name: 'New Customer',               element: NewCustomer },
      { path: '/customer/all',            name: 'All Customers',              element: AllCustomers },
      { path: '/customer/edit/:id',       name: 'Edit Customer',              element: EditCustomer },

      { path: '/products/new',            name: 'New Product',                element: NewProduct },
      { path: '/products/all',            name: 'All Products',               element: AllProducts },
      { path: '/products/edit/:id',       name: 'Edit Product',               element: EditProduct },

      { path: '/expense/new-type',        name: 'New Expense Type',           element: NewExpenseType },
      { path: '/expense/edit-type/:id',   name: 'Edit Expense Type',          element: EditExpenseType },
      { path: '/expense/all-type',        name: 'All Expense Types',          element: AllExpenseType },
      { path: '/expense/reportExpense',   name: 'Expense Report',             element: expense },
      { path: '/expense/new',             name: 'New Expense',                element: NewExpense },

      { path: '/resetPassword',           name: 'Update Password',            element: Resetpassword },
      { path: '/updatepassword',          name: 'Reset Password',             element: Updatepassword },

      { path: '/Reports/crateReport',     name: 'Credit Report',              element: CreditReport },
      { path: '/Reports/creditreport',    name: 'Credit Report 2',            element: creditreport2 },
      { path: '/Reports/Customer_Report', name: 'Customer Report',            element: CustomerReport },

      { path: '/usermanagement/create-user', name: 'Create User',             element: NewUsers },
      { path: 'usermanagement/all-users',    name: 'All Users',               element: AllUser },
      { path: '/dashboard',                name: 'Dashboard',                  element: Dashboard2 },
      { path: '/employees/:id',              name: 'Employee Details',           element: EmployeeDetails },
    ]
  }

  /* ─────────────────────────────  PRODUCT ENGINEER  (user === 3) ───────────────────────────── */
  else if (user === 3) {
    routes = [
      { path: '/invoice',                name: 'Invoice',        element: Invoice },
      { path: '/factory-invoice',        name: 'Factory Invoice',element: FactoryInvoice },
      { path: '/invoice-details/:id',    name: 'Invoice Details',element: InvoiceDetails },

      { path: '/resetPassword',          name: 'Update Password',element: Resetpassword },
      { path: '/updatepassword',         name: 'Reset Password', element: Updatepassword },
      { path: '/dashboard',                name: 'Dashboard',                  element: Dashboard2 },
      { path: '/employees/:id',              name: 'Employee Details',           element: EmployeeDetails },
    ]
  }

  /* ─────────────────────────────  DELIVERY TEAM  (user === 4) ───────────────────────────── */
  else if (user === 4) {
    routes = [
      { path: '/delivery',              name: 'Delivery',        element: Delivery },
      { path: '/resetPassword',         name: 'Update Password', element: Resetpassword },
      { path: '/updatepassword',        name: 'Reset Password',  element: Updatepassword },

      { path: '/Reports/crateReport',   name: 'Credit Report',   element: CreditReport },
      { path: '/dashboard',                name: 'Dashboard',                  element: Dashboard2 },
      { path: '/employees/:id',              name: 'Employee Details',           element: EmployeeDetails },
    ]
  }

  /* ─────────────────────────────  LAB TECHNICIAN  (user === 5) ───────────────────────────── */
  else if (user === 5) {
    routes = [
      { path: '/resetPassword',         name: 'Update Password', element: Resetpassword },
      { path: '/updatepassword',        name: 'Reset Password',  element: Updatepassword },
      { path: '/dashboard',                name: 'Dashboard',                  element: Dashboard2 },
      { path: '/employees/:id',              name: 'Employee Details',           element: EmployeeDetails },
    ]
  }

  else if (user === 10) {
    routes = [
      { path: '/resetPassword',         name: 'Update Password', element: Resetpassword },
      { path: '/updatepassword',        name: 'Reset Password',  element: Updatepassword },
 { path: '/checkInWithSelfie',              name: 'Employee Attendance',           element: checkInWithSelfie },
      { path: '/employee_tracker',    name: 'Employee Attendance',                element: EmployeeTracker },
    ]
  }

  return routes
}
