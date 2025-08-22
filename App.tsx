
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Tab } from './types';
import { apiService } from './services/apiService';
import Layout from './components/Layout';
import CalendarView from './features/calendar/CalendarView';
import EquipmentView from './features/equipment/EquipmentView';
import TechnicianView from './features/technician/TechnicianView';
import AdminView from './features/admin/AdminView';

const TABS: { id: Tab; label: string; roles: UserRole[] }[] = [
    { id: 'CALENDAR', label: 'Calendar', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { id: 'EQUIPMENT', label: 'Equipment', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { id: 'TECHNICIAN', label: 'My Reservations', roles: [UserRole.TECHNICIAN, UserRole.ADMIN] },
    { id: 'ADMIN', label: 'Admin', roles: [UserRole.ADMIN] },
];

const App: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('CALENDAR');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            const fetchedUsers = await apiService.getUsers();
            setUsers(fetchedUsers);
            if (fetchedUsers.length > 0) {
                // Default to first user, assumed to be an admin
                setCurrentUser(fetchedUsers[0]);
            }
            setIsLoading(false);
        };
        loadInitialData();
    }, []);

    const availableTabs = useMemo(() => {
        if (!currentUser) return [];
        return TABS.filter(tab => tab.roles.includes(currentUser.role));
    }, [currentUser]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
    };
    
    const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUser = users.find(u => u.id === event.target.value);
        if (selectedUser) {
            setCurrentUser(selectedUser);
            // If current tab is not available for new user, switch to their first available tab
            const newAvailableTabs = TABS.filter(tab => tab.roles.includes(selectedUser.role));
            if (!newAvailableTabs.some(t => t.id === activeTab)) {
                setActiveTab(newAvailableTabs[0].id);
            }
        }
    };

    const handleUsersUpdate = async () => {
        const updatedUsers = await apiService.getUsers();
        setUsers(updatedUsers);
        // Ensure currentUser is still valid
        if (currentUser && !updatedUsers.some(u => u.id === currentUser.id)) {
            setCurrentUser(updatedUsers.length > 0 ? updatedUsers[0] : null);
        }
    }

    const renderContent = () => {
        if (!currentUser) {
            return <div className="text-center p-8">No user selected or available.</div>;
        }

        switch (activeTab) {
            case 'CALENDAR':
                return <CalendarView currentUser={currentUser} />;
            case 'EQUIPMENT':
                return <EquipmentView currentUser={currentUser} />;
            case 'TECHNICIAN':
                return <TechnicianView currentUser={currentUser} />;
            case 'ADMIN':
                return <AdminView currentUser={currentUser} onUsersUpdate={handleUsersUpdate} />;
            default:
                return <CalendarView currentUser={currentUser} />;
        }
    };

    if (isLoading || !currentUser) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-xl font-semibold">Loading Application...</div>
            </div>
        );
    }

    return (
        <Layout 
            tabs={availableTabs} 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            currentUser={currentUser}
            users={users}
            onUserChange={handleUserChange}
        >
            {renderContent()}
        </Layout>
    );
};

export default App;
