const fs = require('fs'); 

//--------- Parseo los datos de ventas.csv para obtener categoria, coste y cantidades de cada venta------------//

let parse = require('csv-parse');
const { Console, group } = require('console');
const { sign } = require('crypto');
const { type } = require('os');
let resultArr=[];
let resultGrouped=[]

let parser = parse({columns: true, delimiter: ';'}, function (err,ventas) {
   ventas.map((venta)=>{
       return resultArr.push({categoria: venta.CATEGORY,precio : (calculatePrice(venta.CATEGORY, venta.COST, venta.QUANTITY)) })
   })
   resultArr.forEach(function(producto){
       if (!this[producto.categoria]){
           this[producto.categoria] = { categoria: producto.categoria, precio: 0};
           resultGrouped.push(this[producto.categoria]);
       }
       this[producto.categoria].precio += producto.precio;
   },{});

   resultGrouped.map((producto)=>{
    return printResult(producto.categoria, producto.precio)
})

});
fs.createReadStream(__dirname+'/dataset/Ventas.csv').pipe(parser)
//------------- Obtenemos los datos del archivo JSON con los precios a aplicar-------------//

let datosraw = fs.readFileSync('./dataset/precios.json');
let precios = JSON.parse(datosraw);
let arrOfObjects=(Object.values(precios))
let categorieObject = arrOfObjects[0]


//---------esta función acepta los argumentos necesarios de los articulos de la lista de ventas para calcular los resultados---------//

function calculatePrice(category , cost, quantity){
    // console.log(categorieObject[category] || categorieObject['*'])
    let str = categorieObject[category] || categorieObject['*']
    let val = str.slice(1)
    let regsigns = /\+|\-/;
    let regexp = /%|€/;
    let sign = str.slice(0,1);
    let teststr = str.split(regsigns);
    let indPerc = str.indexOf('%');
    let indEur = str.indexOf('€');
    let calculate={ '+':function (a,b){return a+b }, '-': function(a,b){return a-b}}

    //------------ evalúo todos los posibles formatos para aplicar correctamente los valores -------------------//
    //------------- se puede refactorizar usando ternary operators encadenados, pero seria mas complicado de leer y la performance seria similar------------//


    // si contiene un porcentaje y un valor absoluto. 
    if(str.includes('%') && str.includes('€')){
        // console.log('---has both---')
        //si el valor del porcentaje es el que esta antes.
        if(str.indexOf('%')<str.indexOf('€')){
            
            let firstSign = str.slice(0,1);
            let secondSign = str.slice(indPerc+1, indPerc+2)
            let absVal= str.slice(indPerc+2,indEur)
            let perVal= str.slice(1,indPerc)
            let totalAmnt = parseInt(quantity)*parseFloat(cost.replace(',','.'))
            // console.log(category,cost,quantity,str)
            // console.log('first sign',firstSign)
            // console.log('first value',perVal)
            // console.log('second sign',secondSign)
            // console.log('second value',absVal)
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
            let totalAmnt = parseInt(quantity)*parseFloat(cost.replace(',','.'))
            // console.log(category,cost,quantity,str)
            // console.log('first sign',firstSign)
            // console.log('absolute value',absVal)
            // console.log('second sign',secondSign)
            // console.log('percentual value',perVal)
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
            let totalAmnt = parseInt(quantity)*parseFloat(cost.replace(',','.'))
            // console.log(category,cost,quantity,str)
            // console.log('sign', sign)
            // console.log('percentual value', perVal)
            let res = calculate[sign](totalAmnt,totalAmnt*perVal/100)
            return res

        }
        //si el valor es un valor absoluto.
        else{
            
            let absVal = str.slice(1,indEur);
            let sign = str.slice(0,1);
            let totalAmnt = parseInt(quantity)*parseFloat(cost.replace(',','.'))
            // console.log(category,cost,quantity,str)
            // console.log('sign', sign)
            // console.log('absolute value', absVal)
            let res = calculate[sign](totalAmnt,parseFloat(absVal))
            return res
        }
    }

}

let printResult = (categoria,precio)=>{
    return console.log(categoria, ':' , precio)
}




