import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import styles from "./Header.module.css";
import transparentLogo from "../../assets/transparent_logo.png";

interface HeaderProps {
    isLoggedIn: boolean;
    userRole: string | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, userRole, onLogout }) => {
    const navigate = useNavigate();

    const handleLogoClick = () => {
        navigate(isLoggedIn ? "/panel" : "/");
    };

    return (
        <header className={styles.header}>
            <nav className={styles.nav}>
                <ul className={styles.navList}>
                    <li className={styles.logoItem}>
                        <img
                            src={transparentLogo}
                            alt="Logo"
                            className={styles.logo}
                            onClick={handleLogoClick}
                        />
                    </li>

                    {isLoggedIn && userRole === "Driver" && (
                        <>
                            <li className={styles.navItem}>
                                <NavLink
                                    to="/panel/deliveries"
                                    className={({ isActive }) =>
                                        isActive ? styles.activeLink : styles.navLink
                                    }
                                >
                                    Dostawy
                                </NavLink>
                            </li>
                            <li className={styles.navItem}>
                                <NavLink
                                    to="/panel/driverinfo"
                                    className={({ isActive }) =>
                                        isActive ? styles.activeLink : styles.navLink
                                    }
                                >
                                    Informacje
                                </NavLink>
                            </li>
                        </>
                    )}

                    {isLoggedIn ? (
                        <li className={styles.logoutItem}>
                            <button onClick={onLogout} className={styles.logoutButton}>
                                <FontAwesomeIcon icon={faSignOutAlt} className={styles.logoutIcon} />
                                Wyloguj
                            </button>
                        </li>
                    ) : (
                        <li className={styles.loginItem}>
                            <button onClick={() => navigate("/login")} className={styles.loginButton}>
                                <FontAwesomeIcon icon={faSignInAlt} className={styles.loginIcon} />
                                Zaloguj
                            </button>
                        </li>
                    )}
                </ul>
            </nav>
        </header>
    );
};

export default Header;
