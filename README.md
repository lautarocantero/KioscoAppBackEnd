# 🧠 KioscoApp Backend

Este repositorio contiene el backend de **KioscoApp**, una aplicación diseñada para la gestión de kioscos. Está desarrollado con **Node.js**, **Express** y **TypeScript**, y proporciona una API RESTful para autenticación, gestión de vendedores, productos, proveedores y ventas.

## 🧱 Arquitectura

El proyecto sigue el patrón **MVC (Modelo-Vista-Controlador)** para mantener una estructura clara, escalable y mantenible:

- **Modelos**: Encapsulan la lógica de acceso a datos y validación (por ejemplo, `AuthModel`).
- **Controladores**: Manejan la lógica de negocio y las respuestas HTTP (`auth.controller.ts`).
- **Rutas**: Definen los endpoints y delegan a los controladores (`auth.routes.ts`).

## 🚀 Tecnologías utilizadas

- [Node.js](https://nodejs.org/)
- [Express](https://expressjs.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) para el hash de contraseñas
- [db-local](https://www.npmjs.com/package/db-local) como base de datos local para desarrollo
- [JWT](https://www.jwt.io/) para autenticacion segura.

## 📦 Scripts disponibles

| Comando       | Descripción                                               |
|---------------|-----------------------------------------------------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con `ts-node-dev`   |
| `npm run tsc` | Compila el proyecto TypeScript a JavaScript               |
| `npm start`   | Ejecuta el servidor desde la carpeta `build`              |

## 📁 Estructura del proyecto

src/  
├── controllers/     # Lógica de negocio (controladores)  
├── models/          # Modelos y acceso a datos  
├── routes/          # Definición de rutas Express
├── schemas/         # Definición de esquemas para db local
├── typings/         # Tipos y contratos TypeScript
├── utils/           # Funciones utiles compartidas
├── config/          # Configuración general (ej: constantes)
├── index.ts         # Punto de entrada principal

## 🔐 Autenticación

El sistema de autenticación incluye:

- Registro de usuarios con validación de datos
- Hash de contraseñas con `bcrypt`
- Inicio de sesión y generación de tokens JWT

## 📌 Próximos pasos

- Validaciones adicionales con middlewares
- Documentación de la API con Swagger o similar

## 🛠 Requisitos

- Node.js v18+
- npm o yarn
