// src/pages/NotFound/NotFound.tsx
import React from "react";
import styles from "./NotFound.module.css";

const NotFound: React.FC = () => {
    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <h1>404 - Strona nie znaleziona</h1>
                <p>Wygląda na to, że ta strona nie istnieje. Sprawdź adres URL lub wróć na stronę główną.</p>
            </div>
        </div>
    );
};

export default NotFound;
