export type UserType = 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  status: UserStatus;
  phone: string;
  address: string;
  createdAt?: string;
}

export interface CustomerType {
    id: string; // The test script uses "CUST..." string IDs
    customerId: string;
    name: string;
    email: string;
    mobile: string;
    address: string;
    customerType: 'REGULAR' | 'PREMIUM';
    loyaltyPoints: number;
    totalPurchases: number;
}
