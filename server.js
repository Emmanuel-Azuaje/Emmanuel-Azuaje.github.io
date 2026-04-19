const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Función auxiliar para leer el archivo
async function readdata() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // Si no existe, creamos una estructura vacía
        if (error.code === 'ENOENT') {
            const initialData = [];
            await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        throw error;
    }
}

// Ruta GET para obtener los registros
app.get('/api/registros', async (req, res) => {
    try {
        const registros = await readdata();
        res.json(registros);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer la base de datos local' });
    }
});

// Ruta POST para sobreescribir guardar todos los registros
app.post('/api/registros', async (req, res) => {
    try {
        const nuevosRegistros = req.body; // Array completo de registros
        await fs.writeFile(DATA_FILE, JSON.stringify(nuevosRegistros, null, 2));
        res.json({ success: true, message: 'Datos guardados correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al escribir en la base de datos local' });
    }
});

app.listen(PORT, () => {
    console.log(`\n===========================================`);
    console.log(`Servidor local encendido en http://localhost:${PORT}`);
    console.log(`Guardando datos en: ${DATA_FILE}`);
    console.log(`===========================================\n`);
});
