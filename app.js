const express = require("express");
const { auth, requiresAuth } = require('express-openid-connect');
const app = express();
const axios = require("axios");
var db = require('./database.js')
require('dotenv').config();

// Inicjalizacja biblioteki express-openid-connect
app.use(
    auth({
        authRequired: false,// Czy przy kazdej akcji jest wymagane ponowne logowanie
        auth0Logout: true,// Czy istnieje mozliwosc wylogowania sie pod /logout
        issuerBaseURL: process.env.ISSUER_BASE_URL,
        baseURL: process.env.BASE_URL,
        clientID: process.env.CLIENT_ID,
        secret: process.env.SECRET,
    })
);

const port = process.env.PORT || 3000;

app.get('/', (req, res) =>{
    res.send(req.oidc.isAuthenticated() ? 'You are logged in! Log out under /logout' : 'Log in with /login');
});

app.get('/register', (req, res) =>{
    return res.redirect('/login') 
})


const https = require("https");
const key = "64ba2a3e1b4bc712388114e3c40baa17";
const location = "Poland";
const api = "https://api.openweathermap.org/data/2.5/weather?q=" + location + "&appid=" + key;

weather_every_hour = function() {
    https.get(api, function(response){
        response.on("data", function(data){
            const weather = JSON.parse(data);
            const temperature = (weather.main.temp-273.15).toFixed(0);// Zamieniam temperature ze stopni kelwina na celsjusza
            var insert = 'INSERT INTO weatherhour (name, temp) VALUES (?,?)'
            db.run(insert, [weather.name, temperature])// Do bazy wysylam tylko kraj i temperature w celsjuszach
            console.log("Autosaving the weather to the database.")
        });
    });
};

setInterval(weather_every_hour, 3600000);// Interwal pobierania pogody co godzine

app.get("/weather/get", requiresAuth(), (req, res, next)=>{
    var sql = 'SELECT * FROM weatherhour ORDER BY id DESC LIMIT 1'// Wybieram z bazy ostatnia wartosc
    var params = []
    db.all(sql, params, (err, rows) =>{
        if (err){
            res.status(400).json({"error":err.message});
            return;
        }
         res.json({
            "message":"success",
            "data":rows
        })
    });
});


let swapi = "https://swapi.dev/api/people/";
let people = [];

app.get("/starwars/getall", async(req, res) =>{
    while (swapi){
        let nextres = await axios(swapi)
        const { next, results } = await nextres.data;
        swapi = next
        people = [...people, ...results]
    }// Wszystko z api wrzucam do pustej tablicy
    console.log('Amount for /starwars/getall: ' + people.length)
    res.json(people);
});

app.get('/starwars/getfiltered', requiresAuth(), async(req, res, next) =>{
    while (swapi){
        let nextres = await axios(swapi)
        const { next, results } = await nextres.data;
        swapi = next
        people = [...people, ...results]
    } 

    const filters = req.query;// Moje flitry wejsciowe
    const filteredPeople = people.filter(user => {
        let isValid = true;
        for (i in filters){
            isValid = isValid && user[i] == filters[i];
        }
        return isValid;
    });
    console.log('Amount for /starwars/getfiltered: ' + filteredPeople.length);
    res.json(filteredPeople);
});


app.listen(port, function(){
    console.log("Server is running on port: " + port);
});

app.use(function(req, res){
    res.status(404);
})