import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Equipment, Reservation, UserRole, Company } from '../../types';
import { apiService } from '../../services/apiService';
import BookEquipmentModal from './BookEquipmentModal';
import BatchBookEquipmentModal from './BatchBookEquipmentModal';
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
    isBatchMode: boolean;
    isSelected: boolean;
    onSelectToggle: () => void;
}> = ({ equipment, currentUser, onBook, onEdit, onClone, onDelete, isBatchMode, isSelected, onSelectToggle }) => {
    return (
        <div
            className={`relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col ${isBatchMode ? 'cursor-pointer' : ''} ${isSelected ? 'ring-2 ring-brand-primary' : ''}`}
            onClick={isBatchMode ? onSelectToggle : undefined}
            role={isBatchMode ? 'checkbox' : undefined}
            aria-checked={isBatchMode ? isSelected : undefined}
        >
            {isBatchMode && (
                <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-brand-primary' : 'bg-white border-2 border-gray-300'}`}>
                    {isSelected && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
            )}
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
                </div>
            </div>
            {!isBatchMode && (
                <div className="bg-gray-50 p-4 flex items-center justify-between">
                    <button
                        onClick={onBook}
                        title={'Book this equipment'}
                        className="flex-grow bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-primary transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent"
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
            )}
        </div>
    );
};

const EquipmentView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isBatchBookingModalOpen, setIsBatchBookingModalOpen] = useState(false);
    const [isEqFormModalOpen, setIsEqFormModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
    const [upcomingReservations, setUpcomingReservations] = useState<Reservation[]>([]);

    const [batchSelectMode, setBatchSelectMode] = useState(false);
    const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<Set<string>>(new Set());

    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
    const [lastReturnDate, setLastReturnDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [lastCompanyId, setLastCompanyId] = useState<string>('');
    
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        const [eqData, usersData, companyData] = await Promise.all([
            apiService.getEquipment(),
            apiService.getUsers(),
            apiService.getCompanies()
        ]);
        setEquipmentList(eqData);
        setUsers(usersData);
        setCompanies(companyData);
        if (companyData.length > 0 && !lastCompanyId) {
            setLastCompanyId(companyData[0].id);
        }
        setLoading(false);
    }, [lastCompanyId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

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
        setTimeout(() => setNotification(null), 8000);
    };

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

    const handleBookingSubmit = async (reservation: Omit<Reservation, 'id' | 'equipmentId' | 'staged'>, returnDate: string): Promise<{ success: boolean; message: string; }> => {
        if (!selectedEquipment) {
            return { success: false, message: 'No equipment selected.' };
        }

        const result = await apiService.createReservation({
            ...reservation,
            equipmentId: selectedEquipment.id,
        });

        if (result.success) {
            showNotification('success', result.message);
            setLastReturnDate(returnDate);
            setLastCompanyId(reservation.companyId);
            handleCloseBookingModal();
        }
        
        return result;
    };
    
    // Batch Mode Handlers
    const handleToggleBatchMode = () => {
        setBatchSelectMode(prev => !prev);
        setSelectedEquipmentIds(new Set());
    };
    
    const handleSelectToggle = (equipmentId: string) => {
        setSelectedEquipmentIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(equipmentId)) {
                newSet.delete(equipmentId);
            } else {
                newSet.add(equipmentId);
            }
            return newSet;
        });
    };
    
    const handleCloseBatchBookingModal = () => {
        setIsBatchBookingModalOpen(false);
        setSelectedEquipmentIds(new Set());
        setBatchSelectMode(false);
    };

    const handleBatchBookingSubmit = async (reservations: Omit<Reservation, 'id' | 'staged'>[], returnDate: string): Promise<{ success: boolean; message: string; }> => {
        const result = await apiService.createMultipleReservations(reservations);
        if (result.success) {
            showNotification('success', result.message);
            setLastReturnDate(returnDate);
            if (reservations.length > 0) {
                setLastCompanyId(reservations[0].companyId);
            }
            handleCloseBatchBookingModal();
        }
        return result;
    };


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
                fetchAllData();
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
            fetchAllData();
        }
    };

    const handleImportComplete = (result: { createdCount: number; updatedCount: number; errors: any[] }) => {
        const { createdCount, updatedCount, errors } = result;
        const successCount = createdCount + updatedCount;
        let message = `Import complete: ${createdCount} items added, ${updatedCount} items updated.`;
        if (errors.length > 0) {
            message += ` ${errors.length} items failed.`;
        }
        showNotification(errors.length > 0 ? 'warning' : 'success', message);
        if (successCount > 0) { fetchAllData(); }
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
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2">
                     <button onClick={handleToggleBatchMode} className={`flex items-center justify-center font-bold py-2 px-4 rounded-md transition-colors duration-300 ${batchSelectMode ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white'}`}>
                        {batchSelectMode ? 'Cancel Batch' : 'Batch Select'}
                    </button>
                    {currentUser.role === UserRole.ADMIN && (
                        <>
                            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300">
                                <UploadIcon className="w-5 h-5 mr-2" />Import / Update
                            </button>
                            <button onClick={handleAddEquipment} className="flex items-center justify-center bg-status-success text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-300">
                                <PlusIcon className="w-5 h-5 mr-2" />Add Equipment
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? <div className="text-center text-gray-500">Loading equipment...</div> : (
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
                                        isBatchMode={batchSelectMode}
                                        isSelected={selectedEquipmentIds.has(eq.id)}
                                        onSelectToggle={() => handleSelectToggle(eq.id)}
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
            
            {batchSelectMode && selectedEquipmentIds.size > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-brand-primary text-white p-4 shadow-lg z-40 flex justify-between items-center">
                    <span className="font-bold text-lg">{selectedEquipmentIds.size} item(s) selected</span>
                    <div className="space-x-4">
                        <button onClick={() => setSelectedEquipmentIds(new Set())} className="font-semibold hover:underline">Clear Selection</button>
                        <button onClick={() => setIsBatchBookingModalOpen(true)} className="bg-white text-brand-primary font-bold py-2 px-6 rounded-md hover:bg-gray-200 transition-colors">
                            Book Selected
                        </button>
                    </div>
                </div>
            )}

            {isBookingModalOpen && selectedEquipment && (
                <BookEquipmentModal
                    equipment={selectedEquipment}
                    currentUser={currentUser}
                    users={users}
                    companies={companies}
                    upcomingReservations={upcomingReservations}
                    initialCompanyId={lastCompanyId}
                    initialReturnDate={lastReturnDate}
                    onClose={handleCloseBookingModal}
                    onSubmit={handleBookingSubmit}
                />
            )}
            
            {isBatchBookingModalOpen && (
                <BatchBookEquipmentModal
                    selectedEquipment={equipmentList.filter(eq => selectedEquipmentIds.has(eq.id))}
                    currentUser={currentUser}
                    users={users}
                    companies={companies}
                    initialCompanyId={lastCompanyId}
                    initialReturnDate={lastReturnDate}
                    onClose={handleCloseBatchBookingModal}
                    onSubmit={handleBatchBookingSubmit}
                />
            )}
            
            {isEqFormModalOpen && <EquipmentFormModal equipment={editingEquipment} onClose={() => { setIsEqFormModalOpen(false); setEditingEquipment(null); }} onSubmit={handleEqFormSubmit} />}
            {isImportModalOpen && <EquipmentImportModal onClose={() => setIsImportModalOpen(false)} onImportComplete={handleImportComplete} />}
        </div>
    );
};

export default EquipmentView;