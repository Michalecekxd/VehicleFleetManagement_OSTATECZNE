import React, { useState, useEffect } from 'react';
import styles from './Login.module.css';
import { useNavigate } from 'react-router-dom';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import transparentLogo from '../../assets/transparent_logo.png';

const validateEmail = (email: string) => {
    if (!email) return "Email jest wymagany";
    const regex = /\S+@\S+\.\S+/;
    return regex.test(email) ? "" : "Niepoprawny format email";
};

const validatePassword = (password: string) => {
    if (!password) return "Hasło jest wymagane";
    return password.length >= 6 ? "" : "Hasło musi mieć co najmniej 6 znaków";
};

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({ emailError: '', passwordError: '' });
    const [loginError, setLoginError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("token")) {
            navigate('/panel');
        }
    }, [navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'email') {
            setErrors({ ...errors, emailError: validateEmail(value) });
        } else if (name === 'password') {
            setErrors({ ...errors, passwordError: validatePassword(value) });
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const emailValidation = validateEmail(formData.email);
        const passwordValidation = validatePassword(formData.password);
        setErrors({ emailError: emailValidation, passwordError: passwordValidation });
        if (emailValidation || passwordValidation) return;
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("userRole", data.role);
                setLoginError('');
                navigate('/panel', { replace: true });
            } else {
                setLoginError(data.message || 'Logowanie nie powiodło się');
            }
        } catch (error) {
            setLoginError('Zweryfikuj wprowadzone dane i spróbuj ponownie');
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.formContainer}>
                <header className={styles.loginHeader}>
                    <img
                        className={styles.loginImage}
                        src={transparentLogo}
                        alt="Logo"
                    />
                </header>
                <p
                    className={styles.message}
                    style={{ visibility: loginError ? 'visible' : 'hidden', color: 'red' }}
                >
                    {loginError}
                </p>
                <form onSubmit={handleLogin}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email">
                            <MdEmail className={styles.icon} />
                            Email
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Wprowadź email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            <span className={styles.error}>{errors.emailError}</span>
                        </div>
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="password">
                            <MdLock className={styles.icon} />
                            Hasło
                        </label>
                        <div className={styles.inputWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                name="password"
                                placeholder="Wprowadź hasło"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            <span
                                className={styles.toggleIcon}
                                onClick={togglePasswordVisibility}
                            >
                                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                            </span>
                            <span className={styles.error}>{errors.passwordError}</span>
                        </div>
                    </div>
                    <button type="submit" className={styles.submitButton}>Zaloguj</button>
                </form>
            </div>
        </div>
    );
};

export default Login;
