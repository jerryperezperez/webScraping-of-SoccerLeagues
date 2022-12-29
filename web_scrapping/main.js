const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const XLSX = require('xlsx');

// Control de flujo iterativo para obtener de la temporada 2012_2013 hasta 2021_2022
// temporadas = ['2012_2013', '2013_2014', '2014_2015', '2015_2016', '2016_2017', '2017_2018', '2018_2019', '2019_2020', '2020_2021', '2021_2022'];
temporada = '2022-2023';

console.log("Extrayendo información de temporada" + temporada);
(async () => {
    // let cadena = 'https://www.sport.es/es/resultados/la-liga/jornada-'
    // let cadena = 'https://www.sport.es/es/resultados/premier-league/jornada-'
    // let cadena = 'https://www.sport.es/es/resultados/2012-2013/la-liga/calendario/'
    // let cadena = 'https://www.sport.es/es/resultados/2021-2022/premier-league/jornada-'
    // let cadena = 'https://www.sport.es/es/resultados/' + temporada + '/premier-league/jornada-'
    let cadena = 'https://www.sport.es/es/resultados/premier-league/jornada-'
    let cantidadJornadas = 17
    let equipos = []
    let points = []
    let lista = []
    for (let i = 0; i < cantidadJornadas; i++) {
        lista.push(0)
    }
    console.log()
    console.log("EXTRAYENDO EQUIPOS DE TEMPORADA")
    for (let i = 0; i < cantidadJornadas; i++) {
        cadena1 = cadena + (i + 1) + '/'
        // console.log(cadena1)
        console.log("JORNADA # " + i)
        try {
            // Abrimos una instancia del puppeteer y accedemos a la url de google
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            const response = await page.goto(cadena1);
            const body = await response.text();

            // Creamos una instancia del resultado devuelto por puppeter para parsearlo con jsdom
            const {window: {document}} = new jsdom.JSDOM(body);

            // document.querySelectorAll(".equipo .name")
            document.querySelectorAll(".equipo .name")
                .forEach(element => equipos.push(element.textContent));

            // Cerramos el puppeteer
            await browser.close();
        } catch (error) {
            console.error(error);
        }
    }
    console.log(new Set(equipos))
    dictionario = {}
    for (const x of new Set(equipos).values()) {
        dictionario[x] = Object.assign([], lista)
    }

    console.log("EXTRAYENDO PUNTOS DE EQUIPOS DE TEMPORADA")
    //  TIENE QUE SER UNA JORNADA MÁS  DEBIDO AL POSICIONAMIENTO DE LA LISTA DE PUNTOS DE DICTIONARIO
    for (let jornada = 1; jornada < cantidadJornadas + 1; jornada++) {
        console.log("JORNADA # " + jornada)
        subEquipos = []
        puntos = []
        try {
            cadena1 = cadena + jornada + '/'
            // Abrimos una instancia del puppeteer y accedemos a la url de google
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            const response = await page.goto(cadena1);
            const body = await response.text();
            // const body = (await (await (await puppeteer.launch()).newPage()).goto(cadena1)).response.text()
            // Creamos una instancia del resultado devuelto por puppeter para parsearlo con jsdom
            const {window: {document}} = new jsdom.JSDOM(body);

            document.querySelectorAll(".equipo .name")
                .forEach(element => subEquipos.push(element.textContent));

            document.querySelectorAll(".equipo .points")
                // Removing the 'pts' and 'ptos'
                .forEach(element => puntos.push(parseInt(element.textContent.replace(/[^0-9]+/g, ""))))
            // .forEach(element => puntos.push(element.textContent))
            // element.textContent.replace(/[ptos]/ig, ''))
            //AGREGAR PUNTOS DE EQUIPO EN DICTIONARIO

            for (let j = 0; j < subEquipos.length; j++) {
                dictionario[subEquipos[j]][jornada - 1] = puntos[j]
            }

            // Cerramos el puppeteer
            await browser.close();
        } catch (error) {
            console.error(error);
        }
    }

    //TRATAR DE CONVERTIR EL DICCIONARIO EN JSON
    json = []
    for (const name in dictionario) {
        lista = dictionario[name]
        for (let i = 1; i < lista.length; i++) {
            if (lista[i] == 0) {
                dictionario[name][i] = lista[i - 1]
            }
        }
        sub = {}
        sub['name'] = name
        puntos = dictionario[name]
        for (let i = 0; i < cantidadJornadas; i++) {
            sub['jornada' + (i + 1)] = puntos[i]
        }
        json.push(sub)
    }

    const convertJsonToExcel = () => {

        const workSheet = XLSX.utils.json_to_sheet(json);
        const workBook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workBook, workSheet, temporada)
        // Generate buffer
        XLSX.write(workBook, {bookType: 'xlsx', type: "buffer"})

        // Binary string
        XLSX.write(workBook, {bookType: "xlsx", type: "binary"})

        let fileName = "PREMIERLEAGUE_" + temporada + "_J17.xlsx"
        XLSX.writeFile(workBook, fileName)

    }
    convertJsonToExcel()

})();


