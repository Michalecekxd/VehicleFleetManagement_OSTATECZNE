# Potencjalne pytania na obronę pracy inżynierskiej
## Aplikacja do zarządzania flotą pojazdów w firmie transportowej

---

## 📋 **ODPOWIEDZI NA WYBRANE PYTANIA**

### 5. Narzędzia do analizy danych w bazach danych

Narzędzia do analizy danych w bazach danych można podzielić na kilka kategorii w zależności od ich funkcjonalności i zastosowania:

#### **1. Narzędzia SQL (Structured Query Language)**

**SQL** to podstawowy język do analizy danych w relacyjnych bazach danych:

- **Zapytania SELECT**: Pobieranie i filtrowanie danych
- **Funkcje agregujące**: COUNT, SUM, AVG, MAX, MIN
- **Grupowanie**: GROUP BY, HAVING
- **Łączenia**: JOIN (INNER, LEFT, RIGHT, FULL)
- **Funkcje okienkowe**: ROW_NUMBER(), RANK(), PARTITION BY
- **Podzapytania**: Zagnieżdżone zapytania (subqueries)
- **CTE (Common Table Expressions)**: WITH dla złożonych zapytań

**Przykłady narzędzi**:
- **psql** (PostgreSQL) - wiersz poleceń
- **MySQL Workbench** - graficzny interfejs
- **SQL Server Management Studio (SSMS)** - dla SQL Server
- **DBeaver** - uniwersalne narzędzie dla wielu baz danych

#### **2. Narzędzia Business Intelligence (BI)**

**BI tools** służą do wizualizacji i analizy danych biznesowych:

- **Power BI** (Microsoft)
  - Łączenie z różnymi źródłami danych
  - Tworzenie dashboardów i raportów
  - Wizualizacje interaktywne
  - Modele danych i DAX (Data Analysis Expressions)

- **Tableau**
  - Zaawansowane wizualizacje
  - Analiza ad-hoc
  - Łączenie wielu źródeł danych
  - Drag-and-drop interface

- **QlikView / QlikSense**
  - Asocjacyjny model danych
  - Wyszukiwanie i eksploracja danych
  - Self-service analytics

- **Looker** (Google)
  - Modelowanie danych (LookML)
  - Embedded analytics
  - Integracja z Google Cloud

#### **3. Narzędzia ETL (Extract, Transform, Load)**

**ETL** służą do ekstrakcji, transformacji i ładowania danych:

- **Apache Airflow**
  - Orchestracja workflow
  - Automatyzacja zadań ETL
  - Monitoring i logowanie

- **Talend**
  - Graficzny interfejs do ETL
  - Integracja z wieloma źródłami
  - Data quality i profiling

- **Pentaho Data Integration**
  - Open-source ETL
  - Transformacje danych
  - Scheduling zadań

- **Microsoft SSIS** (SQL Server Integration Services)
  - ETL dla ekosystemu Microsoft
  - Integracja z SQL Server
  - Pakietowe przetwarzanie danych

#### **4. Narzędzia do analizy statystycznej**

- **R**
  - Język programowania do analizy statystycznej
  - Pakiet RODBC, RPostgreSQL do łączenia z bazami
  - Zaawansowane analizy statystyczne

- **Python z bibliotekami**
  - **pandas**: Manipulacja i analiza danych
  - **SQLAlchemy**: ORM do łączenia z bazami
  - **NumPy**: Obliczenia numeryczne
  - **Matplotlib/Seaborn**: Wizualizacje

- **SAS**
  - Enterprise analytics
  - Zaawansowane modele statystyczne
  - Integracja z bazami danych

#### **5. Narzędzia do eksploracji danych (Data Mining)**

- **Weka**
  - Machine learning
  - Eksploracja danych
  - Wizualizacja wyników

- **RapidMiner**
  - Graficzny interfejs do data mining
  - Machine learning workflows
  - Integracja z bazami danych

- **KNIME**
  - Open-source platforma analityczna
  - Workflow-based approach
  - Integracja z różnymi źródłami danych

#### **6. Narzędzia do analizy OLAP (Online Analytical Processing)**

- **Microsoft Analysis Services (SSAS)**
  - Modele wielowymiarowe (cubes)
  - MDX (Multidimensional Expressions)
  - Integracja z Excel i Power BI

- **Apache Kylin**
  - OLAP engine dla Big Data
  - Pre-agregacja danych
  - Szybkie zapytania analityczne

- **Mondrian**
  - Open-source OLAP server
  - MDX queries
  - Integracja z różnymi bazami danych

#### **7. Narzędzia do analizy Big Data**

- **Apache Spark**
  - Przetwarzanie danych w pamięci
  - Spark SQL do zapytań SQL
  - Analiza strumieniowa i batch

- **Hadoop Ecosystem**
  - **Hive**: SQL-like queries na Hadoop
  - **Pig**: Skryptowy język do przetwarzania
  - **Impala**: Szybkie zapytania SQL

- **Apache Drill**
  - SQL queries na różnych źródłach
  - Schema-free queries
  - Integracja z NoSQL

#### **8. Narzędzia do monitorowania i optymalizacji**

- **Database Performance Analyzers**
  - **pgAdmin** (PostgreSQL) - monitoring i analiza
  - **SQL Server Profiler** - śledzenie zapytań
  - **Oracle Enterprise Manager** - zarządzanie i monitoring

- **Query Analyzers**
  - Analiza planów wykonania (EXPLAIN)
  - Identyfikacja wąskich gardeł
  - Optymalizacja zapytań

#### **9. Narzędzia do raportowania**

- **Crystal Reports**
  - Tworzenie raportów z baz danych
  - Formatowanie i eksport
  - Scheduling raportów

- **JasperReports**
  - Open-source reporting
  - Integracja z aplikacjami Java
  - Różne formaty wyjściowe

- **SQL Server Reporting Services (SSRS)**
  - Raporty z SQL Server
  - Subskrypcje i dystrybucja
  - Integracja z SharePoint

#### **10. Narzędzia NoSQL do analizy**

- **MongoDB Compass**
  - Wizualizacja i analiza danych MongoDB
  - Aggregation Pipeline
  - Query builder

- **Elasticsearch + Kibana**
  - Wyszukiwanie i analiza danych
  - Wizualizacje w czasie rzeczywistym
  - Dashboardy i raporty

- **Cassandra Query Language (CQL)**
  - Zapytania do Cassandra
  - Analiza danych rozproszonych

#### **11. Narzędzia do analizy w chmurze**

- **Google BigQuery**
  - Data warehouse w chmurze
  - SQL queries na petabajtach danych
  - Integracja z Google Analytics

- **Amazon Redshift**
  - Data warehouse AWS
  - SQL queries
  - Integracja z innymi serwisami AWS

- **Azure Synapse Analytics**
  - Analytics platform Microsoft
  - Integracja z Power BI
  - Big Data i data warehousing

#### **12. Narzędzia do analizy jakości danych**

- **Informatica Data Quality**
  - Profilowanie danych
  - Czyszczenie i standaryzacja
  - Monitoring jakości

- **Talend Data Quality**
  - Profilowanie danych
  - Wykrywanie duplikatów
  - Walidacja danych

- **Ataccama ONE**
  - Data quality i governance
  - Profilowanie i monitoring
  - Automatyzacja czyszczenia danych

#### **Podsumowanie**

Narzędzia do analizy danych w bazach danych można podzielić na:
- **Podstawowe**: SQL i narzędzia do zapytań
- **BI i wizualizacja**: Power BI, Tableau, Qlik
- **ETL**: Airflow, Talend, SSIS
- **Statystyczne**: R, Python (pandas)
- **Big Data**: Spark, Hadoop, BigQuery
- **OLAP**: SSAS, Apache Kylin
- **NoSQL**: MongoDB Compass, Elasticsearch
- **Raportowanie**: Crystal Reports, SSRS
- **Jakość danych**: Informatica, Talend DQ

Wybór narzędzia zależy od:
- Rodzaju bazy danych (relacyjna, NoSQL, Big Data)
- Wielkości danych
- Wymagań analitycznych (proste raporty vs. zaawansowana analityka)
- Budżetu (open-source vs. komercyjne)
- Integracji z istniejącym ekosystemem

---

**Powodzenia na obronie! 🎓**




