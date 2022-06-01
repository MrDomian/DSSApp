var sqlite3 = require('sqlite3').verbose()
const source = "db.sqlite"

let db = new sqlite3.Database(source, (err) =>{
    if (err){
      // Nie mozna otworzyc bazy
      console.error(err.message)
      throw err
    } else{
        // Uruchomienie bazy
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE weatherhour (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text, 
            temp text
            )`,
        (err) =>{
            if (err){
                // Tabel juz stworzona
            } else{
                // Stworzenie tabeli i dodanie kilku przykladowych wierszy
                var insert = 'INSERT INTO weatherhour (name, temp) VALUES (?,?)'
                db.run(insert, ["Poland","123"])
                db.run(insert, ["Poland","1234"])
            }
        });  
    }
});

module.exports = db