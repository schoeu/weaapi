/**
 * @file index.js
 * @description main file for frogapi.
*/

const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const json = require('koa-json')
const request = require('request');
const config = require('./config/conf');
let router = new Router();

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(json());

let city = encodeURIComponent('上海天气');
let options = {
    url: config.weathurl.replace('${city}', city),
    headers: {
      'User-Agent': config.ua
    }
};

let defaultBody = {
    status: 1,
    data: {}
};

router.get('/api/weather', ctx => {
    let data = callApi();
    ctx.body = data;
});

function callApi() {
    let weatherRs = defaultBody;
    return new Promise(function(resolve, reject) {
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                let info = JSON.parse(body) || {};
                if (info.status === '0') {
                    let data = info.data || [];
                    let weathData = data[0];
                    let forecase = getForecast(weathData);
                    let realTime = getCurrentData(weathData);
                    let rs = Object.assign({
                        status: 0
                    }, defaultBody, {
                        data: {
                            forecase: forecase,
                            real: realTime
                        }
                    });
                    resolve(rs);
                }
                else {
                    reject(defaultBody);
                }
            }
            else {
                reject(defaultBody);
            }
        });
    });
}


function getForecast(weathData = {}) {
    let data = weathData.forecast6d || {};
    let d = data.info || [];
    let rs = [];
    for (let i = 0; i < d.length; i++) {
        let o = {};
        let item = d[i] || {};
        o.date = item.date;
        o.sunriseTime = item.sunriseTime;
        o.sunsetTime = item.sunsetTime;
        o.high = item.temperature_day;
        o.low = item.temperature_night;
        o.weatherDay = item.weather_day;
        o.weatherNight = item.weather_night;
        o.windDirectionDay = item.wind_direction_day;
        o.windDirectionNight = item.wind_direction_night;
        o.windPowerDay = item.wind_power_day;
        o.windPowerNight = item.wind_power_night;
        rs.push(o);
    }
    return rs;
}

function getCurrentData(weathData = {}) {
    let data = weathData.observe || {};
    return {
        humidity: data.humidity,
        temperature: data.temperature,
        weather: data.weather,
        windDirection: data.wind_direction,
        windPorwer: data.wind_power_num,
        pm25: weathData.ps_pm25
    };
}

let port = config.port || 3000;
app.listen(port, () => {
    console.log(`Server is listned on ${port}`);
})