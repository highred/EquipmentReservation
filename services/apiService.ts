
import { Equipment, Reservation, User, UserRole, StagingItem } from '../types';

// --- MOCK DATA ---
let users: User[] = [
    { id: 'user-1', name: 'Mike Smith (Admin)', email: 'mike@atiquality.com', role: UserRole.ADMIN, password: 'password' },
    { id: 'user-2', name: 'Bob (Technician)', email: 'bob@atiquality.com', role: UserRole.TECHNICIAN, password: 'password' },
    { id: 'user-3', name: 'Charlie (Technician)', email: 'charlie@atiquality.com', role: UserRole.TECHNICIAN, password: 'password' },
];

let equipment: Equipment[] = [
    { id: 'eq-1', gageId: 'G-1001', description: 'Digital Multimeter', manufacturer: 'Fluke', model: '87V', range: '1000V', uom: 'Volts', dueDate: '2025-08-15' },
    { id: 'eq-2', gageId: 'G-1002', description: 'Oscilloscope', manufacturer: 'Tektronix', model: 'TBS1052B', range: '50 MHz', uom: 'MHz', dueDate: '2025-06-20' },
    { id: 'eq-3', gageId: 'G-1003', description: 'Calipers', manufacturer: 'Mitutoyo', model: 'CD-6" ASX', range: '6 inch', uom: 'in', dueDate: '2024-12-01' },
    { id: 'eq-4', gageId: 'G-2001', description: 'Power Supply', manufacturer: 'Keysight', model: 'E3631A', range: '0-6V/0-25V', uom: 'V/A', dueDate: '2025-02-10' },
    { id: 'eq-5', gageId: 'G-2002', description: 'Torque Wrench', manufacturer: 'Snap-on', model: 'TECH2FR100', range: '5-100 ft-lb', uom: 'ft-lb', dueDate: '2024-11-22' },
    { id: 'eq-6', gageId: 'G-3001', description: 'Infrared Thermometer', manufacturer: 'Flir', model: 'TG165', range: '-25 to 380°C', uom: '°C', dueDate: '2025-09-05' },
    { id: 'eq-7', gageId: 'G-1004', description: 'Digital Multimeter', manufacturer: 'Fluke', model: '87V', range: '1000V', uom: 'Volts', dueDate: '2025-08-15' },

];

let reservations: Reservation[] = [
    { id: 'res-1', equipmentId: 'eq-1', technicianId: 'user-2', company: 'Global Tech Inc.', pickupDate: '2024-07-28', returnDate: '2024-07-30', notes: 'Need all probes included.', staged: true },
    { id: 'res-2', equipmentId: 'eq-3', technicianId: 'user-3', company: 'Innovate Solutions', pickupDate: '2024-07-29', returnDate: '2024-08-02', notes: 'Please verify calibration cert.', staged: false },
    { id: 'res-3', equipmentId: 'eq-2', technicianId: 'user-2', company: 'Global Tech Inc.', pickupDate: '2024-08-05', returnDate: '2024-08-09', notes: '', staged: false },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

reservations.push({
    id: 'res-4', equipmentId: 'eq-4', technicianId: 'user-3', company: 'Future Systems',
    pickupDate: tomorrow.toISOString().split('T')[0],
    returnDate: nextWeek.toISOString().split('T')[0],
    notes: 'Critical project, requires immediate staging.', staged: false
});


// --- MOCK API SERVICE ---
class ApiService {
    private simulateLatency(ms: number = 500): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // --- Auth ---
    async login(email: string, password_provided: string): Promise<{ success: boolean; message: string; user?: User }> {
        await this.simulateLatency(1000);
        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        
        if (!user) {
            return { success: false, message: "Invalid email or password." };
        }
        if (user.password !== password_provided) {
            return { success: false, message: "Invalid email or password." };
        }
        if (!user.password) {
             return { success: false, message: "This account has no password set. Please contact an administrator." };
        }
        
        // Don't send password back to client
        const { password, ...userToReturn } = user;
        return { success: true, message: "Login successful.", user: userToReturn };
    }


    // --- User Management ---
    async getUsers(): Promise<User[]> {
        await this.simulateLatency(200);
        // Exclude passwords from the user list returned
        return users.map(u => {
            const { password, ...user } = u;
            return user;
        });
    }

    async addUser(userData: Omit<User, 'id'>): Promise<{ success: boolean; message: string; user?: User }> {
        await this.simulateLatency();
        if (!userData.email) {
            return { success: false, message: `Email is required.` };
        }
        if (users.some(u => u.email && u.email.toLowerCase() === userData.email?.toLowerCase())) {
            return { success: false, message: `User with email "${userData.email}" already exists.` };
        }
        const newUser: User = {
            id: `user-${Date.now()}`,
            ...userData,
            password: '', // New users have no password until an admin sets one
        };
        users.push(newUser);
        const { password, ...userToReturn } = newUser;
        return { success: true, message: "User added. Please set a password for them.", user: userToReturn };
    }

    async updateUser(updatedUser: User): Promise<{ success: boolean; message: string }> {
        await this.simulateLatency();
        const index = users.findIndex(u => u.id === updatedUser.id);
        if (index > -1) {
             if (users.some(u => u.id !== updatedUser.id && u.email && u.email.toLowerCase() === updatedUser.email?.toLowerCase())) {
                return { success: false, message: `Another user with email "${updatedUser.email}" already exists.` };
            }
            // Preserve the password, which is managed separately
            const existingPassword = users[index].password;
            users[index] = { ...updatedUser, password: existingPassword };
            return { success: true, message: "User updated successfully." };
        }
        return { success: false, message: "Could not find user to update." };
    }

    async deleteUser(userId: string): Promise<{ success: boolean, message: string }> {
        await this.simulateLatency();
        if (reservations.some(r => r.technicianId === userId)) {
            return { success: false, message: "Cannot delete user with active reservations. Please reassign their reservations first." };
        }
        const initialLength = users.length;
        users = users.filter(u => u.id !== userId);
        return { success: users.length < initialLength, message: users.length < initialLength ? "User deleted." : "User not found." };
    }
    
    async setPassword(userId: string, new_password: string): Promise<{ success: boolean; message: string }> {
        await this.simulateLatency();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.password = new_password;
            return { success: true, message: "Password updated successfully." };
        }
        return { success: false, message: "User not found." };
    }


    // --- Equipment Management ---
    async getEquipment(): Promise<Equipment[]> {
        await this.simulateLatency();
        return [...equipment];
    }

    async addEquipment(newEquipmentData: Omit<Equipment, 'id'>): Promise<{ success: boolean; message: string; equipment?: Equipment }> {
        await this.simulateLatency();
        const existing = equipment.find(e => e.gageId.toLowerCase() === newEquipmentData.gageId.toLowerCase());
        if (existing) {
            return { success: false, message: `Gage ID "${newEquipmentData.gageId}" already exists.` };
        }
        const newEquipment: Equipment = {
          id: `eq-${Date.now()}`,
          ...newEquipmentData,
        };
        equipment.push(newEquipment);
        return { success: true, message: 'Equipment added successfully.', equipment: newEquipment };
    }

    async bulkAddEquipment(newEquipmentList: Omit<Equipment, 'id'>[]): Promise<{ successCount: number; errors: { rowData: any; message: string }[] }> {
        await this.simulateLatency(1500);
        
        const errors: { rowData: any, message: string }[] = [];
        let successCount = 0;
        
        const existingGageIds = new Set(equipment.map(e => e.gageId.toLowerCase()));
        const incomingGageIds = new Set<string>();

        for (const item of newEquipmentList) {
            const gageIdLower = item.gageId.toLowerCase();

            if (incomingGageIds.has(gageIdLower)) {
                errors.push({ rowData: item, message: `Duplicate Gage ID "${item.gageId}" within the import file.` });
                continue;
            }

            if (existingGageIds.has(gageIdLower)) {
                errors.push({ rowData: item, message: `Gage ID "${item.gageId}" already exists in the system.` });
                continue;
            }

            const newEquipment: Equipment = {
                id: `eq-${Date.now()}-${Math.random()}`,
                ...item,
            };
            equipment.push(newEquipment);
            incomingGageIds.add(gageIdLower);
            successCount++;
        }

        return { successCount, errors };
    }

    async updateEquipment(updatedEquipment: Equipment): Promise<{ success: boolean; message: string }> {
        await this.simulateLatency();
        const existing = equipment.find(e => e.id !== updatedEquipment.id && e.gageId.toLowerCase() === updatedEquipment.gageId.toLowerCase());
        if (existing) {
            return { success: false, message: `Gage ID "${updatedEquipment.gageId}" is already in use by another item.` };
        }
        const index = equipment.findIndex(e => e.id === updatedEquipment.id);
        if (index > -1) {
          equipment[index] = updatedEquipment;
          return { success: true, message: 'Equipment updated successfully.' };
        }
        return { success: false, message: 'Could not find equipment to update.' };
    }

    async deleteEquipment(equipmentId: string): Promise<{ success: boolean }> {
        await this.simulateLatency();
        const initialLength = equipment.length;
        equipment = equipment.filter(e => e.id !== equipmentId);
        reservations = reservations.filter(r => r.equipmentId !== equipmentId);
        return { success: equipment.length < initialLength };
    }
    
    // --- Reservation Management ---
    async getReservations(startDate?: string, endDate?: string): Promise<Reservation[]> {
        await this.simulateLatency();
        if(!startDate || !endDate) return [...reservations];
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return reservations.filter(r => {
            const pickup = new Date(r.pickupDate);
            const ret = new Date(r.returnDate);
            return (pickup <= end && ret >= start);
        });
    }

    async getReservationsForTechnician(technicianId: string): Promise<Reservation[]> {
        await this.simulateLatency();
        return reservations.filter(r => r.technicianId === technicianId).sort((a,b) => new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime());
    }

    async createReservation(newReservation: Omit<Reservation, 'id' | 'staged'>): Promise<{ success: boolean; message: string }> {
        await this.simulateLatency(1000);
        
        const { equipmentId, pickupDate, returnDate } = newReservation;

        const isDoubleBooked = reservations.some(r => {
            if (r.equipmentId !== equipmentId) return false;
            
            const existingPickup = new Date(r.pickupDate);
            const existingReturn = new Date(r.returnDate);
            const newPickup = new Date(pickupDate);
            const newReturn = new Date(returnDate);

            return (newPickup < existingReturn && newReturn > existingPickup);
        });

        if (isDoubleBooked) {
            return { success: false, message: 'This equipment is already booked for the selected dates.' };
        }

        const reservation: Reservation = {
            ...newReservation,
            id: `res-${Date.now()}`,
            staged: false,
        };
        reservations.push(reservation);
        return { success: true, message: 'Reservation created successfully!' };
    }

    async updateReservation(updatedReservation: Reservation): Promise<{ success: boolean; message: string }> {
        await this.simulateLatency(1000);
        
        const { equipmentId, pickupDate, returnDate, id } = updatedReservation;

        const isDoubleBooked = reservations.some(r => {
            if (r.id === id) return false;
            if (r.equipmentId !== equipmentId) return false;
            
            const existingPickup = new Date(r.pickupDate);
            const existingReturn = new Date(r.returnDate);
            const newPickup = new Date(pickupDate);
            const newReturn = new Date(returnDate);

            return (newPickup < existingReturn && newReturn > existingPickup);
        });

        if (isDoubleBooked) {
            return { success: false, message: 'This equipment is already booked for the selected dates.' };
        }

        const index = reservations.findIndex(r => r.id === id);
        if (index !== -1) {
            reservations[index] = updatedReservation;
            return { success: true, message: 'Reservation updated successfully!' };
        }
        
        return { success: false, message: 'Could not find reservation to update.' };
    }

    async deleteReservation(reservationId: string): Promise<{ success: boolean }> {
        await this.simulateLatency();
        const initialLength = reservations.length;
        reservations = reservations.filter(r => r.id !== reservationId);
        return { success: reservations.length < initialLength };
    }

    // --- Admin / Staging ---
    async getStagingList(date: string): Promise<StagingItem[]> {
        await this.simulateLatency();
        const allUsers = await this.getUsers(); // This now returns users without passwords
        const items = reservations
            .filter(r => r.pickupDate === date)
            .map(r => {
                const eq = equipment.find(e => e.id === r.equipmentId);
                const user = allUsers.find(u => u.id === r.technicianId);
                return { ...r, equipment: eq!, user: user! };
            })
            .filter(item => item.equipment && item.user)
            .sort((a, b) => a.user.name.localeCompare(b.user.name));

        return items as StagingItem[];
    }
    
    async updateStagingStatus(reservationId: string, staged: boolean): Promise<{ success: boolean }> {
        await this.simulateLatency(300);
        const reservation = reservations.find(r => r.id === reservationId);
        if (reservation) {
            reservation.staged = staged;
            return { success: true };
        }
        return { success: false };
    }
}

export const apiService = new ApiService();