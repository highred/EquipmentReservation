
import React, { useState, useEffect, useCallback } from 'react';
import { User, StagingItem } from '../../types';
import { apiService } from '../../services/apiService';
import { UserGroupIcon, PlusIcon } from '../../components/icons/Icons';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';

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


const AdminView: React.FC<{ currentUser: User, onUsersUpdate: () => void; }> = ({ onUsersUpdate }) => {
    // Staging state
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);
    const [stagingList, setStagingList] = useState<StagingItem[]>([]);
    const [loadingStaging, setLoadingStaging] = useState(false);

    // User Management state
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    
    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // Staging Functions
    const fetchStagingList = useCallback(async (date: string) => {
        setLoadingStaging(true);
        const data = await apiService.getStagingList(date);
        setStagingList(data);
        setLoadingStaging(false);
    }, []);

    useEffect(() => {
        fetchStagingList(selectedDate);
    }, [selectedDate, fetchStagingList]);

    // User Management Functions
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        const data = await apiService.getUsers();
        setUsers(data);
        setLoadingUsers(false);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAddUser = () => {
        setEditingUser(null);
        setIsUserModalOpen(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleDeleteUser = async (user: User) => {
        if (window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
            const result = await apiService.deleteUser(user.id);
            showNotification(result.success ? 'success' : 'error', result.message);
            if (result.success) {
                fetchUsers();
                onUsersUpdate(); // Notify App component to refresh users list
            }
        }
    };

    const handleUserFormSubmit = async (userData: Omit<User, 'id'> | User) => {
        const isEditing = 'id' in userData;
        const result = isEditing ? await apiService.updateUser(userData) : await apiService.addUser(userData);

        showNotification(result.success ? 'success' : 'error', result.message);
        if (result.success) {
            setIsUserModalOpen(false);
            fetchUsers();
            onUsersUpdate(); // Notify App component to refresh users list
        }
    };

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
            {notification && (
                <div className={`fixed top-24 right-8 z-50 p-4 rounded-md shadow-lg ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {notification.message}
                </div>
            )}
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <UserGroupIcon className="w-7 h-7 mr-3 text-brand-primary" />
                        User Management
                    </h2>
                    <button
                        onClick={handleAddUser}
                        className="flex items-center justify-center bg-status-success text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-300"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add User
                    </button>
                </div>
                {loadingUsers ? (
                     <p className="text-center text-gray-500 py-8">Loading users...</p>
                ) : (
                    <UserTable users={users} onEdit={handleEditUser} onDelete={handleDeleteUser} />
                )}
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

                {loadingStaging ? (
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
             {isUserModalOpen && (
                <UserFormModal
                    user={editingUser}
                    onClose={() => setIsUserModalOpen(false)}
                    onSubmit={handleUserFormSubmit}
                />
            )}
        </div>
    );
};

export default AdminView;
