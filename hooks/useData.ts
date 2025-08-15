import { useState, useEffect, useCallback } from 'react';
import { User, Equipment, Reservation, Role } from '../types';
import * as api from '../services/apiService';

const useData = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const [usersData, equipmentData, reservationsData] = await Promise.all([
                api.getUsers(),
                api.getEquipment(),
                api.getReservations(),
            ]);
            setUsers(usersData);
            setEquipment(equipmentData);
            setReservations(reservationsData);
        } catch (err) {
            if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
                 setError('Connection to the backend server failed. Please ensure it is running and accessible.');
            } else {
                 setError((err as Error).message || 'An unknown error occurred.');
            }
            console.error("Data fetching error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApiCall = useCallback(async <T,>(apiCall: () => Promise<T>, successCallback: (result: T) => void) => {
        try {
            const result = await apiCall();
            successCallback(result);
        } catch (err) {
            console.error(err);
            throw err; // Re-throw to be caught by the component
        }
    }, []);

    // --- Users ---
    const addUser = useCallback(
        (user: Omit<User, 'id'>) => handleApiCall(() => api.createUser(user), (newUser) => setUsers(prev => [...prev, newUser])),
        [handleApiCall]
    );
    const updateUser = useCallback(
        (updatedUser: User) => handleApiCall(() => api.updateUser(updatedUser), () => setUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)))),
        [handleApiCall]
    );
    const deleteUser = useCallback(
        (userId: number) => handleApiCall(() => api.deleteUser(userId), () => setUsers(prev => prev.filter(u => u.id !== userId))),
        [handleApiCall]
    );

    // --- Equipment ---
    const addEquipment = useCallback(
        (item: Omit<Equipment, 'id'>) => handleApiCall(() => api.createEquipment(item), (newEquip) => setEquipment(prev => [...prev, newEquip])),
        [handleApiCall]
    );
    const updateEquipment = useCallback(
        (updatedItem: Equipment) => handleApiCall(() => api.updateEquipment(updatedItem), () => setEquipment(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)))),
        [handleApiCall]
    );
    const deleteEquipment = useCallback(
        (itemId: number) => handleApiCall(() => api.deleteEquipment(itemId), () => {
            setEquipment(prev => prev.filter(item => item.id !== itemId));
            // Also remove reservations associated with the deleted equipment
            setReservations(prev => prev.filter(r => r.equipmentId !== itemId));
        }),
        [handleApiCall]
    );

    // --- Reservations ---
    const addReservation = useCallback(
        (reservation: Omit<Reservation, 'id'>) => handleApiCall(() => api.createReservation(reservation), (newReservation) => setReservations(prev => [...prev, newReservation])),
        [handleApiCall]
    );
    const deleteReservation = useCallback(
        (reservationId: number) => handleApiCall(() => api.deleteReservation(reservationId), () => setReservations(prev => prev.filter(r => r.id !== reservationId))),
        [handleApiCall]
    );

    return {
        users, addUser, updateUser, deleteUser,
        equipment, addEquipment, updateEquipment, deleteEquipment,
        reservations, addReservation, deleteReservation,
        loading,
        error,
        refetch: fetchData,
    };
};

export default useData;