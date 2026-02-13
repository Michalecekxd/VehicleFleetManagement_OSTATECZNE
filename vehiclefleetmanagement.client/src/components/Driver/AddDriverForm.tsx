import React, { useState } from "react";
import styles from "../Driver/AddDriverForm.module.css";

interface AddDriverFormProps {
    closeModal: () => void;
    onDriverAdded: (newDriver: any) => void;
}

const AddDriverForm: React.FC<AddDriverFormProps> = ({ closeModal, onDriverAdded }) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        userName: "",
        password: "",
        phoneNumber: ""
    });
    const [errorMessages, setErrorMessages] = useState<string[]>([]);

    const API = import.meta.env.VITE_API_URL;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "phoneNumber") {
            let formattedValue = value.replace(/[^0-9+ ]/g, "");
            if (formattedValue.indexOf("+") > 0) {
                formattedValue = formattedValue.replace(/\+/g, "");
            }
            if (formattedValue.startsWith("+")) {
                formattedValue = "+" + formattedValue.slice(1).replace(/\+/g, "");
            }
            const digitsOnly = formattedValue.replace(/[^0-9]/g, "");
            if (digitsOnly.length > 15) {
                return;
            }
            setFormData({ ...formData, [name]: formattedValue });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Wyślij zapytanie do API, aby dodać kierowcę
            const response = await fetch(`${API}/api/driver`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errors = errorData.errors || [errorData.message || "Nieznany błąd."];

                const polishErrors = errors.map((error: string) => {
                    switch (error) {
                        case "Passwords must be at least 6 characters.":
                            return "Hasło musi mieć co najmniej 6 znaków.";
                        case "Passwords must have at least one non alphanumeric character.":
                            return "Hasło musi zawierać co najmniej jeden znak specjalny (np. !, @, #, $, %, ^, &, *).";
                        case "Passwords must have at least one digit ('0'-'9').":
                            return "Hasło musi zawierać co najmniej jedną cyfrę (0-9).";
                        case "Passwords must have at least one uppercase ('A'-'Z').":
                            return "Hasło musi zawierać co najmniej jedną dużą literę (A-Z).";
                        default:
                            return error;
                    }
                });

                setErrorMessages(polishErrors);
                return;
            }

            const newDriverData = await response.json();

            const newDriver = {
                id: newDriverData.driverId || newDriverData.id,
                firstName: newDriverData.firstName,
                lastName: newDriverData.lastName,
                email: newDriverData.email,
                phoneNumber: newDriverData.phoneNumber,
                isBusy: false
            };

            onDriverAdded(newDriver); 

            closeModal();

        } catch (error: unknown) {
            if (error instanceof Error) {
                setErrorMessages([error.message]);
            } else {
                setErrorMessages(["Wystąpił nieznany błąd podczas dodawania kierowcy."]);
            }
        }
    };


    return (
        <div className={styles.modalContainer}>
            <button className={styles.closeButton} onClick={closeModal}>
                X
            </button>
            <h3>➕ Dodaj kierowcę</h3>
            <br />
            {errorMessages.length > 0 && (
                <div className={styles.errorContainer}>
                    <ul>
                        {errorMessages.map((msg, index) => (
                            <li key={index} style={{ color: "red" }}>{msg}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.formContainer}>
                <label className={styles.labelField}>Imię:</label>
                <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />

                <label className={styles.labelField}>Nazwisko:</label>
                <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />

                <label className={styles.labelField}>Email (Username):</label>
                <input
                    type="email"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />

                <label className={styles.labelField}>Hasło:</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />

                <label className={styles.labelField}>Numer telefonu:</label>
                <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className={styles.inputField}
                />

                <button type="submit" className={styles.submitButton}>
                    Dodaj
                </button>
            </form>
        </div>
    );
};

export default AddDriverForm;
