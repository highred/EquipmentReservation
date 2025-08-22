
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Equipment, Reservation, UserRole } from '../../types';
import { apiService } from '../../services/apiService';
import BookEquipmentModal from './BookEquipmentModal';
import EquipmentFormModal from './EquipmentFormModal';
import EquipmentImportModal from './EquipmentImportModal';
import { PencilIcon, TrashIcon, PlusIcon, CloneIcon, UploadIcon } from '../../components/icons/Icons';

const EquipmentCard: React.FC<{
    equipment: Equipment;
    currentUser: User;
    onBook: () => void;
    onEdit: () => void;
    onClone: () => void;
    onDelete: () => void;
}> = ({ equipment, currentUser, onBook, onEdit, onClone, onDelete }) => {
    const isCalExpired = new Date(equipment.dueDate) < new Date();
    const canTechnicianBook = !(currentUser.role === UserRole.TECHNICIAN && isCalExpired);

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
            <div className="p-5 flex-grow">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-800">{equipment.description}</h3>
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{equipment.gageId}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{equipment.manufacturer} - {equipment.model}</p>
                <div className="mt-4 space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                        <span className="font-semibold">Range:</span>
                        <span>{equipment.range} {equipment.uom}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold">Cal. Due:</span>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${isCalExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {new Date(equipment.dueDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 p-4 flex items-center justify-between">
                <button
                    onClick={onBook}
                    disabled={!canTechnicianBook}
                    title={!canTechnicianBook ? 'Cannot book: Calibration is expired.' : 'Book this equipment'}
                    className="flex-grow bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Book Now
                </button>
                {currentUser.role === UserRole.ADMIN && (
                    <div className="flex items-center space-x-2 ml-3">
                        <button onClick={onClone} className="p-2 text-gray-500 hover:text-brand-secondary transition-colors" aria-label="Clone Equipment">
                            <CloneIcon className="w-5 h-5" />
                        </button>
                        <button onClick={onEdit} className="p-2 text-gray-500 hover:text-brand-primary transition-colors" aria-label="Edit Equipment">
                            <PencilIcon className="w-5 h-5" />
                        </button>
                        <button onClick={onDelete} className="p-2 text-gray-500 hover:text-status-danger transition-colors" aria-label="Delete Equipment">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const EquipmentView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for modals
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isEqFormModalOpen, setIsEqFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);

    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
    const [lastReturnDate, setLastReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
    
    const fetchEquipment = useCallback(async () => {
        setLoading(true);
        const data = await apiService.getEquipment();
        setEquipmentList(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEquipment();
        apiService.getUsers().then(setUsers);
    }, [fetchEquipment]);

    const filteredEquipment = useMemo(() => {
        return equipmentList.filter(eq =>
            eq.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.gageId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            eq.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [equipmentList, searchTerm]);
    
    const groupedEquipment = useMemo(() => {
        return filteredEquipment.reduce<Record<string, Equipment[]>>((acc, eq) => {
            const key = eq.description;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(eq);
            return acc;
        }, {});
    }, [filteredEquipment]);

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 8000); // Increased timeout for import results
    };

    // Booking Modal Handlers
    const handleBook = async (equipment: Equipment) => {
        const reservations = await apiService.getReservationsForEquipment(equipment.id);
        setUpcomingReservations(reservations);
        setSelectedEquipment(equipment);
        setIsBookingModalOpen(true);
    };

    const handleCloseBookingModal = () => {
        setIsBookingModalOpen(false);
        setSelectedEquipment(null);
        setUpcomingReservations([]);
    };

    const handleBookingSubmit = async (reservation: Omit<Reservation, 'id' | 'equipmentId' | 'staged'>, returnDate: string) => {
        if (!selectedEquipment) return;

        const result = await apiService.createReservation({
            ...reservation,
            equipmentId: selectedEquipment.id,
        });

        showNotification(result.success ? 'success' : 'error', result.message);
        if (result.success) {
            setLastReturnDate(returnDate);
            handleCloseBookingModal();
        }
    };

    // Equipment Form Modal Handlers (Add/Edit/Clone)
    const handleAddEquipment = () => {
        setEditingEquipment(null);
        setIsEqFormModalOpen(true);
    };

    const handleEditEquipment = (equipment: Equipment) => {
        setEditingEquipment(equipment);
        setIsEqFormModalOpen(true);
    };
    
    const handleCloneEquipment = (equipment: Equipment) => {
        const clonedEquipment = { ...equipment, id: '', gageId: '' };
        setEditingEquipment(clonedEquipment);
        setIsEqFormModalOpen(true);
    };
    
    const handleDeleteEquipment = async (equipment: Equipment) => {
        if (window.confirm(`Are you sure you want to delete ${equipment.description} (${equipment.gageId})? This will also delete all associated reservations.`)) {
            const result = await apiService.deleteEquipment(equipment.id);
            if (result.success) {
                showNotification('success', 'Equipment deleted successfully.');
                fetchEquipment();
            } else {
                showNotification('error', 'Failed to delete equipment.');
            }
        }
    };

    const handleEqFormSubmit = async (equipmentData: Omit<Equipment, 'id'> | Equipment) => {
        const isEditing = 'id' in equipmentData && !!equipmentData.id;
        
        const result = isEditing
            ? await apiService.updateEquipment(equipmentData as Equipment)
            : await apiService.addEquipment(equipmentData as Omit<Equipment, 'id'>);
        
        showNotification(result.success ? 'success' : 'error', result.message);

        if (result.success) {
            setIsEqFormModalOpen(false);
            setEditingEquipment(null);
            fetchEquipment();
        }
    };

    const handleImportComplete = (result: { successCount: number; errors: any[] }) => {
        const { successCount, errors } = result;
        let message = `Import complete: ${successCount} items successfully added.`;
        if (errors.length > 0) {
            message += ` ${errors.length} items failed.`;
            // Log errors for debugging, they are displayed in the modal
            console.error("Import errors:", errors);
        }
        showNotification(errors.length > 0 ? 'warning' : 'success', message);
        if (successCount > 0) {
            fetchEquipment();
        }
    };

    return (
        <div>
            {notification && (
                <div className={`p-4 mb-4 rounded-md ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800' :
                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {notification.message}
                </div>
            )}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4 items-center">
                <input
                    type="text"
                    placeholder="Search equipment..."
                    className="w-full md:flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                {currentUser.role === UserRole.ADMIN && (
                    <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300"
                        >
                            <UploadIcon className="w-5 h-5 mr-2" />
                            Import from CSV
                        </button>
                        <button
                            onClick={handleAddEquipment}
                            className="flex items-center justify-center bg-status-success text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-300"
                        >
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Add Equipment
                        </button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="text-center text-gray-500">Loading equipment...</div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedEquipment).sort(([a], [b]) => a.localeCompare(b)).map(([description, items]) => (
                        <div key={description}>
                            <h2 className="text-xl font-bold text-gray-700 border-b-2 border-brand-light pb-2 mb-4">{description}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {items.sort((a,b) => a.gageId.localeCompare(b.gageId)).map(eq => (
                                    <EquipmentCard
                                        key={eq.id}
                                        equipment={eq}
                                        currentUser={currentUser}
                                        onBook={() => handleBook(eq)}
                                        onEdit={() => handleEditEquipment(eq)}
                                        onClone={() => handleCloneEquipment(eq)}
                                        onDelete={() => handleDeleteEquipment(eq)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                    {filteredEquipment.length === 0 && !loading && (
                        <div className="text-center py-10 bg-gray-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-gray-700">No Equipment Found</h3>
                            <p className="text-gray-500">Try adjusting your search term.</p>
                        </div>
                    )}
                </div>
            )}
            
            {isBookingModalOpen && selectedEquipment && (
                <BookEquipmentModal
                    equipment={selectedEquipment}
                    currentUser={currentUser}
                    users={users}
                    upcomingReservations={upcomingReservations}
                    initialReturnDate={lastReturnDate}
                    onClose={handleCloseBookingModal}
                    onSubmit={handleBookingSubmit}
                />
            )}
            
            {isEqFormModalOpen && (
                <EquipmentFormModal
                    equipment={editingEquipment}
                    onClose={() => { setIsEqFormModalOpen(false); setEditingEquipment(null); }}
                    onSubmit={handleEqFormSubmit}
                />
            )}

            {isImportModalOpen && (
                <EquipmentImportModal
                    onClose={() => setIsImportModalOpen(false)}
                    onImportComplete={handleImportComplete}
                />
            )}
        </div>
    );
};

export default EquipmentView;