import * as d3 from 'd3';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importer les styles
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Importer les scripts (y compris Popper.js)
import {annees, nomDepartement} from './data.js'; 
//import React, { useEffect, useRef } from "react";



var marge = {haut: 20, droite: 20, bas: 20, gauche: 50};
var hauteur = 500;
var largeur = 1000;
var duration = 500;

const csvFiles = ['faits2002.csv', 'faits2003.csv', 'faits2004.csv', 'faits2005.csv', 'faits2006.csv', 'faits2007.csv', 'faits2008.csv', 'faits2009.csv', 'faits2010.csv'];
const promises = csvFiles.map(file => d3.dsv(";",file));

Promise.all(promises)
    .then(function(datas) {
        let mapPromise = d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson")
        let uidCounter = 0;
        let uidCounter2 = 0;
        
        const faits = getFaits();
        const departements = getDepartements();
        const refinedData = refiningData();
        const dataToHiearachier = dataToHiearachie();

        /**
         * Remplissage des selects 
         */

        let selectGraph1 = d3.select('#selectGraph1')
        selectGraph1.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 
        
        let selectGraph2Fait = d3.select('#selectGraph2Fait')
        selectGraph2Fait.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 
        
        let selectGraph2Dep = d3.select('#selectGraph2Dep')
        selectGraph2Dep.selectAll('option').data(departements).enter().append('option').attr('value', d => d).text(d => d + " - " + nomDepartement[d]) 
        
        let selectGraph3Fait = d3.select('#selectGraph3Fait')
        selectGraph3Fait.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 

        let selectAnneeMap = d3.select('#selectAnneeMap')
        selectAnneeMap.selectAll('option').data(annees).enter().append('option').attr('value', d => d).text(d => d)
        
        let selectFaitMap = d3.select('#selectFaitMap')
        selectFaitMap.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d)         

        let selectTreeMap = d3.select('#selectTreeMap')
        selectTreeMap.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d)
        
        /**
         * Attache des evenements aux selects
         */

        selectGraph1.on('change', function(){updateGraph1()})
        selectGraph2Fait.on('change', function(){updateGraph2()})
        selectGraph2Dep.on('change', function(){updateGraph2()})
        selectGraph3Fait.on('change', function(){updateGraph3()})
        selectAnneeMap.on('change', function(){updateGraphMap()})
        selectFaitMap.on('change', function(){updateGraphMap()})

        creerGraph1();
        creerGraph2();
        let col = {}
        var graph3Model = {col}
        var colors = d3.schemeCategory10
        creerGraph3();
        creerGraphMap();
        creerTreeMap();

        function getValue(d3Obj){return d3Obj._groups[0][0].value;}
        function fromCodeJSONtoCodeData(d){return d.properties['code'].replace(/^0+/, '')}

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

        
        function dataToHiearachie() {
            let res = {}
            res['name'] = 'Annees'
            res['children'] = Array(8)
            annees.forEach( function (annee, i) {
                let temp = {}
                temp['name'] = annee
                temp['children'] = Array(103)
                faits.forEach( function (fait, ii) { // 103 fait
                    let temp2 = {}
                    temp2['name'] = fait
                    temp2['children'] = Array(95)
                    departements.forEach( function (departement, iii) { // 95 dep
                        temp2['children'][iii] = {} 
                        temp2['children'][iii]['name'] = departement
                        temp2['children'][iii]['children'] = refinedData[annee][fait][departement]
                    })
                    temp['children'][ii] = temp2;
                })
                res['children'][i] = temp;
            })
            return res;
        }
        console.log(dataToHiearachier)

        function getTotalFait(annee, fait){
            return Object.values(refinedData[annee][fait]).reduce((acc,curr) => acc + curr,0)
        }

        /**
         * Retourne le max du fait partout sur toutes les années
         */
        function getMaxFait(fait){
            let max = 0;
            annees.forEach( annee => 
                departements.forEach( departement => 
                {
                    if(max < refinedData[annee][fait][departement])
                        max = refinedData[annee][fait][departement]
                })
            )
            return max
        }

        /**
         * Fonction qui retourne un tableau du nb d'un fait dans un departement
         */
        function getEvolFait(fait, departement){
            let res = new Array(annees.length)
            for(let ind in annees){
                res[ind] = refinedData[annees[ind]][fait][departement]
            }
            return res;
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

        function creerGraph3(){
            let graph = d3.select('#graph3')
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)
            let nomDep = graph.select('.nomDep')
            let subject = getValue(selectGraph3Fait)
            let max = getMaxFait(subject)
            let xScale = d3.scaleLinear().domain([0,8]).range([marge.gauche, largeur-marge.droite])
            var yScale = d3.scaleLinear().domain([0,max]).range([hauteur - marge.bas, marge.haut]);
            let xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0).ticks(9));
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            var line = d3.line()
                .x(function(d,i) {
                    return xScale(i);
                })
                .y(function(d,i) {
                    return yScale(d);
                })

            graph.select('#affichage').selectAll('path').data(departements).enter().append('path')
                .attr('fill','none')
                .each(function(d){graph3Model.col[d] = 0})
                .style('stroke', (d,i) => colors[graph3Model.col[d]])
                .attr('d', d => line(getEvolFait(subject,d)))
                .attr('departement', d => d)
                .classed('line',true)
                

            graph.selectAll('.line')
                .on('mouseenter', function(d,i){
                    /*d3.select(this)
                        .raise()
                        .style('stroke','green')
                        .style('stroke-width', '3px')*/
                    nomDep.text(i + ' - ' +nomDepartement[i])
                })
                .on('mouseleave', function(d,i){
                    /*d3.select(this)
                        .style('stroke', (d,i) => colors[graph3Model.col[i]])
                        .style('stroke-width', function(){
                            if(graph3Model.focus[i])
                                return '3px'
                            return '1px'
                        })*/
                    nomDep.text('');
                })
                
                axeX.call(xAxis);
                axeY.call(yAxis);

            mapPromise.then(france => {
                let projection = d3.geoMercator()
                .center([2.454071, 46.279229]) // Centrage sur la France
                .scale(2000) // Zoom
                .translate([400, 300]);
                let path = d3.geoPath().projection(projection);

                graph.select('#depSelector').selectAll('path').data(france.features).enter().append('path')
                    .attr('d', path)
                    .classed('departement',true)
                    .style('fill', (d) => colors[graph3Model.col[fromCodeJSONtoCodeData(d)]])
                    .style("stroke", "#333")

                graph.select('#depSelector').selectAll('path')
                    .on('click', function(d,i){
                        graph3Model.col[fromCodeJSONtoCodeData(i)] = (graph3Model.col[fromCodeJSONtoCodeData(i)]+1) % colors.length;
                        d3.select(this)
                            .style('fill', (d) => colors[graph3Model.col[fromCodeJSONtoCodeData(d)]])
                        updateGraph3()
                    })
            })
        }

        function updateGraph3(){
            console.log(graph3Model)
            let graph = d3.select('#graph3')
            let subject = getValue(selectGraph3Fait)
            let max = getMaxFait(subject)

            let xScale = d3.scaleLinear().domain([0,8]).range([marge.gauche, largeur-marge.droite]);
            var yScale = d3.scaleLinear().domain([0,max]).range([hauteur - marge.bas, marge.haut]);
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            var line = d3.line()
                .x(function(d,i) {
                    return xScale(i);
                })
                .y(function(d,i) {
                    return yScale(d);
                })

            graph.select('svg').selectAll('.line').data(departements)
                .transition()
                .duration(duration)
                .style('fill','none')
                .style('stroke', (d,i) => colors[graph3Model.col[d]])
                .style('stroke-width', function(d,i){
                    if(graph3Model.col[d] !== 0){
                        return '3px'
                    } 
                    return '1px'
                })
                .attr('d', d => line(getEvolFait(subject,d)))
/*                .each( function(d,i){
                    if(graph3Model.col[d] !== 0){
                        d3.select(this).raise()
                    }
                })*/

            graph.select('.axeY').transition().duration(duration).call(yAxis)
        }

        function creerGraphMap(){
            let map = d3.select('#map')
            let max = d3.max(Object.values(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)]))
            let nomDep = map.select('.nomDep')

            let echelleLineaireMulti = d3.scaleLinear()
                .domain([0, max*2/10, max/2, max])
                .range(['green', 'yellow','orange','red'])

            let projection = d3.geoMercator()
                .center([2.454071, 46.279229]) // Centrage sur la France
                .scale(2000) // Zoom
                .translate([400, 300]);
            let path = d3.geoPath().projection(projection);
            
            // Charger le fichier GeoJSON !!! async
            //d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson")
                
            mapPromise.then(france => {
                    map.select('svg').selectAll('path').data(france.features).enter().append('path')
                        .attr('d', path)
                        .classed('departement',true)
                        .style('fill', d => {
                            return echelleLineaireMulti(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][fromCodeJSONtoCodeData(d)]);
                        })
                        .style("stroke", "#333")

                    map.selectAll('.departement')
                        .on('mouseenter', function(d,i){
                            d3.select(this).style('fill','blue')
                            nomDep.text(i.properties['nom']+" "+ refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][fromCodeJSONtoCodeData(i)])
                        })
                        .on('mouseleave', function(d,i){
                            d3.select(this).style('fill', d => {
                                return echelleLineaireMulti(refinedData[getValue(selectAnneeMap)][getValue(selectFaitMap)][fromCodeJSONtoCodeData(d)]);
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
            let nomDep = map.select('.nomDep')

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

        function creerTreeMap() {
            let treemap = d3.select('#treemap');
            let subject = getValue(selectTreeMap);
            let max = getMaxFait(subject);
        
            let root = d3.hierarchy({ children: dataToHiearachier })  
                .sum(d => d.nombre_de_crimes)
                .sort((a, b) => b.value - a.value);
        
            d3.treemap()
                .size([largeur, hauteur])
                .padding(2)(root);
        
            let colorScale = d3.scaleSequential(d3.interpolateOranges)
                .domain([0, max]);
        
            let cell = treemap.select('svg').selectAll("g")
                .data(root.leaves())
                .join("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);
        
            // Ajout des rectangles colorés
            cell.append("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .attr("fill", d => colorScale(d.value))
                .style("stroke", "#333");
        
            // Ajout du texte (Numéro, Nom, Crimes)
            cell.append("text")
                .attr("x", d => (d.x1 - d.x0) / 2)
                .attr("y", d => (d.y1 - d.y0) / 2 - 5)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "white")
                .attr("font-size", "12px")
                .text(d => `${d.data.numero} - ${d.data.département}`);
        
            // Nombre de crimes affiché en dessous
            cell.append("text")
                .attr("x", d => (d.x1 - d.x0) / 2)
                .attr("y", d => (d.y1 - d.y0) / 2 + 10)
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("fill", "white")
                .attr("font-size", "10px")
                .attr("fill-opacity", 0.8)
                .text(d => `${d.value} crimes`);
        }

        /*function creerTreeMap(){
            let treemap = d3.select('#treemap');
            // Specify the chart’s dimensions.
            const width = 1154;
            const height = 1154;

            // Specify the color scale.
            const color = d3.scaleOrdinal(dataToHiearachier.children.map(d => d.name), d3.schemeTableau10);

            const tile = d3.treemapSquarify; // Méthode standard de D3.js

            // Compute the layout.
            const root = d3.treemap()
                .tile(tile) // e.g., d3.treemapSquarify
                .size([width, height])
                .padding(1)
                .round(true)
            (d3.hierarchy(dataToHiearachier)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value));

            // Create the SVG container.
            const svg = treemap.select('svg');

            // Add a cell for each leaf of the hierarchy.
            const leaf = svg.selectAll("g")
                .data(root.leaves())
                .join("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);

            // Append a tooltip.
            const format = d3.format(",d");
            leaf.append("title")
                .text(d => `${d.ancestors().reverse().map(d => d.data.name).join(".")}\n${format(d.value)}`);


                leaf.append("rect")
                    .attr("id", function(d) {
                        // Générez un ID unique en utilisant le compteur
                        return "leaf-" + (uidCounter++);
                    })
                    .attr("fill", function(d) {
                        while (d.depth > 1) d = d.parent;
                        return color(d.data.name);
                    })
                    .attr("fill-opacity", 0.6)
                    .attr("width", function(d) {
                        return d.x1 - d.x0;
                    })
                    .attr("height", function(d) {
                        return d.y1 - d.y0;
                    });
                               

            // Append a clipPath to ensure text does not overflow.
            leaf.append("clipPath")
                .attr("id", function(d) {
                    // Générer un ID unique en utilisant le compteur uidCounter2
                    return "clip-" + (uidCounter2++);
                })
                .append("use")
                .attr("xlink:href", function(d) {
                    return "#" + d.leafUid;  // Utiliser l'ID unique du rect créé précédemment
                });


            // Append multiline text. The last line shows the value and has a specific formatting.
            leaf.append("text")
                .attr("clip-path", d => d.clipUid)
                .selectAll("tspan")
                .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value)))
                .join("tspan")
                .attr("x", 3)
                .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .text(d => d);
            }*/
    }).catch(function(error) {
    console.error("Erreur lors du chargement des fichiers :", error);
});