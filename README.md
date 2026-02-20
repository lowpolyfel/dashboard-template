# Control EPP (plantilla web)

Este proyecto ahora incluye una interfaz web inspirada en la imagen de referencia para gestionar:

- Búsqueda de trabajadores por **RPE, departamento y puesto**.
- Checklist de **EPP por departamento/puesto**.
- Carga, visualización, descarga y eliminación de **documentos PDF** por trabajador y EPP.
- Carga de imagen de empresa y foto de trabajador.

## Persistencia de datos

La demo usa **IndexedDB** (base de datos del navegador) con los almacenes:

- `trabajadores`
- `controlEpp`
- `documentos`
- `empresa`

Además, se incluye un esquema SQL sugerido para backend en `database/schema.sql`.

## Ejecutar local

Puedes abrir `index.html` directamente en el navegador.
