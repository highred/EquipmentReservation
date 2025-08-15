import React, { useState, useMemo } from 'react';
import { Equipment, Reservation, User } from '../types';
import { getAiSuggestions, getAiRescheduleSuggestions, ApiError, GeminiRescheduleResponse, GeminiSchedulingResponse } from '../services/apiService';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import Toast from './common/Toast';
import SparklesIcon from './icons/SparklesIcon';
import LightBulbIcon from './icons/LightBulbIcon';


interface EquipmentViewProps {
    equipment: Equipment[];
    reservations: Reservation[];
    addReservation: (reservation: Omit<Reservation, 'id'>) => Promise<void>;
    currentUser: User | null;
}

const EquipmentCard: React.FC<{
    item: Equipment;
    onBook: () => void;
}> = ({ item, onBook }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
        <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover" />
        <div className="p-4">
            <h3 className="text-lg font-bold">{item.name}</h3>
            <p className="text-sm text-gray-600 mt-1 h-10">{item.description}</p>
            <Button onClick={onBook} className="w-full mt-4">Book Now</Button>
        </div>
    </div>
);

const EquipmentView: React.FC<EquipmentViewProps> = ({ equipment, reservations, addReservation, currentUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
    const [bookingDetails, setBookingDetails] = useState({ start: '', end: '', jobDescription: '' });
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<GeminiSchedulingResponse | null>(null);
    const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);

    // New state for conflict resolution
    const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
    const [conflictSuggestions, setConflictSuggestions] = useState<GeminiRescheduleResponse | null>(null);
    const [isAiRescheduling, setIsAiRescheduling] = useState(false);


    const filteredEquipment = useMemo(() => {
        return equipment.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [equipment, searchTerm]);

    const handleOpenModal = (item: Equipment) => {
        setSelectedEquipment(item);
        setIsModalOpen(true);
        // Default to next day 9am to 5pm
        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(9, 0, 0, 0);
        const end = new Date(start);
        end.setHours(17, 0, 0, 0);

        setBookingDetails({
            start: start.toISOString().slice(0, 16),
            end: end.toISOString().slice(0, 16),
            jobDescription: ''
        });
        setAiPrompt('');
        setAiSuggestion(null);
        setAiSuggestionError(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEquipment(null);
        setAiPrompt('');
        setAiSuggestion(null);
        setAiSuggestionError(null);
    };
    
    const handleCloseConflictModal = () => {
        setIsConflictModalOpen(false);
        setConflictSuggestions(null);
    }

    const handleBooking = async () => {
        if (!selectedEquipment || !currentUser || !bookingDetails.start || !bookingDetails.end) {
            setToast({ message: 'Please fill all fields.', type: 'error' });
            return;
        }

        const newReservationStart = new Date(bookingDetails.start);
        const newReservationEnd = new Date(bookingDetails.end);

        if (newReservationStart >= newReservationEnd) {
            setToast({ message: 'End date must be after start date.', type: 'error' });
            return;
        }
        
        const reservationData = {
            equipmentId: selectedEquipment.id,
            userId: currentUser.id,
            jobDescription: bookingDetails.jobDescription,
            start: newReservationStart.toISOString(),
            end: newReservationEnd.toISOString()
        };

        try {
            await addReservation(reservationData);
            setToast({ message: 'Equipment booked successfully!', type: 'success' });
            handleCloseModal();
        } catch (error) {
             if (error instanceof ApiError && error.status === 409) {
                // This is a scheduling conflict, trigger the AI assistant
                handleCloseModal(); // Close the current booking modal
                setIsConflictModalOpen(true);
                setIsAiRescheduling(true);
                try {
                    const suggestions = await getAiRescheduleSuggestions(reservationData);
                    setConflictSuggestions(suggestions);
                } catch (aiError) {
                    setToast({ message: `Scheduling Assistant failed: ${(aiError as Error).message}`, type: 'error' });
                    handleCloseConflictModal();
                } finally {
                    setIsAiRescheduling(false);
                }

             } else {
                 setToast({ message: `Booking failed: ${(error as Error).message}`, type: 'error' });
             }
        }
    };
    
    const handleGetAiSuggestions = async () => {
        if (!aiPrompt) {
            setToast({ message: 'Please describe your job.', type: 'error' });
            return;
        }
        setIsAiLoading(true);
        setAiSuggestion(null);
        setAiSuggestionError(null);
        try {
            const result = await getAiSuggestions(aiPrompt);
            setAiSuggestion(result);
        } catch (error) {
            setAiSuggestionError(`AI Assistant Error: ${(error as Error).message}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleApplyAiSuggestion = () => {
        if (!aiSuggestion) return;
        
        const { equipmentNames, durationDays } = aiSuggestion;

        const requiredEquipment = equipment.find(e => equipmentNames.some(reqName => e.name.toLowerCase().includes(reqName.toLowerCase())));
        
        if(requiredEquipment) {
            setSelectedEquipment(requiredEquipment);
        }

        const start = new Date();
        start.setDate(start.getDate() + 1);
        start.setHours(9, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + (durationDays > 0 ? durationDays - 1 : 0));
        end.setHours(17, 0, 0, 0);

        setBookingDetails({
            start: start.toISOString().slice(0, 16),
            end: end.toISOString().slice(0, 16),
            jobDescription: aiPrompt
        });

        if(!requiredEquipment) {
            setToast({ message: `Could not find matching equipment, but the dates have been set. Please select equipment.`, type: 'error' });
        } else {
            setToast({ message: `AI suggestions applied! Please review and confirm.`, type: 'success' });
        }
        
        setAiSuggestion(null);
    };

    const handleClearAiSuggestion = () => {
        setAiSuggestion(null);
        setAiSuggestionError(null);
    }
    
    const handleApplySlot = (slot: { start: string; end: string }) => {
        setBookingDetails(prev => ({
            ...prev,
            start: new Date(slot.start).toISOString().slice(0, 16),
            end: new Date(slot.end).toISOString().slice(0, 16),
        }));
        handleCloseConflictModal();
        setIsModalOpen(true); // Re-open the booking modal with new times
        setToast({ message: 'New time slot applied. Please confirm your booking.', type: 'success' });
    };
    
    const handleSelectAlternative = (item: Equipment) => {
        handleCloseConflictModal();
        handleOpenModal(item); // Open booking modal for the new item
    };

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
                <Input
                    placeholder="Search for equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEquipment.map(item => (
                    <EquipmentCard key={item.id} item={item} onBook={() => handleOpenModal(item)} />
                ))}
            </div>

            {/* Main Booking Modal */}
            {selectedEquipment && (
                <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Book: ${selectedEquipment.name}`}>
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                             <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2"><SparklesIcon/> Smart Scheduling Assistant</h4>
                             <p className="text-sm text-gray-600 mb-3">Describe the job, and we'll suggest equipment and duration.</p>
                             <textarea
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="e.g., I need a high-power drill for a two-day job next week to install ceiling fixtures"
                                className="w-full p-2 border border-gray-300 rounded-md bg-gray-800 text-white placeholder-gray-400"
                                rows={3}
                            />
                             <Button onClick={handleGetAiSuggestions} disabled={isAiLoading} className="mt-2 w-full" variant="secondary">
                                {isAiLoading ? 'Thinking...' : 'Get AI Suggestions'}
                            </Button>
                            {aiSuggestionError && (
                                <div className="mt-3 p-3 bg-red-100 border border-red-300 text-red-800 rounded-md text-sm">
                                    <p className="font-bold">Error</p>
                                    <p>{aiSuggestionError}</p>
                                    <button onClick={handleClearAiSuggestion} className="font-semibold underline mt-1 text-xs">Try again</button>
                                </div>
                            )}
                            {aiSuggestion && (
                                <div className="mt-3 p-3 bg-blue-100 border border-blue-200 rounded-md text-sm text-blue-900">
                                    <p className="font-bold mb-1">Here's what I found:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li><strong>Equipment type:</strong> {aiSuggestion.equipmentNames.join(', ') || 'Not specified'}</li>
                                        <li><strong>Estimated duration:</strong> {aiSuggestion.durationDays} day{aiSuggestion.durationDays !== 1 ? 's' : ''}</li>
                                    </ul>
                                    <div className="flex gap-2 mt-3">
                                        <Button onClick={handleApplyAiSuggestion} className="!py-1 !px-3 text-sm">Apply Suggestion</Button>
                                        <Button onClick={handleClearAiSuggestion} className="!py-1 !px-3 text-sm" variant="secondary">Dismiss</Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Job Description</label>
                            <Input type="text" value={bookingDetails.jobDescription} onChange={e => setBookingDetails({...bookingDetails, jobDescription: e.target.value})} className="bg-gray-800 text-white" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                <Input type="datetime-local" value={bookingDetails.start} onChange={e => setBookingDetails({...bookingDetails, start: e.target.value})} className="bg-gray-800 text-white" style={{ colorScheme: 'dark' }} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">End Time</label>
                                <Input type="datetime-local" value={bookingDetails.end} onChange={e => setBookingDetails({...bookingDetails, end: e.target.value})} className="bg-gray-800 text-white" style={{ colorScheme: 'dark' }}/>
                            </div>
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                            <Button onClick={handleBooking}>Confirm Booking</Button>
                        </div>
                    </div>
                </Modal>
            )}
            
             {/* Conflict Resolution Modal */}
            <Modal isOpen={isConflictModalOpen} onClose={handleCloseConflictModal} title="Scheduling Assistant">
                <div className="space-y-6">
                    <div className="text-center">
                         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                             <LightBulbIcon className="h-6 w-6 text-yellow-600" />
                         </div>
                        <h3 className="mt-2 text-lg leading-6 font-medium text-gray-900">Scheduling Conflict</h3>
                        <p className="mt-2 text-sm text-gray-500">
                           The equipment is unavailable during your selected time. Here are some alternatives:
                        </p>
                    </div>

                    {isAiRescheduling ? (
                         <div className="text-center py-4">
                            <p className="text-gray-600 animate-pulse">Finding smart alternatives...</p>
                        </div>
                    ) : (
                        <>
                            {conflictSuggestions?.alternativeSlots && conflictSuggestions.alternativeSlots.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Suggested Time Slots</h4>
                                    <div className="flex flex-col gap-2">
                                        {conflictSuggestions.alternativeSlots.map((slot, index) => (
                                            <button key={index} onClick={() => handleApplySlot(slot)} className="text-left w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                                <p className="font-medium text-sm text-gray-900">From: {new Date(slot.start).toLocaleString()}</p>
                                                <p className="font-medium text-sm text-gray-900">To: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{new Date(slot.end).toLocaleString()}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                             {conflictSuggestions?.alternativeEquipment && conflictSuggestions.alternativeEquipment.length > 0 && (
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-2">Alternative Equipment</h4>
                                    <div className="flex flex-col gap-2">
                                        {conflictSuggestions.alternativeEquipment.map(item => (
                                            <button key={item.id} onClick={() => handleSelectAlternative(item)} className="text-left w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors">
                                                <p className="font-semibold text-gray-900">{item.name}</p>
                                                <p className="text-sm text-gray-600">{item.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {!conflictSuggestions?.alternativeSlots?.length && !conflictSuggestions?.alternativeEquipment?.length && (
                                <p className="text-center text-gray-500 py-4">The AI assistant couldn't find any immediate alternatives. Please try a different time or date.</p>
                            )}
                        </>
                    )}

                    <div className="pt-4 flex justify-end">
                         <Button variant="secondary" onClick={handleCloseConflictModal}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default EquipmentView;