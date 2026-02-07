import React, { useState } from 'react';
import styles from './RegisterForm.module.css';

const validateEmail = (email: string) => {
    if (!email) return "Email jest wymagany";
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email) ? "" : "Niepoprawny format email";
};

const validatePassword = (password: string) => {
    if (!password) return "Hasło jest wymagane";
    return password.length >= 6 ? "" : "Hasło musi mieć co najmniej 6 znaków";
};

const validatePhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return "Numer telefonu jest wymagany";
    const regex = /^\d{9}$/;
    return regex.test(phoneNumber) ? "" : "Numer telefonu musi składać się z 9 cyfr";
};

const RegisterForm: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        phoneNumber: '',
    });

    const [errors, setErrors] = useState({
        emailError: '',
        passwordError: '',
        phoneNumberError: '',
    });

    const [success, setSuccess] = useState('');
    const [registerError, setRegisterError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'email') {
            setErrors({ ...errors, emailError: validateEmail(value) });
        } else if (name === 'password') {
            setErrors({ ...errors, passwordError: validatePassword(value) });
        } else if (name === 'phoneNumber') {
            setErrors({ ...errors, phoneNumberError: validatePhoneNumber(value) });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        const emailValidation = validateEmail(formData.email);
        const passwordValidation = validatePassword(formData.password);
        const phoneValidation = validatePhoneNumber(formData.phoneNumber);

        setErrors({
            emailError: emailValidation,
            passwordError: passwordValidation,
            phoneNumberError: phoneValidation,
        });

        if (emailValidation || passwordValidation || phoneValidation) {
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess('Rejestracja udana!');
                setRegisterError('');
                setErrors({
                    emailError: '',
                    passwordError: '',
                    phoneNumberError: '',
                });
            } else {
                setSuccess('');
                setRegisterError(data.message || 'Rejestracja nie powiodła się');
            }
        } catch (error) {
            setSuccess('');
            setRegisterError('Błąd rejestracji');
        }
    };

    return (
        <div className={styles['form-container']}>
            <h2>Rejestracja</h2>
            <br />
            {(success || registerError) && (
                <p style={{ color: success ? 'green' : 'red' }}>
                    {success || registerError}
                </p>
            )}
            <br />
            <form onSubmit={handleRegister}>
                <div className={styles['input-group']}>
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur} required
                    />
                    {errors.emailError && <p style={{ color: 'red' }}>{errors.emailError}</p>}
                </div>

                <div className={styles['input-group']}>
                    <label>Hasło</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    {errors.passwordError && <p style={{ color: 'red' }}>{errors.passwordError}</p>}
                </div>

                <div className={styles['input-group']}>
                    <label>Numer telefonu</label>
                    <input
                        type="text"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                    />
                    {errors.phoneNumberError && <p style={{ color: 'red' }}>{errors.phoneNumberError}</p>}
                </div>
                <br />
                <button type="submit">Zarejestruj</button>
            </form>
        </div>
    );
};

export default RegisterForm;