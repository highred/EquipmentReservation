
import React, { useState, useEffect, useCallback } from 'react';
import { User, Company } from '../../types';
import { apiService } from '../../services/apiService';
import { UserGroupIcon, PlusIcon, BuildingOfficeIcon, UploadIcon } from '../../components/icons/Icons';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal';
import PasswordModal from './PasswordModal';
import CompanyTable from './CompanyTable';
import CompanyFormModal from './CompanyFormModal';
import CompanyImportModal from './CompanyImportModal';

const AdminView: React.FC<{ currentUser: User, onDataUpdate: () => void; }> = ({ onDataUpdate }) => {
    // User Management state
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<User | null>(null);

    // Company Management state
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loadingCompanies, setLoadingCompanies] = useState(false);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isCompanyImportModalOpen, setIsCompanyImportModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
    
    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    // User Management Functions
    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        const data = await apiService.getUsers();
        setUsers(data);
        setLoadingUsers(false);
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Company Management Functions
    const fetchCompanies = useCallback(async () => {
        setLoadingCompanies(true);
        const data = await apiService.getCompanies();
        setCompanies(data);
        setLoadingCompanies(false);
    }, []);

    useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

    const handleAddUser = () => { setEditingUser(null); setIsUserModalOpen(true); };
    const handleEditUser = (user: User) => { setEditingUser(user); setIsUserModalOpen(true); };
    const handleDeleteUser = async (user: User) => {
        if (window.confirm(`Are you sure you want to delete user "${user.name}"? This action cannot be undone.`)) {
            const result = await apiService.deleteUser(user.id);
            showNotification(result.success ? 'success' : 'error', result.message);
            if (result.success) { fetchUsers(); onDataUpdate(); }
        }
    };
    const handleSetPassword = (user: User) => { setSelectedUserForPassword(user); setIsPasswordModalOpen(true); };
    const handleUserFormSubmit = async (userData: Omit<User, 'id'> | User) => {
        const isEditing = 'id' in userData;
        const result = isEditing ? await apiService.updateUser(userData) : await apiService.addUser(userData);
        showNotification(result.success ? 'success' : 'error', result.message);
        if (result.success) { setIsUserModalOpen(false); fetchUsers(); onDataUpdate(); }
    };
    const handlePasswordSubmit = async (password: string) => {
        if (!selectedUserForPassword) return;
        const result = await apiService.setPassword(selectedUserForPassword.id, password);
        showNotification(result.success ? 'success' : 'error', result.message);
        if (result.success) { setIsPasswordModalOpen(false); setSelectedUserForPassword(null); }
    };

    // Company handlers
    const handleAddCompany = () => { setEditingCompany(null); setIsCompanyModalOpen(true); };
    const handleEditCompany = (company: Company) => { setEditingCompany(company); setIsCompanyModalOpen(true); };
    const handleDeleteCompany = async (company: Company) => {
        if (window.confirm(`Are you sure you want to delete company "${company.name}"?`)) {
            const result = await apiService.deleteCompany(company.id);
            showNotification(result.success ? 'success' : 'error', result.message);
            if (result.success) { fetchCompanies(); }
        }
    };
    const handleCompanyFormSubmit = async (companyData: Omit<Company, 'id'> | Company) => {
        const isEditing = 'id' in companyData;
        const result = isEditing ? await apiService.updateCompany(companyData) : await apiService.addCompany(companyData);
        showNotification(result.success ? 'success' : 'error', result.message);
        if (result.success) { setIsCompanyModalOpen(false); fetchCompanies(); }
    };
    const handleCompanyImportComplete = (result: { createdCount: number; updatedCount: number; errors: any[] }) => {
        const { createdCount, updatedCount, errors } = result;
        const successCount = createdCount + updatedCount;
        let message = `Import complete: ${createdCount} companies added, ${updatedCount} companies updated.`;
        if (errors.length > 0) {
            message += ` ${errors.length} rows failed.`;
        }
        showNotification(errors.length > 0 ? 'warning' : 'success', message);
        if (successCount > 0) { fetchCompanies(); }
    };

    return (
        <div>
            {notification && (
                <div className={`fixed top-24 right-8 z-50 p-4 rounded-md shadow-lg ${
                    notification.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 
                    notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' : 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                }`}>
                    {notification.message}
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <UserGroupIcon className="w-7 h-7 mr-3 text-brand-primary" />
                            User Management
                        </h2>
                        <button onClick={handleAddUser} className="flex items-center justify-center bg-status-success text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-300">
                            <PlusIcon className="w-5 h-5 mr-2" />Add User
                        </button>
                    </div>
                    {loadingUsers ? <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading users...</p> : <UserTable users={users} onEdit={handleEditUser} onDelete={handleDeleteUser} onSetPassword={handleSetPassword} />}
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                            <BuildingOfficeIcon className="w-7 h-7 mr-3 text-brand-primary" />
                            Company Management
                        </h2>
                        <div className="flex gap-2">
                             <button onClick={() => setIsCompanyImportModalOpen(true)} className="flex items-center justify-center bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300">
                                <UploadIcon className="w-5 h-5 mr-2" /> Import
                            </button>
                            <button onClick={handleAddCompany} className="flex items-center justify-center bg-status-success text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition-colors duration-300">
                                <PlusIcon className="w-5 h-5 mr-2" />Add Company
                            </button>
                        </div>
                    </div>
                    {loadingCompanies ? <p className="text-center text-gray-500 dark:text-gray-400 py-8">Loading companies...</p> : <CompanyTable companies={companies} onEdit={handleEditCompany} onDelete={handleDeleteCompany} />}
                </div>
            </div>

            {isUserModalOpen && <UserFormModal user={editingUser} onClose={() => setIsUserModalOpen(false)} onSubmit={handleUserFormSubmit} />}
            {isPasswordModalOpen && selectedUserForPassword && <PasswordModal user={selectedUserForPassword} onClose={() => setIsPasswordModalOpen(false)} onSubmit={handlePasswordSubmit} />}
            {isCompanyModalOpen && <CompanyFormModal company={editingCompany} onClose={() => setIsCompanyModalOpen(false)} onSubmit={handleCompanyFormSubmit} />}
            {isCompanyImportModalOpen && <CompanyImportModal onClose={() => setIsCompanyImportModalOpen(false)} onImportComplete={handleCompanyImportComplete} />}
        </div>
    );
};

export default AdminView;