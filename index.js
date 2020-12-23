const fs = require('fs');
const parse = require('csv-parse');
const { Console, group } = require('console');
const { sign } = require('crypto');
const { type } = require('os');

//--------------------arrays definidas como variables globales, las utilizo para el calculo de los resultados finales-----------------//
let resultArr=[];
let resultGrouped=[];

//--------- Parseo los datos de ventas.csv para obtener categoria, coste y cantidades de cada venta y paraslos de argumento a la funcion calculatePrice------------//

let parser = parse({columns: true, delimiter: ';'}, function (err,ventas) {
   ventas.map((venta)=>{
       return resultArr.push({categoria: venta.CATEGORY,precio : (calculatePrice(venta.CATEGORY, venta.COST, venta.QUANTITY)) })
   })
   // ---------agrupo los resultados con una misma categoria y sumo los valores de los precios -------------//
   resultArr.forEach(function(producto){
       if (!this[producto.categoria]){
           this[producto.categoria] = { categoria: producto.categoria, precio: 0};
           resultGrouped.push(this[producto.categoria]);
       }
       this[producto.categoria].precio += producto.precio;
   },{});
   //-------------para cada objeto ya agrupado paso los valores de caregoria y precio a una funcion que simplemente los muestra en la consola--------------//
   resultGrouped.map((producto)=>{
    return printResult(producto.categoria, producto.precio)
})

});
fs.createReadStream(__dirname+'/dataset/Ventas.csv').pipe(parser)

//------------- Obtenemos los datos del archivo JSON con los precios a aplicar-------------//
//--------------------en caso de un archivo muy grande usar readFileSync en lugar de readFile nos asegura no saltarnos valores en los calculos-------------//
let datosraw = fs.readFileSync('./dataset/precios.json');
let precios = JSON.parse(datosraw);
let arrOfObjects=(Object.values(precios))
let categorieObject = arrOfObjects[0]

//---------esta función acepta los argumentos necesarios de los articulos de la lista de ventas para calcular los resultados---------//

function calculatePrice(category , cost, quantity){
    // console.log(categorieObject[category] || categorieObject['*'])
    let str = categorieObject[category] || categorieObject['*']
    let indPerc = str.indexOf('%');
    let indEur = str.indexOf('€');
    let calculate={ '+':function (a,b){return a+b }, '-': function(a,b){return a-b}};
    let totalAmnt = parseInt(quantity)*parseFloat(cost.replace(',','.'))

    //------------ evalúo todos los posibles formatos para aplicar correctamente los valores -------------------//
    //------------- se puede refactorizar usando ternary operators encadenados, pero seria mas complicado de leer y la performance seria similar------------//


    // si contiene un porcentaje y un valor absoluto. 
    if(str.includes('%') && str.includes('€')){
    
        //si el valor del porcentaje es el que esta antes.
        if(str.indexOf('%')<str.indexOf('€')){
            
            let firstSign = str.slice(0,1);
            let secondSign = str.slice(indPerc+1, indPerc+2)
            let absVal= str.slice(indPerc+2,indEur)
            let perVal= str.slice(1,indPerc)
            let res1 = calculate[firstSign](totalAmnt,totalAmnt*perVal/100)
            let res2 = calculate[secondSign](res1,parseFloat(absVal))
            return res2
        }

        //si el valor absoluto es el que esta antes.
        else{
            
            let firstSign = str.slice(0,1);
            let secondSign = str.slice(indEur+1, indEur+2)
            let absVal= str.slice(1,indEur) 
            let perVal= str.slice(indEur+2,indPerc)
            let res1 = calculate[firstSign](totalAmnt,parseFloat(absVal))
            let res2 = calculate[secondSign](res1,res1*perVal/100)
            return res2
        }
    }
    // en caso de solo contener un porcentaje o un valor absoluto.
    else{
        //si el valor es un porcentaje.
        if(str.includes('%')){
            
            let perVal = str.slice(1,indPerc)
            let sign = str.slice(0,1);
            let res = calculate[sign](totalAmnt,totalAmnt*perVal/100)
            return res

        }
        //si el valor es un valor absoluto.
        else{
            
            let absVal = str.slice(1,indEur);
            let sign = str.slice(0,1);
            let res = calculate[sign](totalAmnt,parseFloat(absVal))
            return res
        }
    }

}

//-------------- esta función simplemente muestra en pantalla los valores finales -----------//
function printResult(categoria, precio) {
    return console.log(categoria, ':', precio);
}




