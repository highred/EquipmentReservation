export enum Role {
    Admin = 'ADMIN',
    Technician = 'TECHNICIAN'
}

export enum View {
    Calendar = 'CALENDAR',
    Equipment = 'EQUIPMENT',
    Admin = 'ADMIN',
    MyBookings = 'MY_BOOKINGS'
}

export interface User {
    id: number;
    name: string;
    role: Role;
}

export interface Equipment {
    id: number;
    name: string;
    description: string;
    imageUrl: string;
}

export interface Reservation {
    id: number;
    equipmentId: number;
    userId: number;
    jobDescription: string;
    start: string; // ISO 8601 string
    end: string; // ISO 8601 string
}