import React, { useState } from 'react';
import { User, Role, Equipment } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';

type UserData = Omit<User, 'id'>;
type EquipmentData = Omit<Equipment, 'id'>;

interface AdminViewProps {
    users: User[];
    equipment: Equipment[];
    addUser: (user: UserData) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: number) => Promise<void>;
    addEquipment: (item: EquipmentData) => Promise<void>;
    updateEquipment: (item: Equipment) => Promise<void>;
    deleteEquipment: (itemId: number) => Promise<void>;
}

const AdminView: React.FC<AdminViewProps> = ({
    users, equipment,
    addUser, updateUser, deleteUser,
    addEquipment, updateEquipment, deleteEquipment
}) => {
    const [isUserModalOpen, setUserModalOpen] = useState(false);
    const [isEquipmentModalOpen, setEquipmentModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | UserData | null>(null);
    const [currentEquipment, setCurrentEquipment] = useState<Equipment | EquipmentData | null>(null);

    const openUserModal = (user: User | null = null) => {
        setCurrentUser(user || { name: '', role: Role.Technician });
        setUserModalOpen(true);
    };
    
    const openEquipmentModal = (item: Equipment | null = null) => {
        setCurrentEquipment(item || { name: '', description: '', imageUrl: `https://picsum.photos/id/${Math.floor(Math.random()*200)}/400/300` });
        setEquipmentModalOpen(true);
    };

    const handleUserSave = async () => {
        if (currentUser) {
            try {
                if ('id' in currentUser) {
                    await updateUser(currentUser);
                } else {
                    await addUser(currentUser);
                }
                setUserModalOpen(false);
            } catch (error) {
                alert(`Error saving user: ${(error as Error).message}`);
            }
        }
    };
    
    const handleEquipmentSave = async () => {
        if (currentEquipment) {
             try {
                if ('id' in currentEquipment) {
                    await updateEquipment(currentEquipment);
                } else {
                    await addEquipment(currentEquipment as EquipmentData);
                }
                setEquipmentModalOpen(false);
             } catch (error) {
                alert(`Error saving equipment: ${(error as Error).message}`);
             }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Management */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <Button onClick={() => openUserModal()}>
                        <PlusIcon className="h-4 w-4" /> Add User
                    </Button>
                </div>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div>
                               <p className="font-semibold">{user.name}</p>
                               <p className="text-sm text-gray-500">{user.role}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => openUserModal(user)} className="p-2"><EditIcon /></Button>
                                {user.role !== Role.Admin && <Button variant="danger" onClick={() => deleteUser(user.id)} className="p-2"><TrashIcon /></Button>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Equipment Management */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Equipment Management</h2>
                    <Button onClick={() => openEquipmentModal()}>
                        <PlusIcon className="h-4 w-4" /> Add Equipment
                    </Button>
                </div>
                 <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                    {equipment.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                             <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-md object-cover mr-4" />
                            <div className="flex-grow">
                               <p className="font-semibold">{item.name}</p>
                               <p className="text-sm text-gray-500 truncate">{item.description}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => openEquipmentModal(item)} className="p-2"><EditIcon /></Button>
                                <Button variant="danger" onClick={() => deleteEquipment(item.id)} className="p-2"><TrashIcon /></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User Modal */}
            <Modal isOpen={isUserModalOpen} onClose={() => setUserModalOpen(false)} title={currentUser && 'id' in currentUser ? 'Edit User' : 'Add User'}>
                {currentUser && (
                    <div className="space-y-4">
                        <Input label="Name" value={currentUser.name} onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})} />
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                             <select value={currentUser.role} onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as Role})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                             >
                                <option value={Role.Technician}>Technician</option>
                                <option value={Role.Admin}>Admin</option>
                             </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setUserModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleUserSave}>Save</Button>
                        </div>
                    </div>
                )}
            </Modal>
            
            {/* Equipment Modal */}
            <Modal isOpen={isEquipmentModalOpen} onClose={() => setEquipmentModalOpen(false)} title={currentEquipment && 'id' in currentEquipment ? 'Edit Equipment' : 'Add Equipment'}>
                 {currentEquipment && (
                    <div className="space-y-4">
                        <Input label="Name" value={currentEquipment.name} onChange={(e) => setCurrentEquipment({...currentEquipment, name: e.target.value})} />
                        <Input label="Description" value={(currentEquipment as any).description} onChange={(e) => setCurrentEquipment({...currentEquipment, description: e.target.value})} />
                        <Input label="Image URL" value={currentEquipment.imageUrl} onChange={(e) => setCurrentEquipment({...currentEquipment, imageUrl: e.target.value})} />
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setEquipmentModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleEquipmentSave}>Save</Button>
                        </div>
                    </div>
                 )}
            </Modal>
        </div>
    );
};

export default AdminView;