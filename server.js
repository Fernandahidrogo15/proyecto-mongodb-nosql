const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const url = 'mongodb://miAdmin:tuContraseñaSegura123@localhost:27017/admin';
const client = new MongoClient(url);

async function conectarDB() {
    await client.connect();
    console.log("Conectado exitosamente a MongoDB");
}
conectarDB();

app.get('/api/productos', async (req, res) => {
    try {
        const db = client.db('tienda');
        const productos = await db.collection('productos').find({}).toArray();

        let filas = '';
        let modales = '';

        productos.forEach(p => {
            const idStr = p._id.toString();
            filas += `
            <tr>
                <td>${p.codigo || 'N/A'}</td>
                <td><a href="#" onclick="abrirModal('${idStr}')" style="color: #3498db; text-decoration: none; font-weight: bold;">${p.nombre || 'Sin nombre'}</a></td>
                <td>${p.maestro || 'N/A'}</td>
                <td>
                    <button onclick="abrirEditar('${idStr}', '${p.codigo || ''}', '${p.nombre || ''}', '${p.maestro || ''}')" style="background-color: #f39c12; padding: 5px 10px; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 5px;">Editar</button>
                    <button onclick="eliminarCurso('${idStr}')" style="background-color: #e74c3c; padding: 5px 10px; color: white; border: none; border-radius: 4px; cursor: pointer;">Eliminar</button>
                </td>
            </tr>`;

            modales += `
            <div id="modal-${idStr}" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); justify-content:center; align-items:center;">
                <div style="background:white; padding:25px; border-radius:8px; width:320px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    <h3 style="color:#2c3e50; margin-top:0;">Detalles del Curso</h3>
                    <p><strong>ID de MongoDB:</strong> ${p._id}</p>
                    <p><strong>Código:</strong> ${p.codigo || 'N/A'}</p>
                    <p><strong>Nombre:</strong> ${p.nombre || 'N/A'}</p>
                    <p><strong>Maestro:</strong> ${p.maestro || 'N/A'}</p>
                    <button onclick="cerrarModal('${idStr}')" style="background-color: #95a5a6; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; width: 100%;">Cerrar</button>
                </div>
            </div>`;
        });

        const html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Gestión de Cursos</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 30px; background-color: #f4f4f9; color: #333; }
                h2 { color: #2c3e50; }
                form { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 350px; margin-bottom: 20px; }
                label { display: block; margin-bottom: 6px; font-weight: bold; }
                input[type="text"] { width: 100%; padding: 8px; margin-bottom: 12px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
                button.btn-guardar { background-color: #3498db; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%; }
                button.btn-guardar:hover { background-color: #2980b9; }
                table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background-color: #2c3e50; color: white; }
            </style>
        </head>
        <body>
            <h2>Registro de Cursos</h2>
            <form id="cursoForm" action="/api/productos" method="POST">
                <input type="hidden" id="cursoId" name="id">
                <label for="codigo">Código del Curso:</label>
                <input type="text" id="codigo" name="codigo" required placeholder="Ej. ISC-101">

                <label for="nombre">Nombre del Curso:</label>
                <input type="text" id="nombre" name="nombre" required placeholder="Ej. Base de Datos II">

                <label for="maestro">Maestro:</label>
                <input type="text" id="maestro" name="maestro" required placeholder="Ej. Ing. Juan Pérez">

                <button type="submit" id="btnAccion" class="btn-guardar">Insertar Curso</button>
            </form>

            <h2>Lista de Cursos Registrados</h2>
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre del Curso (Ver Detalles)</th>
                        <th>Maestro</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${filas}
                </tbody>
            </table>

            ${modales}

            <script>
                function abrirModal(id) {
                    document.getElementById('modal-' + id).style.display = 'flex';
                }
                function cerrarModal(id) {
                    document.getElementById('modal-' + id).style.display = 'none';
                }
                function abrirEditar(id, codigo, nombre, maestro) {
                    document.getElementById('cursoId').value = id;
                    document.getElementById('codigo').value = codigo;
                    document.getElementById('nombre').value = nombre;
                    document.getElementById('maestro').value = maestro;
                    document.getElementById('btnAccion').innerText = 'Actualizar Curso';
                    document.getElementById('cursoForm').action = '/api/productos/editar';
                    window.scrollTo({top: 0, behavior: 'smooth'});
                }
                async function eliminarCurso(id) {
                    if (confirm('¿Estás seguro de eliminar este curso?')) {
                        const respuesta = await fetch('/api/productos/' + id, { method: 'DELETE' });
                        if (respuesta.ok) {
                            window.location.reload();
                        } else {
                            alert('Error al eliminar el curso');
                        }
                    }
                }
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send("Error al cargar los datos");
    }
});

app.post('/api/productos', async (req, res) => {
    try {
        const { codigo, nombre, maestro } = req.body;
        if (codigo && nombre && maestro) {
            const db = client.db('tienda');
            await db.collection('productos').insertOne({ codigo, nombre, maestro });
        }
        res.redirect('/api/productos');
    } catch (error) {
        res.status(500).send("Error al insertar el curso");
    }
});

app.post('/api/productos/editar', async (req, res) => {
    try {
        const { id, codigo, nombre, maestro } = req.body;
        if (id && codigo && nombre && maestro) {
            const db = client.db('tienda');
            await db.collection('productos').updateOne(
                { _id: new ObjectId(id) },
                { $set: { codigo, nombre, maestro } }
            );
        }
        res.redirect('/api/productos');
    } catch (error) {
        res.status(500).send("Error al actualizar el curso");
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const db = client.db('tienda');
        await db.collection('productos').deleteOne({ _id: new ObjectId(id) });
        res.json({ mensaje: 'Eliminado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${port}`);
});
