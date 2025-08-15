import { User, Equipment, Reservation } from '../types';

// The backend will now serve the frontend files, so we can use a relative
// path for all API calls. This removes the need for hardcoded URLs and
// makes the application environment-agnostic.
const API_BASE_URL = '/api';


type UserData = Omit<User, 'id'>;
type EquipmentData = Omit<Equipment, 'id'>;
type ReservationData = Omit<Reservation, 'id'>;

export interface GeminiSchedulingResponse {
    equipmentNames: string[];
    durationDays: number;
}

export interface GeminiRescheduleResponse {
    alternativeSlots: { start: string; end: string }[];
    alternativeEquipment: Equipment[];
}

export class ApiError extends Error {
    constructor(message: string, public status: number, public data: any) {
        super(message);
        this.name = 'ApiError';
    }
}


async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new ApiError(errorData.error || `HTTP error! status: ${response.status}`, response.status, errorData);
    }
    return response.json();
}

// --- Fetch Functions ---
export const getUsers = (): Promise<User[]> => fetch(`${API_BASE_URL}/users`).then(response => handleResponse<User[]>(response));
export const getEquipment = (): Promise<Equipment[]> => fetch(`${API_BASE_URL}/equipment`).then(response => handleResponse<Equipment[]>(response));
export const getReservations = (): Promise<Reservation[]> => fetch(`${API_BASE_URL}/reservations`).then(response => handleResponse<Reservation[]>(response));

// --- Create Functions ---
export const createUser = (data: UserData): Promise<User> => {
    return fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(response => handleResponse<User>(response));
};

export const createEquipment = (data: EquipmentData): Promise<Equipment> => {
    return fetch(`${API_BASE_URL}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(response => handleResponse<Equipment>(response));
};

export const createReservation = (data: ReservationData): Promise<Reservation> => {
    return fetch(`${API_BASE_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(response => handleResponse<Reservation>(response));
};


// --- Update Functions ---
export const updateUser = (data: User): Promise<User> => {
    return fetch(`${API_BASE_URL}/users/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(response => handleResponse<User>(response));
};

export const updateEquipment = (data: Equipment): Promise<Equipment> => {
    return fetch(`${API_BASE_URL}/equipment/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(response => handleResponse<Equipment>(response));
};


// --- Delete Functions ---
export const deleteUser = (id: number): Promise<void> => {
    return fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok && res.status !== 204) throw new Error('Failed to delete user');
    });
};

export const deleteEquipment = (id: number): Promise<void> => {
    return fetch(`${API_BASE_URL}/equipment/${id}`, { method: 'DELETE' }).then(res => {
        if (!res.ok && res.status !== 204) throw new Error('Failed to delete equipment');
    });
};

export const deleteReservation = (id: number): Promise<void> => {
    return fetch(`${API_BASE_URL}/reservations/${id}`, { method: 'DELETE' }).then(res => {
         if (!res.ok && res.status !== 204) throw new Error('Failed to delete reservation');
    });
};

// --- AI Service ---
export const getAiSuggestions = (prompt: string): Promise<GeminiSchedulingResponse> => {
    return fetch(`${API_BASE_URL}/ai/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    }).then(response => handleResponse<GeminiSchedulingResponse>(response));
};

export const getAiRescheduleSuggestions = (data: ReservationData): Promise<GeminiRescheduleResponse> => {
    return fetch(`${API_BASE_URL}/ai/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    }).then(response => handleResponse<GeminiRescheduleResponse>(response));
};