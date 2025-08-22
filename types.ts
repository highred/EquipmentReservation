
export interface Equipment {
  id: string;
  gageId: string;
  description: string;
  manufacturer: string;
  model: string;
  range: string;
  uom: string; // Unit of Measurement
  dueDate: string; // Calibration due date
}

export interface Reservation {
  id: string;
  equipmentId: string;
  technicianId: string;
  company: string;
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
  role: UserRole;
}

export type Tab = 'CALENDAR' | 'EQUIPMENT' | 'TECHNICIAN' | 'ADMIN';

export interface StagingItem extends Reservation {
    equipment: Equipment;
    user: User;
}
