var mg = ee.FeatureCollection("users/rodrigozonzin/limites_municipais/MG_Municipios_2021"),
    landsat5_toa = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2"),
    geometry = 
    /* color: #ffc82d */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[-43.950581359575175, -21.10983947190929],
          [-44.11400299043455, -21.264775298324963],
          [-43.9904067990283, -21.423383512331416],
          [-43.71849517793455, -21.456618283325746],
          [-43.4246109005908, -21.31339926731196],
          [-43.417744445512675, -21.189248365251807],
          [-43.769306945512675, -21.135459895091955]]]),
    landsat5C2T2TOA = ee.ImageCollection("LANDSAT/LT05/C02/T2_TOA");

//var landsat5 = ee.ImageCollection("LANDSAT/LT05/C02/T1_L2");
var bq  = mg.filter('NM_MUN == "Pouso Alegre"');

//adicionando contornos da cidade de Barbacena
Map.addLayer(bq); 



//Fatores de escala do dataset 
function applyScaleFactors(image) {
  var opticalBands = image.select('B.').multiply(0.0000275).add(-0.2);
  var thermalBand = image.select('B6').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBand, null, true);
} 


//parametros de visualizacao 
var vis_param = {
  bands: ['B3', 'B2', 'B1'],
  min: 0.0,
  max:0.4,
  gamma: 1.2
};


//filtrando a coleção do landsat5
var colec = landsat5C2T2TOA
            .filterDate('1993-01-01', '2013-12-31')
            .filterBounds(bq)
            .filter(ee.Filter.lte('CLOUD_COVER', 0.1))
            .sort('DATE_ACQUIRED')
            .map(applyScaleFactors);

            
function addImage(image){ // display each image in collection
  var id = image.id;
  image = ee.Image(image.id).clip(bq);
  Map.addLayer(image, vis_param);
}

colec.evaluate(function(s2){  // use map on client-side
  s2.features.map(addImage);
});

print(colec);

