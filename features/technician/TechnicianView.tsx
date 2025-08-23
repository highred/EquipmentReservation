
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Reservation, Equipment, UserRole, Company } from '../../types';
import { apiService } from '../../services/apiService';
import { PencilIcon, TrashIcon } from '../../components/icons/Icons';
import ReservationFormModal from '../reservations/ReservationFormModal';
import { getTechnicianColor } from '../../utils';

const ReservationCard: React.FC<{
    reservation: Reservation,
    equipment?: Equipment,
    technician?: User,
    companyName: string,
    currentUser: User,
    onEdit: () => void,
    onDelete: () => void
}> = ({ reservation, equipment, technician, companyName, currentUser, onEdit, onDelete }) => {
    const pickupDate = new Date(reservation.pickupDate + 'T00:00:00');
    const returnDate = new Date(reservation.returnDate + 'T00:00:00');
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 border-l-4 border-brand-accent flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-grow">
                 <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{equipment?.description || 'Loading...'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{equipment?.gageId}</p>
                    </div>
                    {technician && (
                        <span className={`px-2 py-1 text-xs font-semibold text-white rounded-full ${getTechnicianColor(technician)}`}>
                            {technician.name}
                        </span>
                    )}
                </div>

                <div className="text-left">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">{companyName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {pickupDate.toLocaleDateString()} - {returnDate.toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className="flex items-start mt-4 sm:mt-0 sm:ml-4">
                {reservation.notes && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md max-w-xs mr-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-semibold">Notes:</p>
                        <p className="text-sm text-gray-800 dark:text-gray-200 italic">"{reservation.notes}"</p>
                    </div>
                )}
                {(currentUser.role === UserRole.ADMIN || currentUser.id === reservation.technicianId) && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={onEdit} className="p-2 text-gray-500 dark:text-gray-400 hover:text-brand-primary transition-colors" aria-label="Edit Reservation">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={onDelete} className="p-2 text-gray-500 dark:text-gray-400 hover:text-status-danger transition-colors" aria-label="Delete Reservation">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

const TechnicianView: React.FC<{ currentUser: User; selectedDate: string | null; onClearDateFilter: () => void; }> = ({ currentUser, selectedDate, onClearDateFilter }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTechId, setSelectedTechId] = useState<string>(currentUser.role === UserRole.TECHNICIAN ? currentUser.id : 'all');
    const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const [resData, eqData, usersData, companyData] = await Promise.all([
            apiService.getReservations(),
            apiService.getEquipment(),
            apiService.getUsers(),
            apiService.getCompanies(),
        ]);
        setReservations(resData.sort((a, b) => new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime()));
        setEquipment(eqData);
        setAllUsers(usersData);
        setCompanies(companyData);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const companyMap = useMemo(() => {
        return new Map(companies.map(c => [c.id, c.name]));
    }, [companies]);

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
                fetchAllData();
            } else {
                showNotification('error', 'Failed to delete reservation.');
            }
        }
    };
    
    const handleUpdateReservation = async (updatedReservation: Reservation) => {
        const result = await apiService.updateReservation(updatedReservation);
        if(!result.success) {
            showNotification('error', result.message);
        } else {
            showNotification('success', result.message);
            setEditingReservation(null);
            fetchAllData();
        }
        return result;
    }

    const getEquipmentById = (id: string) => equipment.find(e => e.id === id);
    const getTechnicianById = (id: string) => allUsers.find(u => u.id === id);

    const displayedReservations = useMemo(() => {
        const techFiltered = selectedTechId === 'all'
            ? reservations
            : reservations.filter(r => r.technicianId === selectedTechId);

        if (!selectedDate) {
            return techFiltered;
        }

        const filterDate = new Date(selectedDate + 'T00:00:00');
        filterDate.setHours(0,0,0,0);
        return techFiltered.filter(r => {
            const pickup = new Date(r.pickupDate + 'T00:00:00');
            const ret = new Date(r.returnDate + 'T00:00:00');
            pickup.setHours(0,0,0,0);
            ret.setHours(0,0,0,0);
            return filterDate >= pickup && filterDate <= ret;
        });
    }, [reservations, selectedDate, selectedTechId]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingReservations = displayedReservations.filter(r => new Date(r.returnDate) >= today);
    const pastReservations = displayedReservations.filter(r => new Date(r.returnDate) < today);
    
    const renderContent = () => {
        if (loading) {
            return <div className="text-center text-gray-500 dark:text-gray-400">Loading reservations...</div>;
        }
        
        if (displayedReservations.length === 0) {
            return <div className="text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                {selectedDate 
                    ? `No reservations found for this date.`
                    : 'No reservations found for the selected technician.'}
            </div>;
        }

        return (
            <>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Upcoming & Current Reservations</h2>
                    {upcomingReservations.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingReservations.map(res => (
                                <ReservationCard 
                                    key={res.id} 
                                    reservation={res} 
                                    equipment={getEquipmentById(res.equipmentId)} 
                                    technician={getTechnicianById(res.technicianId)}
                                    companyName={companyMap.get(res.companyId) || 'Unknown Company'}
                                    currentUser={currentUser} 
                                    onEdit={() => handleEdit(res)} 
                                    onDelete={() => handleDelete(res)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No upcoming reservations.</p>
                    )}
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Past Reservations</h2>
                    {pastReservations.length > 0 ? (
                        <div className="space-y-4">
                            {pastReservations.map(res => (
                                <ReservationCard 
                                    key={res.id} 
                                    reservation={res} 
                                    equipment={getEquipmentById(res.equipmentId)}
                                    technician={getTechnicianById(res.technicianId)}
                                    companyName={companyMap.get(res.companyId) || 'Unknown Company'}
                                    currentUser={currentUser} 
                                    onEdit={() => handleEdit(res)} 
                                    onDelete={() => handleDelete(res)} 
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">No past reservations.</p>
                    )}
                </div>
            </>
        );
    }

    return (
        <div className="space-y-8">
             {notification && (
                <div className={`p-4 mb-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
                    {notification.message}
                </div>
            )}
            {selectedDate && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-brand-accent p-4 rounded-r-lg flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">Showing Reservations for {new Date(selectedDate + 'T00:00:00').toLocaleDateString()}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">This list is filtered by a date selection from the calendar.</p>
                    </div>
                    <button onClick={onClearDateFilter} className="bg-white dark:bg-gray-700 dark:hover:bg-gray-600 text-brand-primary dark:text-brand-accent font-semibold py-2 px-4 border border-brand-accent rounded-md hover:bg-brand-light transition-colors">
                        Show All
                    </button>
                </div>
            )}
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
                <label htmlFor="tech-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View Reservations For:</label>
                <select
                    id="tech-select"
                    value={selectedTechId}
                    onChange={e => setSelectedTechId(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                    <option value="all">All Technicians</option>
                    {allUsers.filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN).map(tech => (
                        <option key={tech.id} value={tech.id}>{tech.name}</option>
                    ))}
                </select>
            </div>

            {renderContent()}
            {editingReservation && (
                <ReservationFormModal 
                    reservation={editingReservation}
                    equipment={getEquipmentById(editingReservation.equipmentId)!}
                    companies={companies}
                    onClose={() => setEditingReservation(null)}
                    onSubmit={handleUpdateReservation}
                />
            )}
        </div>
    );
};

export default TechnicianView;