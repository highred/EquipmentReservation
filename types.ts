
export interface Equipment {
  id: string;
  gageId: string;
  description: string;
  manufacturer: string;
  model: string;
  range: string;
  uom: string; // Unit of Measurement
  imageUrl?: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Reservation {
  id: string;
  equipmentId: string;
  technicianId: string;
  companyId: string;
  pickupDate: string; // ISO 8601 format: YYYY-MM-DD
  returnDate: string; // ISO 8601 format: YYYY-MM-DD
  notes: string;
  staged: boolean;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  password?: string;
  color?: string;
}

export type Tab = 'CALENDAR' | 'EQUIPMENT' | 'TECHNICIAN' | 'COMPANY' | 'ADMIN';

export interface StagingItem extends Reservation {
    equipment: Equipment;
    user: User;
    company: Company;
}
