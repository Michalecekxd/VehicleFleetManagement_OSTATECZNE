import { Link } from 'react-router-dom';
import styles from './Home.module.css';

const Home = () => {
    return (
        <div className={styles.container}>
            <h1>Witaj w Vehicle Fleet Management</h1>
            <p>
                Efektywne zarządzanie flotą pojazdów w Twojej firmie transportowej.
                Monitoruj stan pojazdów, planuj trasy i zarządzaj harmonogramami dostaw w jednym miejscu.
            </p>
          <br/>
          <br/>
          <br/>
            <p>
                A może jesteś kierowcą i chcesz sprawdzić swoje trasy?
            </p>
            <div className={styles.buttonContainer}>
                <Link to="/login">
                    <button>Zaloguj się</button>
                </Link>
                <Link to="/register">
                    {/*<button>Zarejestruj się</button>*/}
                </Link>
            </div>
        </div>
    );
};

export default Home;
