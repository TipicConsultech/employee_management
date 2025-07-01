import { getAPICall } from "./api";

// Function to fetch customers and store them in local storage
export async function fetchCustomers(){
    const cachedData = localStorage.getItem('customers');
    const cachedTime = localStorage.getItem('customersTime');

    // Check if cached data exists and is not expired (24 hours)
    if (cachedData && cachedTime) {
        const now = new Date().getTime();
        const expirationTime = 15 * 60 * 1000; // 15 minutes in milliseconds

        if (now - cachedTime < expirationTime) {
            return JSON.parse(cachedData); // Return cached data
        }
    }

    // If no valid cached data, fetch from API
    try {
        const customers = await getAPICall('/api/customer'); // Adjust the API endpoint as needed

        if(customers?.length > 0){
            // Store fetched data in local storage
            localStorage.setItem('customers', JSON.stringify(customers));
            localStorage.setItem('customersTime', new Date().getTime()); // Store current time
            return customers;
        }
        return [];
    } catch (error) {
        console.error('Error fetching customers:', error);
        return []; // Return an empty array in case of error
    }
};

export function invalidateCustomerCache(){
    localStorage.removeItem('customers');
    localStorage.removeItem('customersTime');
}

export function filterCustomers(customers, searchQuery){
    if (!searchQuery) return customers; // Return all customers if no search query is provided

    return customers.filter(customer => {
        const nameMatch = customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase());
        const mobileMatch = customer.mobile && customer.mobile.includes(searchQuery);
        return nameMatch || mobileMatch; // Return true if either condition matches
    });
};