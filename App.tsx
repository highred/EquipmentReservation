
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Tab } from './types';
import { apiService } from './services/apiService';
import Layout from './components/Layout';
import CalendarView from './features/calendar/CalendarView';
import EquipmentView from './features/equipment/EquipmentView';
import TechnicianView from './features/technician/TechnicianView';
import AdminView from './features/admin/AdminView';
import LoginScreen from './features/auth/LoginScreen';

const TABS: { id: Tab; label: string; roles: UserRole[] }[] = [
    { id: 'CALENDAR', label: 'Calendar', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { id: 'EQUIPMENT', label: 'Equipment', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { id: 'TECHNICIAN', label: 'My Reservations', roles: [UserRole.TECHNICIAN, UserRole.ADMIN] },
    { id: 'ADMIN', label: 'Admin', roles: [UserRole.ADMIN] },
];

const App: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [viewAsUser, setViewAsUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('CALENDAR');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDateForTechView, setSelectedDateForTechView] = useState<string | null>(null);

    const loggedInUser = currentUser;
    const effectiveUser = viewAsUser || currentUser;

    useEffect(() => {
        const fetchAllUsers = async () => {
             if (currentUser?.role === UserRole.ADMIN) {
                const fetchedUsers = await apiService.getUsers();
                setAllUsers(fetchedUsers);
            }
        };
        fetchAllUsers();
    }, [currentUser]);

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        setViewAsUser(user);
        const userTabs = TABS.filter(tab => tab.roles.includes(user.role));
        setActiveTab(userTabs[0]?.id || 'CALENDAR');
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setViewAsUser(null);
        setAllUsers([]);
    };

    const availableTabs = useMemo(() => {
        if (!loggedInUser) return [];
        return TABS.filter(tab => tab.roles.includes(loggedInUser.role));
    }, [loggedInUser]);

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        setSelectedDateForTechView(null); // Reset date filter when changing tabs
    };
    
    const handleCalendarDayClick = (date: string) => {
        setSelectedDateForTechView(date);
        setActiveTab('TECHNICIAN');
    };

    const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedUser = allUsers.find(u => u.id === event.target.value);
        if (selectedUser) {
            setViewAsUser(selectedUser);
            // Admins can view technician tabs
            if (loggedInUser?.role === UserRole.ADMIN && selectedUser.role === UserRole.TECHNICIAN) {
                // do nothing to the tabs
            } else {
                 const newAvailableTabs = TABS.filter(tab => tab.roles.includes(selectedUser.role));
                if (!newAvailableTabs.some(t => t.id === activeTab)) {
                    setActiveTab(newAvailableTabs[0].id);
                }
            }
        }
    };

    const handleUsersUpdate = async () => {
        if (currentUser?.role === UserRole.ADMIN) {
            const updatedUsers = await apiService.getUsers();
            setAllUsers(updatedUsers);
            // If the user being viewed was deleted, revert to self-view
            if (viewAsUser && !updatedUsers.some(u => u.id === viewAsUser.id)) {
                setViewAsUser(currentUser);
            }
        }
    }

    const renderContent = () => {
        if (!effectiveUser) {
            return <div className="text-center p-8">Loading...</div>;
        }

        switch (activeTab) {
            case 'CALENDAR':
                return <CalendarView currentUser={effectiveUser} onDayClick={handleCalendarDayClick} />;
            case 'EQUIPMENT':
                return <EquipmentView currentUser={effectiveUser} />;
            case 'TECHNICIAN':
                return <TechnicianView currentUser={effectiveUser} selectedDate={selectedDateForTechView} onClearDateFilter={() => setSelectedDateForTechView(null)} />;
            case 'ADMIN':
                return <AdminView currentUser={effectiveUser} onUsersUpdate={handleUsersUpdate} />;
            default:
                return <CalendarView currentUser={effectiveUser} onDayClick={handleCalendarDayClick} />;
        }
    };

    if (!currentUser) {
        return <LoginScreen onLogin={handleLogin} />;
    }

    return (
        <Layout 
            tabs={availableTabs} 
            activeTab={activeTab} 
            onTabChange={handleTabChange}
            currentUser={loggedInUser}
            viewAsUser={viewAsUser}
            users={allUsers}
            onUserChange={handleUserChange}
            onLogout={handleLogout}
        >
            {renderContent()}
        </Layout>
    );
};

export default App;