var mg = ee.FeatureCollection("users/rodrigozonzin/setores/MG_Setores_2020")

var pouso_alegre = mg.filter('NM_MUN == "Pouso Alegre"');

function applyScaleFactors(image) {
  var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
  var thermalBand = image.select('ST_B6').multiply(0.00341802).add(149.0);
  return image.addBands(opticalBands, null, true)
              .addBands(thermalBand, null, true);
} 

Map.addLayer(pouso_alegre);

var img_id = 'LANDSAT/LT05/C02/T1_L2/LT05_219075_20040503'; 
var img = applyScaleFactors(ee.Image(img_id));



var vis_param = {
  bands: ['SR_B3', 'SR_B2', 'SR_B1'],
  min: 0.0,
  max: 0.4
};


//adicionando bandas do ndvi e ndwi 
// Compute and add a single band (NDVI).
var ndvi = img.normalizedDifference(['SR_B4', 'SR_B3']).rename('NDVI');
img = img.addBands(ndvi);
var ndwi = img.normalizedDifference(['SR_B4', 'SR_B5']).rename('NDWI');
img = img.addBands(ndwi);


Map.addLayer(img, vis_param);


var sample = ee.FeatureCollection(water).merge(urban).merge(forest).merge(pasture).merge(soil); 
print(sample);
var bandas = ['SR_B1', 'SR_B2', 'SR_B3','SR_B4', 'SR_B5', 'NDVI', 'NDWI']; 
//,'ST_B6',

var treinamento = img.select(bandas).sampleRegions({
  collection: sample,
  properties: ['class'],
  scale: 30
}); 

var classificador = ee.Classifier.smileRandomForest(50).train({
  features: treinamento,
  classProperty: 'class',
  inputProperties: bandas
}); 

var classificacao = img.select(bandas).classify(classificador); 
//print(classificacao);

//Map.addLayer(img, {min: 0.0, max: 0.4, bands: ['B4', 'B3', 'B2']}, "Pouso Alegre de Treinamento");
//Map.addLayer(img_teste, {min: 0.0, max: 0.4, bands: ['B4', 'B3', 'B2']}, "Pouso Alegre de Teste");
Map.addLayer(classificacao.clip(pouso_alegre), {min:0, max:4, palette: ['green', 'red', 'yellow', 'blue', 'pink']}, "classificacao");

var class_areas = ee.Image.pixelArea().
          addBands(classificacao)
          .reduceRegion({
              reducer: ee.Reducer.sum().group({
                groupField: 1,
                groupName: 'code'}),
                
              geometry: pouso_alegre,
              scale: 30,  // sample the geometry at 1m intervals
              maxPixels: 1e10
          }).get('groups')
  
  print(class_areas)



//Exportando imagem
Export.image.toDrive({
  image: classificacao, 
  description: "LULC_pousoAlegre", 
  folder: 'selper_pousoAlegre', 
  region: pouso_alegre, 
  scale: 30});


//Exportando as areas
Export.table.toDrive({
  collection: class_areas, 
  description: "area_2004_28Junho", 
  folder: 'selper_pousoAlegre', 
  fileFormat: 'CSV' 
}); 


//Exportando os pontos para apresentaçao 
Export.table.toDrive({
  collection: sample, 
  description: "sample_pousoAlegre20040503_28Junho", 
  folder: 'selper_pousoAlegre', 
  fileFormat: 'CSV' 
}); 

