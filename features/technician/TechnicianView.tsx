import React, { useState, useEffect, useCallback } from 'react';
import { User, Reservation, Equipment, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import { PencilIcon, TrashIcon } from '../../components/icons/Icons';
import ReservationFormModal from '../reservations/ReservationFormModal';

const ReservationCard: React.FC<{
    reservation: Reservation,
    equipment?: Equipment,
    currentUser: User,
    onEdit: () => void,
    onDelete: () => void
}> = ({ reservation, equipment, currentUser, onEdit, onDelete }) => {
    const pickupDate = new Date(reservation.pickupDate + 'T00:00:00');
    const returnDate = new Date(reservation.returnDate + 'T00:00:00');
    
    return (
        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-brand-accent flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-grow">
                <p className="text-lg font-bold text-gray-800">{equipment?.description || 'Loading...'}</p>
                <p className="text-sm text-gray-500">{equipment?.gageId}</p>
                <div className="text-left mt-2 sm:mt-0">
                    <p className="font-semibold text-gray-700">{reservation.company}</p>
                    <p className="text-sm text-gray-500">
                        {pickupDate.toLocaleDateString()} - {returnDate.toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="flex items-start mt-4 sm:mt-0">
                {reservation.notes && (
                    <div className="p-3 bg-gray-50 rounded-md max-w-xs mr-4">
                        <p className="text-sm text-gray-600 font-semibold">Notes:</p>
                        <p className="text-sm text-gray-800 italic">"{reservation.notes}"</p>
                    </div>
                )}
                {(currentUser.role === UserRole.ADMIN || currentUser.id === reservation.technicianId) && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={onEdit} className="p-2 text-gray-500 hover:text-brand-primary transition-colors" aria-label="Edit Reservation">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={onDelete} className="p-2 text-gray-500 hover:text-status-danger transition-colors" aria-label="Delete Reservation">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const TechnicianView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [technicians, setTechnicians] = useState<User[]>([]);
    const [selectedTechId, setSelectedTechId] = useState<string>(currentUser.role === UserRole.TECHNICIAN ? currentUser.id : '');
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchTechnicians = useCallback(() => {
        if (currentUser.role === UserRole.ADMIN) {
            const allUsers = apiService.getUsers();
            const techUsers = allUsers.filter(u => u.role === UserRole.TECHNICIAN);
            setTechnicians(techUsers);
            if (techUsers.length > 0 && !selectedTechId) {
                setSelectedTechId(techUsers[0].id);
            }
        }
    }, [currentUser.role, selectedTechId]);

    const fetchReservations = useCallback(async () => {
        if (!selectedTechId) {
            setLoading(false);
            setReservations([]);
            return;
        }
        setLoading(true);
        const resData = await apiService.getReservationsForTechnician(selectedTechId);
        setReservations(resData);
        setLoading(false);
    }, [selectedTechId]);

    const fetchEquipment = useCallback(async () => {
        const eqData = await apiService.getEquipment();
        setEquipment(eqData);
    }, []);

    useEffect(() => {
        fetchTechnicians();
        fetchEquipment();
    }, [fetchTechnicians, fetchEquipment]);
    
    useEffect(() => {
        fetchReservations();
    }, [fetchReservations]);

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleEdit = (reservation: Reservation) => {
        setEditingReservation(reservation);
    };

    const handleDelete = async (reservation: Reservation) => {
        const eq = getEquipmentById(reservation.equipmentId);
        if(window.confirm(`Are you sure you want to delete the reservation for ${eq?.description} on ${new Date(reservation.pickupDate + 'T00:00:00').toLocaleDateString()}?`)) {
            const result = await apiService.deleteReservation(reservation.id);
            if (result.success) {
                showNotification('success', 'Reservation deleted successfully.');
                fetchReservations();
            } else {
                showNotification('error', 'Failed to delete reservation.');
            }
        }
    };
    
    const handleUpdateReservation = async (updatedReservation: Reservation) => {
        const result = await apiService.updateReservation(updatedReservation);
        showNotification(result.success ? 'success' : 'error', result.message);
        if(result.success) {
            setEditingReservation(null);
            fetchReservations();
        }
    }

    const getEquipmentById = (id: string) => equipment.find(e => e.id === id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingReservations = reservations.filter(r => new Date(r.returnDate) >= today);
    const pastReservations = reservations.filter(r => new Date(r.returnDate) < today);
    
    const renderContent = () => {
        if (loading) {
            return <div className="text-center text-gray-500">Loading reservations...</div>;
        }

        if (!selectedTechId && currentUser.role === UserRole.ADMIN) {
            return <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow-md">Please select a technician to view their reservations.</div>;
        }
        
        if (reservations.length === 0) {
            return <div className="text-center text-gray-500 bg-white p-8 rounded-lg shadow-md">No reservations found for this technician.</div>;
        }

        return (
            <>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming & Current Reservations</h2>
                    {upcomingReservations.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingReservations.map(res => (
                                <ReservationCard key={res.id} reservation={res} equipment={getEquipmentById(res.equipmentId)} currentUser={currentUser} onEdit={() => handleEdit(res)} onDelete={() => handleDelete(res)} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No upcoming reservations.</p>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Past Reservations</h2>
                    {pastReservations.length > 0 ? (
                        <div className="space-y-4">
                            {pastReservations.map(res => (
                                <ReservationCard key={res.id} reservation={res} equipment={getEquipmentById(res.equipmentId)} currentUser={currentUser} onEdit={() => handleEdit(res)} onDelete={() => handleDelete(res)} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 italic">No past reservations.</p>
                    )}
                </div>
            </>
        );
    }

    return (
        <div className="space-y-8">
             {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.message}
                </div>
            )}
            {currentUser.role === UserRole.ADMIN && (
                <div className="bg-white p-4 rounded-lg shadow-md">
                    <label htmlFor="tech-select" className="block text-sm font-medium text-gray-700 mb-2">Select a Technician:</label>
                    <select
                        id="tech-select"
                        value={selectedTechId}
                        onChange={e => setSelectedTechId(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    >
                         <option value="" disabled>-- Select a Technician --</option>
                        {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>{tech.name}</option>
                        ))}
                    </select>
                </div>
            )}
            {renderContent()}
            {editingReservation && (
                <ReservationFormModal 
                    reservation={editingReservation}
                    equipment={getEquipmentById(editingReservation.equipmentId)!}
                    onClose={() => setEditingReservation(null)}
                    onSubmit={handleUpdateReservation}
                />
            )}
        </div>
    );
};

export default TechnicianView;