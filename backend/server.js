const express = require('express');
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const app = express();
const PORT = 3000;
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(session({
    secret: 'technova-secret-key',
    resave: false,
    saveUninitialized: false
}));
const db = new sqlite3.Database('./contacts.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to SQLite database.');

        db.run(`
            CREATE TABLE IF NOT EXISTS contacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                email TEXT,
                message TEXT
            )
        `);
    }
});
// Home route
app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    db.run(
        'INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)',
        [name, email, message],
        function(err) {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Database error'
                });
            }

            res.json({
                success: true,
                message: 'Message saved successfully!'
            });
        }
    );
});
app.get('/login', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Login</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: #f4f4f4;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }

            .login-box {
                background: white;
                padding: 30px;
                border-radius: 10px;
                width: 300px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }

            h2 {
                text-align: center;
                color: #2563eb;
            }

            input {
                width: 100%;
                padding: 10px;
                margin: 10px 0;
            }

            button {
                width: 100%;
                padding: 10px;
                background: #2563eb;
                color: white;
                border: none;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
        <div class="login-box">
            <h2>Admin Login</h2>
            <form method="POST" action="/login">
                <input type="text" name="username" placeholder="Username" required>
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        </div>
    </body>
    </html>
    `);
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
if (username === 'admin' && password === '123456') {
    req.session.loggedIn = true;
        return res.redirect('/admin');
    }

    res.send(`
        <h2>Invalid username or password</h2>
        <a href="/login">Try Again</a>
    `);
});
app.get('/admin', (req, res) => {
    if (!req.session.loggedIn) {
        return res.redirect('/login');
    }
    db.all('SELECT * FROM contacts ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error');
        }
        app.get('/logout', (req, res)=>{
            req.session.destroy((err)=>{
                if (err){
                    return res.send('logout failed');
                }
                res.redirect('/login');
            });
    });
    app.listen(3000, () => {
        console.log('server is running on http://localhost:3000');
    });
     let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>TechNova Admin Panel</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f4f4f4;
                    padding: 30px;
                }

                h1 {
                    color: #2563eb;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 12px;
                    text-align: left;
                }

                th {
                    background: #2563eb;
                    color: white;
                }

                tr:nth-child(even) {
                    background: #f9f9f9;
                }
            </style>
        </head>
        <body>

        <h1>TechNova Admin Panel</h1>

        <table>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
                <th>Action</th>          
                 </tr>
        `;
  rows.forEach(row => {
            html += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.name}</td>
                    <td>${row.email}</td>
                    <td>${row.message}</td>
                    <td>
    <a href="/delete/${row.id}"
       onclick="return confirm('Delete this message?')"
       style="color:red;text-decoration:none;font-weight:bold;">
       Delete
    </a>
</td>
                </tr>
            `;
        });

        html += `
        </table>

        </body>
        </html>
        `;

        res.send(html);
    });
});
app.get('/delete/:id', (req, res) => {
    const id = req.params.id;

    db.run('DELETE FROM contacts WHERE id = ?', [id], (err) => {
        if (err) {
            return res.send('Delete failed');
        }

        res.redirect('/admin');
    });
});
app.get('/', (req, res) => {
    res.send('TechNova backend is running successfully!');
});

// Server start
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});