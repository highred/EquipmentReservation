
import React, { useState, useMemo } from 'react';
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
    const [users] = useState<User[]>(apiService.getUsers());
    const [currentUser, setCurrentUser] = useState<User>(users[0]); // Default to Admin
    const [activeTab, setActiveTab] = useState<Tab>('CALENDAR');

    const availableTabs = useMemo(() => {
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

    const renderContent = () => {
        switch (activeTab) {
            case 'CALENDAR':
                return <CalendarView currentUser={currentUser} />;
            case 'EQUIPMENT':
                return <EquipmentView currentUser={currentUser} />;
            case 'TECHNICIAN':
                return <TechnicianView currentUser={currentUser} />;
            case 'ADMIN':
                return <AdminView currentUser={currentUser} />;
            default:
                return <CalendarView currentUser={currentUser} />;
        }
    };

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