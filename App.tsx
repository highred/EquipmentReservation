
import React, { useState, useMemo, useEffect } from 'react';
import { User, UserRole, Tab } from './types';
import { apiService } from './services/apiService';
import Layout from './components/Layout';
import CalendarView from './features/calendar/CalendarView';
import EquipmentView from './features/equipment/EquipmentView';
import TechnicianView from './features/technician/TechnicianView';
import CompanyView from './features/company/CompanyView';
import AdminView from './features/admin/AdminView';
import LoginScreen from './features/auth/LoginScreen';

const TABS: { id: Tab; label: string; roles: UserRole[] }[] = [
    { id: 'CALENDAR', label: 'Calendar', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { id: 'EQUIPMENT', label: 'Equipment', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { id: 'TECHNICIAN', label: 'My Reservations', roles: [UserRole.TECHNICIAN, UserRole.ADMIN] },
    { id: 'COMPANY', label: 'Companies', roles: [UserRole.ADMIN, UserRole.TECHNICIAN] },
    { id: 'ADMIN', label: 'Admin', roles: [UserRole.ADMIN] },
];

const App: React.FC = () => {
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [viewAsUser, setViewAsUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('CALENDAR');
    const [selectedDateForTechView, setSelectedDateForTechView] = useState<string | null>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (localStorage.getItem('theme') === 'dark') return 'dark';
        if (localStorage.getItem('theme') === 'light') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    const loggedInUser = currentUser;
    const effectiveUser = viewAsUser || currentUser;

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [theme]);

    useEffect(() => {
        const fetchAllUsers = async () => {
             if (currentUser?.role === UserRole.ADMIN) {
                const fetchedUsers = await apiService.getUsers();
                setAllUsers(fetchedUsers);
            }
        };
        if (currentUser) {
            fetchAllUsers();
        }
    }, [currentUser]);

    const handleThemeToggle = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

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
        if (!effectiveUser) return [];
        return TABS.filter(tab => tab.roles.includes(effectiveUser.role));
    }, [effectiveUser]);

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
            const newAvailableTabs = TABS.filter(tab => tab.roles.includes(selectedUser.role));
            if (!newAvailableTabs.some(t => t.id === activeTab)) {
                setActiveTab(newAvailableTabs[0].id);
            }
        }
    };

    const handleDataUpdate = async () => {
        // This function can be called by child components to refresh app-level data
        if (currentUser?.role === UserRole.ADMIN) {
            const updatedUsers = await apiService.getUsers();
            setAllUsers(updatedUsers);
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
            case 'COMPANY':
                return <CompanyView currentUser={effectiveUser} />;
            case 'ADMIN':
                if (loggedInUser?.role !== UserRole.ADMIN) return null; // Defensive check
                return <AdminView currentUser={effectiveUser} onDataUpdate={handleDataUpdate} />;
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
            theme={theme}
            onThemeToggle={handleThemeToggle}
        >
            {renderContent()}
        </Layout>
    );
};

export default App;