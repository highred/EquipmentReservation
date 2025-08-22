
import React, { useState, useEffect, useCallback } from 'react';
import { User, StagingItem } from '../../types';
import { apiService } from '../../services/apiService';

const StagingItemCard: React.FC<{ item: StagingItem; onStageToggle: (id: string, staged: boolean) => void; }> = ({ item, onStageToggle }) => {
    return (
        <div className={`p-4 rounded-lg flex items-center transition-colors duration-300 ${item.staged ? 'bg-green-50' : 'bg-white'}`}>
            <input
                type="checkbox"
                checked={item.staged}
                onChange={(e) => onStageToggle(item.id, e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-accent"
            />
            <div className={`ml-4 flex-grow ${item.staged ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                <p className="font-bold">{item.equipment.description} <span className="font-normal text-gray-600">({item.equipment.gageId})</span></p>
                <p className="text-sm">For: <span className="font-semibold">{item.user.name}</span> at <span className="font-semibold">{item.company}</span></p>
                 {item.notes && <p className="text-xs text-blue-700 mt-1 italic">Note: "{item.notes}"</p>}
            </div>
        </div>
    )
};


const AdminView: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [stagingList, setStagingList] = useState<StagingItem[]>([]);
    const [loading, setLoading] = useState(false);
    
    const fetchStagingList = useCallback(async (date: string) => {
        setLoading(true);
        const data = await apiService.getStagingList(date);
        setStagingList(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchStagingList(selectedDate);
    }, [selectedDate, fetchStagingList]);

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedDate(e.target.value);
    };

    const handleStageToggle = async (reservationId: string, staged: boolean) => {
        const result = await apiService.updateStagingStatus(reservationId, staged);
        if (result.success) {
            setStagingList(prevList =>
                prevList.map(item =>
                    item.id === reservationId ? { ...item, staged } : item
                )
            );
        }
    };
    
    const stagedCount = stagingList.filter(item => item.staged).length;
    const totalCount = stagingList.length;

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">User Management</h2>
                <p className="text-gray-600">User management functionality would be implemented here, connecting to a backend service like Supabase for creating, updating, and deleting users and their roles.</p>
                 {/* Placeholder for future implementation */}
                <div className="mt-4 p-4 border-2 border-dashed border-gray-300 rounded-md text-center text-gray-500">
                    User List & Controls Placeholder
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Daily Staging Checklist</h2>
                    <div className="flex items-center gap-2">
                        <label htmlFor="staging-date" className="font-semibold text-gray-700">Pickup Date:</label>
                        <input
                            type="date"
                            id="staging-date"
                            value={selectedDate}
                            onChange={handleDateChange}
                            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        />
                    </div>
                </div>
                
                <div className="mb-4">
                    <p className="text-lg font-semibold text-gray-700">Progress: {stagedCount} / {totalCount} items staged</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div className="bg-status-success h-2.5 rounded-full" style={{ width: `${totalCount > 0 ? (stagedCount/totalCount)*100 : 0}%` }}></div>
                    </div>
                </div>

                {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading staging list...</p>
                ) : stagingList.length > 0 ? (
                    <div className="space-y-3 bg-gray-50 p-4 rounded-md">
                        {stagingList.map(item => (
                           <StagingItemCard key={item.id} item={item} onStageToggle={handleStageToggle} />
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">No equipment scheduled for pickup on this day.</p>
                )}
            </div>
        </div>
    );
};

export default AdminView;
