import * as d3 from 'd3';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importer les styles
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Importer les scripts (y compris Popper.js)


var marge = {haut: 20, droite: 20, bas: 20, gauche: 50};
var hauteur = 500;
var largeur = 1000;

var duration = 500;

const csvFiles = ['faits2002.csv', 'faits2003.csv', 'faits2004.csv', 'faits2005.csv', 'faits2006.csv', 'faits2007.csv', 'faits2008.csv', 'faits2009.csv', 'faits2010.csv'];
const promises = csvFiles.map(file => d3.dsv(";",file));

Promise.all(promises)
    .then(function(datas) {

        const annees = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010'];
        const nomDepartement = {
            "1": "Ain",
            "2": "Aisne",
            "3": "Allier",
            "4": "Alpes-de-Haute-Provence",
            "5": "Hautes-Alpes",
            "6": "Alpes-Maritimes",
            "7": "Ardèche",
            "8": "Ardennes",
            "9": "Ariège",
            "10": "Aube",
            "11": "Aude",
            "12": "Aveyron",
            "13": "Bouches-du-Rhône",
            "14": "Calvados",
            "15": "Cantal",
            "16": "Charente",
            "17": "Charente-Maritime",
            "18": "Cher",
            "19": "Corrèze",
            "2A": "Corse-du-Sud",
            "2B": "Haute-Corse",
            "21": "Côte-d'Or",
            "22": "Côtes-d'Armor",
            "23": "Creuse",
            "24": "Dordogne",
            "25": "Doubs",
            "26": "Drôme",
            "27": "Eure",
            "28": "Eure-et-Loir",
            "29": "Finistère",
            "30": "Gard",
            "31": "Haute-Garonne",
            "32": "Gers",
            "33": "Gironde",
            "34": "Hérault",
            "35": "Ille-et-Vilaine",
            "36": "Indre",
            "37": "Indre-et-Loire",
            "38": "Isère",
            "39": "Jura",
            "40": "Landes",
            "41": "Loir-et-Cher",
            "42": "Loire",
            "43": "Haute-Loire",
            "44": "Loire-Atlantique",
            "45": "Loiret",
            "46": "Lot",
            "47": "Lot-et-Garonne",
            "48": "Lozère",
            "49": "Maine-et-Loire",
            "50": "Manche",
            "51": "Marne",
            "52": "Haute-Marne",
            "53": "Mayenne",
            "54": "Meurthe-et-Moselle",
            "55": "Meuse",
            "56": "Morbihan",
            "57": "Moselle",
            "58": "Nièvre",
            "59": "Nord",
            "60": "Oise",
            "61": "Orne",
            "62": "Pas-de-Calais",
            "63": "Puy-de-Dôme",
            "64": "Pyrénées-Atlantiques",
            "65": "Hautes-Pyrénées",
            "66": "Pyrénées-Orientales",
            "67": "Bas-Rhin",
            "68": "Haut-Rhin",
            "69": "Rhône",
            "70": "Haute-Saône",
            "71": "Saône-et-Loire",
            "72": "Sarthe",
            "73": "Savoie",
            "74": "Haute-Savoie",
            "75": "Paris",
            "76": "Seine-Maritime",
            "77": "Seine-et-Marne",
            "78": "Yvelines",
            "79": "Deux-Sèvres",
            "80": "Somme",
            "81": "Tarn",
            "82": "Tarn-et-Garonne",
            "83": "Var",
            "84": "Vaucluse",
            "85": "Vendée",
            "86": "Vienne",
            "87": "Haute-Vienne",
            "88": "Vosges",
            "89": "Yonne",
            "90": "Territoire de Belfort",
            "91": "Essonne",
            "92": "Hauts-de-Seine",
            "93": "Seine-Saint-Denis",
            "94": "Val-de-Marne",
            "95": "Val-d'Oise",
            "971": "Guadeloupe",
            "972": "Martinique",
            "973": "Guyane",
            "974": "La Réunion",
            "976": "Mayotte"
        };
        const faits = getFaits();
        const departements = getDepartements();
        const refinedData = refiningData();

        /**
         * Remplissage des selects 
         */

        let selectGraph1 = d3.select('#selectGraph1')
        selectGraph1.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 
        
        let selectGraph2Fait = d3.select('#selectGraph2Fait')
        selectGraph2Fait.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 
        
        let selectGraph2Dep = d3.select('#selectGraph2Dep')
        selectGraph2Dep.selectAll('option').data(departements).enter().append('option').attr('value', d => d).text(d => d + " - " + nomDepartement[d]) 
        
        let selectAnneeMap = d3.select('#selectAnneeMap')
        selectAnneeMap.selectAll('option').data(annees).enter().append('option').attr('value', d => d).text(d => d)
        
        let selectFaitMap = d3.select('#selectFaitMap')
        selectFaitMap.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d)         

        /**
         * Attache des evenements aux selects
         */

        selectGraph1.on('change', function(){updateGraph1()})
        selectGraph2Fait.on('change', function(){updateGraph2()})
        selectGraph2Dep.on('change', function(){updateGraph2()})
        selectAnneeMap.on('change', function(){updateGraphMap()})
        selectFaitMap.on('change', function(){updateGraphMap()})

        creerGraph1();
        creerGraph2();

        creerGraphMap();

        function getValue(d3Obj){return d3Obj._groups[0][0].value;}        

        /***
         * Fonction qui retourne un tableau de tous les faits du dataset
         */
        function getFaits(){return datas[0].map( d => d['Faits'])}

        /***
         * Fonction qui retourne un tableau de tous les départements du dataset
         */
        function getDepartements(){return datas[0].columns.filter(element => element !== 'Faits')}

        /***
         * Fonction qui retourne un objet composé organisé en suivant cette logique : this[annee][fait][departement] = nbFait
         */
        function refiningData() {
            let refinedData = {}
            for(let indiceAnnee in datas){
                let refined = {}
                for(let ind in datas[indiceAnnee].filter(element => element !== 'column')){
                    let unit = {}
                    for(let departement in datas[indiceAnnee][ind]){
                        if(departement !== 'Faits')
                            unit[departement] = +datas[indiceAnnee][ind][departement].replaceAll(" ","")
                    }
                    refined[datas[indiceAnnee][ind]['Faits']] = unit
                }
                refinedData[annees[indiceAnnee]] = refined
            }
            return refinedData
        }

        function getTotalFait(annee, fait){
            return Object.values(refinedData[annee][fait]).reduce((acc,curr) => acc + curr,0)
        }

        function creerGraph1(){
            let graph = d3.select('#graph1')
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)
            
            let max = d3.max(annees, d => getTotalFait(d,getValue(selectGraph1)))
            let xScale = d3.scaleBand().domain(annees).range([marge.gauche, largeur]);
            let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
            let xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            graph.select('svg').selectAll('rect').data(annees).enter().append('rect')
                .attr("height", d =>  yScale(0) - yScale(getTotalFait(d,getValue(selectGraph1))))
                .attr('width', xScale.bandwidth() - 1)
                .attr('x', d => xScale(d))
                .attr('y', d => yScale(getTotalFait(d,getValue(selectGraph1))))
                .style("fill", "blue")

            axeX.call(xAxis);
            axeY.call(yAxis);
        }

        function updateGraph1(){
            let graph = d3.select("#graph1")
            let max = d3.max(annees, d => getTotalFait(d,getValue(selectGraph1)))
            let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
            
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))
            
            graph.selectAll('rect').data(annees)
                .transition()
                .duration(duration)
                .attr('y', d => yScale(getTotalFait(d,getValue(selectGraph1))))
                .attr("height", d =>  yScale(0) - yScale(getTotalFait(d,getValue(selectGraph1))))
            
            graph.select('.axeY').transition().duration(500).call(yAxis)
        }

        function creerGraph2(){
            let graph = d3.select('#graph2')
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)

            let max = d3.max(annees, d => refinedData[d][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)])
            let xScale = d3.scaleBand().domain(annees).range([marge.gauche, largeur]);
            let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
            let xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            graph.select('svg').selectAll('rect').data(annees).enter().append('rect')
                .attr('x', d => xScale(d))
                .attr('y', d => yScale(refinedData[d][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)]))
                .attr('height', d => yScale(0)-yScale(refinedData[d][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)]))
                .attr('width', xScale.bandwidth() - 1)
                .style('fill','blue')

            axeX.call(xAxis);
            axeY.call(yAxis);
        }

        function updateGraph2(){
            let graph = d3.select("#graph2")
            let max = d3.max(annees, d => refinedData[d][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)])
            let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
            
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))
            
            graph.selectAll('rect').data(annees)
                .transition()
                .duration(duration)
                .attr('y', d => yScale(refinedData[d][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)]))
                .attr('height', d => yScale(0)-yScale(refinedData[d][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)]))
            
            graph.select('.axeY').transition().duration(500).call(yAxis)
        }
        creerGraph3();
        function creerGraph3(){
            let graph = d3.select('#graph3')

            var xScale = d3.scaleLinear().domain([0,7]).range([0,500]);
            var yScale = d3.scaleLinear().domain([0,50]).range([0,500]);

            var line = d3.line()
                .x(function(d, i) {
                    return xScale(i);
                })
                .y(function(d) {
                    return yScale(d)
                })

            let test = [50,20,30,10,45,1,20]

            graph.select('svg').append('path')
                .attr('fill','none')
                .attr('stroke','steelblue')
                .attr('d', line(test))
        }

        function creerGraphMap(){
            let map = d3.select('#map')
            let max = d3.max(Object.values(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)]))
            let nomDep = d3.select('#nomDep')

            let echelleLineaireMulti = d3.scaleLinear()
                .domain([0, max*2/10, max/2, max])
                .range(['green', 'yellow','orange','red'])

            let projection = d3.geoMercator()
                .center([2.454071, 46.279229]) // Centrage sur la France
                .scale(2000) // Zoom
                .translate([400, 300]);
            let path = d3.geoPath().projection(projection);
            
            // Charger le fichier GeoJSON !!! async
            d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson")
                .then(france => {
                    map.select('svg').selectAll('path').data(france.features).enter().append('path')
                        .attr('d', path)
                        .classed('departement',true)
                        .style('fill', d => {
                            return echelleLineaireMulti(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][d.properties['code'].replace(/^0+/, '')]);
                        })
                        .style("stroke", "#333")

                    map.select('svg').selectAll("path")
                        .on('mouseenter', function(d,i){
                            d3.select(this).style('fill','blue')
                            nomDep.text(i.properties['nom']+" "+ refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][i.properties['code'].replace(/^0+/, '')])
                        })
                        .on('mouseleave', function(d,i){
                            d3.select(this).style('fill', d => {
                                return echelleLineaireMulti(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][d.properties['code'].replace(/^0+/, '')]);
                            })
                            nomDep.text('');
                        })

                    // Définition du dégradé
                    let defs = map.select('svg').append("defs");
                    let linearGradient = defs.append("linearGradient")
                        .attr("id", "gradient")
                        .attr("x1", "0%").attr("y1", "100%")
                        .attr("x2", "0%").attr("y2", "0%");
            
                    // Ajout des couleurs au dégradé
                    linearGradient.append("stop").attr("offset", "0%").attr("stop-color", "green");
                    linearGradient.append("stop").attr("offset","20%").attr("stop-color","yellow");
                    linearGradient.append("stop").attr("offset","50%").attr("stop-color","orange");
                    linearGradient.append("stop").attr("offset", "100%").attr("stop-color", "red");

                    // Dessin du rectangle avec le dégradé
                    
                    let margeLegend = {'bas':0,'haut':20,'gauche':80}
                    let largeurLegend = 10

                    map.select('svg').append("rect")
                        .attr("x", margeLegend.gauche)
                        .attr("y", margeLegend.haut)
                        .attr("width", largeurLegend)
                        .attr("height", hauteur-margeLegend.haut-margeLegend.bas)
                        .style("fill", "url(#gradient)");

                    // Échelle linéaire pour l'axe
                    let scale = d3.scaleLinear()
                        .domain([max, 0])
                        .range([0, hauteur-margeLegend.bas-margeLegend.haut]);
                    // Création de l'axe
                    let axis = gr => gr
                        .attr('transform', `translate(${margeLegend.gauche+largeurLegend},${margeLegend.haut})`)
                        .call(d3.axisRight(scale))

                    map.select('svg').append('g').classed('axe',true).call(axis);                        
                })
                .catch(error => console.log("Erreur de chargement :", error));  
        }

        function updateGraphMap(){
            let map = d3.select('#map')
            let max = d3.max(Object.values(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)]))
            let nomDep = d3.select('#nomDep')

            let margeLegend = {'bas':0,'haut':20,'gauche':80}
            let largeurLegend = 10

            let echelleLineaireMulti = d3.scaleLinear()
                .domain([0, max*2/10, max/2, max])
                .range(['green', 'yellow','orange','red'])

            map.selectAll('.departement')
                .transition()
                .duration(duration)
                .style('fill', d => {
                    return echelleLineaireMulti(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][d.properties['code'].replace(/^0+/, '')]);
                })
            
            map.selectAll('.departement')
                .on('mouseenter', function(d,i){
                    d3.select(this).style('fill','blue')
                    nomDep.text(i.properties['nom']+" "+ refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][i.properties['code'].replace(/^0+/, '')])
                })
                .on('mouseleave', function(d,i){
                    d3.select(this).style('fill', d => {
                        return echelleLineaireMulti(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][d.properties['code'].replace(/^0+/, '')]);
                    })
                    nomDep.text('');
                })

                // Échelle linéaire pour l'axe
                let scale = d3.scaleLinear()
                    .domain([max, 0])
                    .range([0, hauteur-margeLegend.bas-margeLegend.haut]);
                let axis = gr => gr.call(d3.axisRight(scale))
                
                map.select('.axe').transition().duration(duration).call(axis);  

        }

    }).catch(function(error) {
    console.error("Erreur lors du chargement des fichiers :", error);
});