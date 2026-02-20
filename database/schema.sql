-- Esquema sugerido para implementación en backend (Razor + SQL Server/MySQL)

CREATE TABLE DatosTrabajador (
  RPE VARCHAR(20) PRIMARY KEY,
  Nombre VARCHAR(120) NOT NULL,
  ImagenTrabajador TEXT NULL,
  Departamento VARCHAR(100) NOT NULL,
  Puesto VARCHAR(100) NOT NULL,
  FechaAlta DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ControlEpp (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  Departamento VARCHAR(100) NOT NULL,
  Puesto VARCHAR(100) NOT NULL,
  EppNombre VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_control_epp (Departamento, Puesto, EppNombre)
);

CREATE TABLE Documentos (
  Id INT PRIMARY KEY AUTO_INCREMENT,
  RPE VARCHAR(20) NOT NULL,
  ControlEppId INT NOT NULL,
  ArchivoNombre VARCHAR(260) NOT NULL,
  ArchivoRuta TEXT NOT NULL,
  FechaCarga DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (RPE) REFERENCES DatosTrabajador(RPE),
  FOREIGN KEY (ControlEppId) REFERENCES ControlEpp(Id)
);
