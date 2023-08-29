const request = require('request');
const { addDays, subYears, format } = require('date-fns');
const mongoose = require('mongoose');

const dbUser = 'impactaUser';
const dbPassword = 'impactaUser';

// Definição dos esquemas
const ThirtyDayDataSchema = new mongoose.Schema({
    timestamp: Number,
    price: Number,
    volume1: Number,
    volume2: Number
});

const FiveYearDataSchema = new mongoose.Schema({
    time_period_start: String,
    price_close: Number,
    price_high: Number,
    price_low: Number,
    price_open: Number,
    time_close: String,
    time_open: String,
    time_period_end: String,
    trades_count: Number,
    volume_traded: Number
});

// Criação dos modelos
const ThirtyDayData = mongoose.model('ThirtyDayData', ThirtyDayDataSchema);
const FiveYearData = mongoose.model('FiveYearData', FiveYearDataSchema);

// Conectar ao banco de dados MongoDB
const connect = () => {
    mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.r7sjmfs.mongodb.net/?retryWrites=true&w=majority`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const connection = mongoose.connection;

    connection.on("error", (err) => {
        console.error("Erro ao conectar com o MongoDB:", err);
    });

    connection.on("open", () => {
        console.log('Conexão com o MongoDB estabelecida');
    });
}

connect();

// Lógica das requisições e inserções
const hoje = new Date();
const data30DiasAtras = addDays(hoje, -30);
const dataFormatada = format(data30DiasAtras, 'yyyy-MM-dd');

const dateNow = format(new Date(), 'yyyy-MM-dd');
const dateFiveYearsAgo = format(subYears(new Date(), 5), 'yyyy-MM-dd');

const options30day = {
    url: `https://rest.coinapi.io/v1/ohlcv/KRAKENFTS_PERP_BTC_USD/history?period_id=1DAY&time_start=${dataFormatada}`,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'X-CoinAPI-Key': '7ED5486B-317E-4FCD-A146-2DA61C7A9AE3'
    }
}

const options5yearsago = {
    url: `https://coincodex.com/api/coincodex/get_coin_history/BTC/${dateFiveYearsAgo}/${dateNow}/1`,
    method: 'GET',
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8'
    }
}

const callback30 = function(erro, res, body) {
    let json = JSON.parse(body);
    const obj30 = json;

    ThirtyDayData.insertMany(obj30)
        .then(docs => {
            console.log('Dados dos últimos 30 dias inseridos com sucesso:', docs.length, 'registros');
        })
        .catch(err => {
            console.error('Erro ao inserir dados dos últimos 30 dias:', err);
        });
}

const callback5 = function(erro, res, body) {
    let json = JSON.parse(body);
    const obj5 = json.data;

    FiveYearData.insertMany(obj5)
        .then(docs => {
            console.log('Dados dos últimos 5 anos inseridos com sucesso:', docs.length, 'registros');
        })
        .catch(err => {
            console.error('Erro ao inserir dados dos últimos 5 anos:', err);
        });
}

request(options30day, callback30);
request(options5yearsago, callback5);
