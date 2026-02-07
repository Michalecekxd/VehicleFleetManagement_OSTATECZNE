import React, { useState } from 'react';
import styles1 from './VehicleDetails.module.css';
import ConfirmDelete from './ConfirmDelete';

interface DeleteVehicleProps {
    vehicleId: number;
    vehicleType: number;
    onDeleteSuccess: () => void;
    buttonText: string;
}

const DeleteVehicle: React.FC<DeleteVehicleProps> = ({ vehicleId, onDeleteSuccess, vehicleType, buttonText }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`/api/vehicle/${vehicleId}?vehicleType=${vehicleType}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete vehicle');
            }

            onDeleteSuccess();
            setIsModalOpen(false);
        } catch (error) {
            setError('Wystąpił błąd podczas usuwania pojazdu.');
        } finally {
            setIsDeleting(false);
        }
    };

    const isSemiTrailerTruck = vehicleType === 3;

    return (
        <div>
            <button
                onClick={() => setIsModalOpen(true)}
                className={styles1.deleteButton}
                disabled={isDeleting}
            >
                {buttonText}
            </button>

            <ConfirmDelete
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setError(null);
                }}
                onConfirm={handleDelete}
                isSemiTrailerTruck={isSemiTrailerTruck}
                error={error}
            />
        </div>
    );
};

export default DeleteVehicle;
