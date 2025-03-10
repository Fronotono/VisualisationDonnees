import * as d3 from 'd3';
import 'bootstrap/dist/css/bootstrap.min.css'; // Importer les styles
import 'bootstrap/dist/js/bootstrap.bundle.min.js'; // Importer les scripts (y compris Popper.js)
import {annees, nomDepartement, departementsParRegion} from './data.js'; 
//import React, { useEffect, useRef } from "react";



var marge = {haut: 20, droite: 20, bas: 20, gauche: 60};
var hauteur = 500;
var largeur = 800;
var duration = 500;

const csvFiles = ['faits2002.csv', 'faits2003.csv', 'faits2004.csv', 'faits2005.csv', 'faits2006.csv', 'faits2007.csv', 'faits2008.csv', 'faits2009.csv', 'faits2010.csv'];
const promises = csvFiles.map(file => d3.dsv(";",file));

Promise.all(promises)
    .then(function(datas) {
        let mapPromise = d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson")
        
        const faits = getFaits();
        const regions = Object.keys(departementsParRegion)
        const departements = getDepartements();
        const refinedData = refiningData();

        let violsFaits = faits.filter(d => d.includes('Viols ')).concat(faits.filter(d => d.includes('sexuels')))
        console.log(violsFaits)
        let volsFaits = faits.filter(d => d.includes('Vols')).concat(faits.filter(d => d.includes('vols')))
        console.log(volsFaits)
        let destructionFaits = faits.filter(d => d.includes('destructions')).concat(faits.filter(d => d.includes('Attentats')))
        console.log(destructionFaits)
        let tempp = faits.filter( d => ! volsFaits.includes(d) && ! violsFaits.includes(d) && ! destructionFaits.includes(d))
        console.log(tempp)

        d3.selectAll('svg').style('width',largeur).style('height',hauteur)
        const dataToHiearachier = dataToHiearachie();

        // Création du tooltip
        const tooltip = d3.select(".tooltip");

        /**
         * Remplissage des selects 
         */

        let listDep = d3.selectAll('.listDep').selectAll('option').data(departements).enter().append('option').attr('value', d => d).text(d => d + " - " + nomDepartement[d]) 
        let listFait = d3.selectAll('.listFait')/*.style('width','300px')*/.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d)
        let listAnnee = d3.selectAll('.listAnnee').selectAll('option').data(annees).enter().append('option').attr('value', d => d).text(d => d)
        
        var colors = [...d3.schemeCategory10, '#FFF']
        var model = {}

        creerTreeMap();
        creerGraph11();
        creerGraph1();
        creerGraph2();
        creerGraph5();
        creerGraph3();
        creerGraph4();
        creerGraphMap();


        function getValue(d3Obj){return d3Obj._groups[0][0].value;}
        function fromCodeJSONtoCodeData(d){return d.properties['code'].replace(/^0+/, '')}

        /***
         * Fonction qui retourne un tableau de tous les faits du dataset
         */
        function getFaits(){return datas[0].map( d => d['Faits']).sort()}

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
                res['children'][i] = {name : annee}
                res['children'][i]['children'] = Array(103)
                faits.forEach( function (fait, ii) { // 103 fait
                    res['children'][i]['children'][ii] = {name : fait}
                    res['children'][i]['children'][ii]['children'] = Array(95)
                    departements.forEach( function (departement, iii) { // 95 dep
                        res['children'][i]['children'][ii]['children'][iii] = {name : departement}
                        res['children'][i]['children'][ii]['children'][iii]['children'] = refinedData[annee][fait][departement]
                    })
                })
            })
            return res;
        }

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

        function getTotal(annee){
            let res = 0;
            faits.forEach( fait => 
                res += getTotalFait(annee,fait)
            )
            return res;
        }

        function getRegionByDepartement(departement) {
            for (const [region, departements] of Object.entries(departementsParRegion)) {
                if (departements.includes(departement)) {
                    return region;
                }
            }
            return "Département inconnu";
        }

        function creerGraph11(){
            let graph = d3.select('#graph11')
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)

            let max = d3.max(annees, d => getTotal(d))
            let xScale = d3.scaleBand().domain(annees).range([marge.gauche, largeur]);
            let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
            let xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            graph.select('svg').selectAll('rect').data(annees).enter().append('rect')
                .attr("height", d =>  yScale(0) - yScale(getTotal(d)))
                .attr('width', xScale.bandwidth() - 1)
                .attr('x', d => xScale(d))
                .attr('y', d => yScale(getTotal(d)))
                .style("fill", "blue")
                .classed('total',true)

            graph.select('svg').selectAll('rect')
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", "100")
                        .html(getTotal(d) +' faits');
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("opacity", "0")
                });

            axeX.call(xAxis);
            axeY.call(yAxis);
        }

        function creerGraph1(){
            let graph = d3.select('#graph1')
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)
            let fait = getValue(graph.select('.listFait'))
            let dep = getValue(graph.select('.listDep'))

            graph.select('.listFait').on('change',function(){updateGraph()})
            graph.select('.listDep').on('change',function(){updateGraph()})

            let max = d3.max(annees, d => getTotalFait(d,fait))
            let xScale = d3.scaleBand().domain(annees).range([marge.gauche, largeur]);
            let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
            let xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            let s = graph.select('svg').selectAll('rect').data(annees)
            
            s.enter().append('rect').merge(s)
                .attr("height", d =>  yScale(0) - yScale(getTotalFait(d,fait)))
                .attr('width', xScale.bandwidth() - 1)
                .attr('x', d => xScale(d))
                .attr('y', d => yScale(getTotalFait(d,fait)))
                .style("fill", "blue")
                .classed('total',true)

            s.enter().append('rect').merge(s)
                .attr("height", d =>  yScale(0) - yScale(refinedData[d][fait][dep]))
                .attr('width', xScale.bandwidth() - 11)
                .attr('x', d => xScale(d)+5)
                .attr('y', d => yScale(refinedData[d][fait][dep]))
                .style("fill", "red")
                .classed('ind',true)
                .raise()

            axeX.call(xAxis);
            axeY.call(yAxis);

            function updateGraph(){
                console.log('update graph1')
                let graph = d3.select("#graph1")
                let fait = getValue(graph.select('.listFait'))
                let dep = getValue(graph.select('.listDep'))
                let max = d3.max(annees, d => getTotalFait(d,fait))
                let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
                
                let yAxis = g => g
                    .attr("transform", `translate(${marge.gauche},0)`)
                    .call(d3.axisLeft(yScale))
                
                graph.selectAll('.total').data(annees)
                    .transition()
                    .duration(duration)
                    .attr('y', d => yScale(getTotalFait(d,fait)))
                    .attr("height", d =>  yScale(0) - yScale(getTotalFait(d,fait)))

                graph.selectAll('.ind').data(annees)
                    .transition()
                    .duration(duration)
                    .attr('y', d => yScale(refinedData[d][fait][dep]))
                    .attr("height", d =>  yScale(0) - yScale(refinedData[d][fait][dep]))
                
                graph.select('.axeY').transition().duration(500).call(yAxis)
            }
        }

        function creerGraph2(){
            let graph = d3.select('#graph2')
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)
            let fait = getValue(graph.select('.listFait'))
            let dep = getValue(graph.select('.listDep'))
            
            graph.select('.listFait').on('change',function(){updateGraph()})
            graph.select('.listDep').on('change',function(){updateGraph()})

            let max = d3.max(annees, d => refinedData[d][fait][dep])
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
                .attr('y', d => yScale(refinedData[d][fait][dep]))
                .attr('height', d => yScale(0)-yScale(refinedData[d][fait][dep]))
                .attr('width', xScale.bandwidth() - 1)
                .style('fill','blue')

            axeX.call(xAxis);
            axeY.call(yAxis);

            function updateGraph(){
                let graph = d3.select("#graph2")
                let fait = getValue(graph.select('.listFait'))
                let dep = getValue(graph.select('.listDep'))
                let max = d3.max(annees, d => refinedData[d][fait][dep])
                let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
                
                let yAxis = g => g
                    .attr("transform", `translate(${marge.gauche},0)`)
                    .call(d3.axisLeft(yScale))
                
                graph.selectAll('rect').data(annees)
                    .transition()
                    .duration(duration)
                    .attr('y', d => yScale(refinedData[d][fait][dep]))
                    .attr('height', d => yScale(0)-yScale(refinedData[d][fait][dep]))
                
                graph.select('.axeY').transition().duration(500).call(yAxis)
            }
        }

        function creerGraph3(){
            let col = {}
            model[3] = {col}

            let graph = d3.select('#graph3')
            let fait = getValue(graph.select('.listFait'))
            graph.select('.listFait').on('change',function(){updateGraph()})
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)
            let nomDep = graph.select('.nomDep')
            let max = getMaxFait(fait)
            let xScale = d3.scaleLinear().domain(d3.extent(annees)).range([marge.gauche, largeur-marge.droite])
            let yScale = d3.scaleLinear().domain([0,max]).range([hauteur - marge.bas, marge.haut]);
            let xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(d3.format("d")).ticks(9));
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            var line = d3.line()
                .x(function(d,i) {
                    return xScale(annees[i]);
                })
                .y(function(d,i) {
                    return yScale(d);
                })

            graph.select('#affichage').selectAll('path').data(departements).enter().append('path')
                .attr('fill','none')
                .each(function(d){model[3].col[d] = colors[0]})
                .style('stroke', (d,i) => model[3].col[d]==='#FFF'?'none':model[3].col[d])
                .attr('d', d => line(getEvolFait(fait,d)))
                .attr('departement', d => d)
                .classed('line',true)
                

            graph.selectAll('.line')
                .on("mouseenter", (event, d) => {
                    tooltip.style("opacity", "100")
                        .text( d + ' - ' +nomDepartement[d]);
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseleave", () => {
                    tooltip.style("opacity", "0")
                })
                .on('click', function(d,i){
                    model[3].col[i] = model[3]['selectCouleur']
                    updateGraph()
                })
                
                axeX.call(xAxis);
                axeY.call(yAxis);

            mapPromise.then(france => {
                let projection = d3.geoMercator()
                    .center([2.454071, 46.279229]) // Centrage sur la France
                    .scale(1500) // Zoom
                    .translate([200, 200]);
                let path = d3.geoPath().projection(projection);

                graph.select('#depSelector').style('width','400px').style('height','400px').append('g').classed('map',true).selectAll('path').data(france.features).enter().append('path')
                    .attr('d', path)
                    .classed('departement',true)
                    .style('fill', (d) => model[3].col[fromCodeJSONtoCodeData(d)])
                    .style("stroke", "#333")
                    .on("mouseenter", (event, d) => {
                        tooltip.style("opacity", "100")
                            .text( fromCodeJSONtoCodeData(d) + ' - ' +nomDepartement[fromCodeJSONtoCodeData(d)]);
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("top", (event.pageY + 10) + "px")
                            .style("left", (event.pageX + 10) + "px");
                    })
                    .on("mouseleave", () => {
                        tooltip.style("opacity", "0")
                    })

                function zoomed(ev){
                    graph.select('.map').attr('transform',ev.transform )
                }
                
                graph.select('.map').selectAll('path')
                    .on('click', function(d,i){
                        model[3].col[fromCodeJSONtoCodeData(i)] = model[3]['selectCouleur'];
                        d3.select(this)
                            .style('fill', (d) => model[3].col[fromCodeJSONtoCodeData(d)])
                        updateGraph()
                    })
                graph.select('.map').call(d3.zoom().scaleExtent([1,100]).translateExtent([[0, 0], [400, 400]]).on('zoom', (eve) => zoomed(eve)).filter((eve) => {
                    if (event.type === "wheel") {
                        event.preventDefault(); // Bloque le scroll de la page
                    }
                    return !event.ctrlKey || event.type === "wheel";
                }))

                model[3]['selectCouleur'] = colors[0];
                graph.select('#depSelector').append('g').classed('legend',true).selectAll().data(colors).enter().append('rect')
                    .style('fill',d => d).style('stroke', function(d){return d===model[3]['selectCouleur']?'red':'#333'}).style('stroke-width','2px')
                    .attr('height','20px').attr('width','20px').attr('x', (d,i) => 5 + 22 * i +'px').attr('y','360px')
                    .classed('colorPickerItem',true)
                    .on('click',function(d, i){
                        model[3]['selectCouleur'] = i;
                        updateColorPicker()
                    })
            })

            function updateColorPicker(){
                d3.select('#graph3').select('#depSelector').selectAll('.colorPickerItem')
                    .style('stroke', function(d){return d===model[3]['selectCouleur']?'red':'#333'})
            }

            function updateGraph(){
                let graph = d3.select('#graph3')
                let fait = getValue(graph.select('.listFait'))
                let max = getMaxFait(fait)

                let xScale = d3.scaleLinear().domain([0,8]).range([marge.gauche, largeur-marge.droite]);
                var yScale = d3.scaleLinear().domain([0,max]).range([hauteur - marge.bas, marge.haut]);
                let yAxis = g => g
                    .attr("transform", `translate(${marge.gauche},0)`)
                    .call(d3.axisLeft(yScale))

                var line = d3.line()
                    .x((d,i) => xScale(i))
                    .y((d,i) =>yScale(d))

                graph.select('svg').selectAll('.line').data(departements)
                    .transition()
                    .duration(duration)
                    .style('fill','none')
                    .style('stroke', (d,i) => model[3].col[d]==='#FFF'?'none':model[3].col[d])
                    .style('stroke-width', function(d,i){
                        if(model[3].col[d] !== colors[0]){
                            return '4px'
                        } 
                        return '1px'
                    })
                    .attr('d', d => line(getEvolFait(fait,d)))

                    d3.select('#graph3').select('#depSelector').selectAll('.departement')
                    .style('fill', (d,i)=>model[3].col[fromCodeJSONtoCodeData(d)])

                graph.select('.axeY').transition().duration(duration).call(yAxis)
            }
        }

        function creerGraph4(){
            let graph = d3.select('#graph4')

            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)

            let annee = getValue(graph.select('.listAnnee'))
            let dep = getValue(graph.select('.listDep'))

            graph.select('.listAnnee').on('change',function(){updateGraph()})
            graph.select('.listDep').on('change',function(){updateGraph()})

            let max = d3.max(faits, d => refinedData[annee][d][dep])
            let xScale = d3.scaleBand().domain(faits).range([marge.gauche, largeur]);
            let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
            let xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));
            let yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            graph.select('svg').selectAll().data(faits).enter().append('rect')
                .attr('x', d => xScale(d))
                .attr('y', d => yScale(refinedData[annee][d][dep]))
                .attr('height', d => yScale(0)-yScale(refinedData[annee][d][dep]))
                .attr('width', xScale.bandwidth() - 1)
                .style('fill','blue')

            axeX.call(xAxis);
            axeY.call(yAxis);

            function updateGraph(){
                let graph = d3.select("#graph4")
                let annee = getValue(graph.select('.listAnnee'))
                let dep = getValue(graph.select('.listDep'))
                let max = d3.max(faits, d => refinedData[annee][d][dep])
                let yScale = d3.scaleLinear().domain([0, max]).range([hauteur - marge.bas, marge.haut]);
                
                let yAxis = g => g
                    .attr("transform", `translate(${marge.gauche},0)`)
                    .call(d3.axisLeft(yScale))
                
                graph.selectAll('rect').data(faits)
                    .transition()
                    .duration(duration)
                    .attr('y', d => yScale(refinedData[annee][d][dep]))
                    .attr('height', d => yScale(0)-yScale(refinedData[annee][d][dep]))
                
                graph.select('.axeY').transition().duration(500).call(yAxis)
            }
        }        

        function creerGraphMap(){
            let graph = d3.select('#map')

            let annee = getValue(graph.select('.listAnnee'))
            let fait = getValue(graph.select('.listFait'))

            let max = d3.max(Object.values(refinedData[annee][fait]))

            graph.select('.listAnnee').on('change',function(){updateGraph()})
            graph.select('.listFait').on('change',function(){updateGraph()})

            let echelleLineaireMulti = d3.scaleLinear()
                .domain([0, max*2/10, max/2, max])
                .range(['green', 'yellow','orange','red'])

            let projection = d3.geoMercator()
                .center([2.454071, 46.279229]) // Centrage sur la France
                .scale(1900) // Zoom
                .translate([largeur/2, hauteur/2]);
            let path = d3.geoPath().projection(projection);
                
            mapPromise.then(france => {
                    graph.select('svg').append('g').classed('map',true).selectAll().data(france.features).enter().append('path')
                        .attr('d', path)
                        .classed('departement',true)
                        .style('fill', d => {
                            return echelleLineaireMulti(refinedData[annee][fait][fromCodeJSONtoCodeData(d)]);
                        })
                        .style("stroke", "#333")

                    graph.selectAll('.departement')
                        .on("mouseenter", (event, d) => {
                            d3.select(this).style('fill','blue')
                            tooltip.style("opacity", "100")
                                .html(fromCodeJSONtoCodeData(d) + ' - ' +nomDepartement[fromCodeJSONtoCodeData(d)]+"<br>"+ refinedData[annee][fait][fromCodeJSONtoCodeData(d)] + ' fait(s)');
                        })
                        .on("mousemove", (event) => {
                            tooltip.style("top", (event.pageY + 10) + "px")
                                .style("left", (event.pageX + 10) + "px");
                        })
                        .on("mouseleave", () => {
                            d3.select(this).style('fill', d => {
                                return echelleLineaireMulti(refinedData[annee][fait][fromCodeJSONtoCodeData(d)]);
                            })
                            tooltip.style("opacity", "0")
                        })

                    function zoomed(ev){
                        graph.select('.map').attr('transform',ev.transform )
                    }
                    graph.select('.map').call(d3.zoom().scaleExtent([1,100]).translateExtent([[0, 0], [largeur, hauteur]]).on('zoom', (eve) => zoomed(eve)).filter((eve) => {
                        if (event.type === "wheel") {
                            event.preventDefault(); // Bloque le scroll de la page
                        }
                        return !event.ctrlKey || event.type === "wheel";
                    }))

                    // Définition du dégradé
                    let defs = graph.select('svg').append("defs");
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
                    
                    let margeLegend = {'bas':10,'haut':10,'gauche':10}
                    let largeurLegend = 10

                    //Rectangle sous la legend pour ne pas avoir la carte dessous lors du zoom 
                    graph.select('svg').append('rect')
                        .attr("x", 0)
                        .attr("y", 0)
                        .attr("width", 70)
                        .attr("height", hauteur+5)
                        .style("fill", "white");

                    graph.select('svg').append("rect")
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

                    graph.select('svg').append('g').classed('axe',true).call(axis);                        
                })
                .catch(error => console.log("Erreur de chargement :", error));  
        
            function updateGraph(){
                let graph = d3.select('#map')
                let annee = getValue(graph.select('.listAnnee'))
                let fait = getValue(graph.select('.listFait'))
                let max = d3.max(Object.values(refinedData[annee][fait]))

                let margeLegend = {'bas':0,'haut':20,'gauche':80}
                let largeurLegend = 10

                let echelleLineaireMulti = d3.scaleLinear()
                    .domain([0, max*2/10, max/2, max])
                    .range(['green', 'yellow','orange','red'])

                graph.selectAll('.departement')
                    .transition()
                    .duration(duration)
                    .style('fill', d => {
                        return echelleLineaireMulti(refinedData[annee][fait][d.properties['code'].replace(/^0+/, '')]);
                    })
                
                graph.selectAll('.departement')
                .on("mouseenter", (event, d) => {
                    d3.select(this).style('fill','blue')
                    tooltip.style("opacity", "100")
                        .html(fromCodeJSONtoCodeData(d) + ' - ' +nomDepartement[fromCodeJSONtoCodeData(d)]+"<br>"+ refinedData[annee][fait][fromCodeJSONtoCodeData(d)] + ' fait(s)');
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseleave", () => {
                    d3.select(this).style('fill', d => {
                        return echelleLineaireMulti(refinedData[annee][fait][fromCodeJSONtoCodeData(d)]);
                    })
                    tooltip.style("opacity", "0")
                })

                // Échelle linéaire pour l'axe
                let scale = d3.scaleLinear()
                    .domain([max, 0])
                    .range([0, hauteur-margeLegend.bas-margeLegend.haut]);
                let axis = gr => gr.call(d3.axisRight(scale))
                
                graph.select('.axe').transition().duration(duration).call(axis);  

            }
        }

        function creerTreeMap() {
            model['treeMap']  = {}
            model['treeMap']['palette'] = [...d3.schemePaired, 'url("#pattern-two")']

            regions.forEach(
                function(d,i){
                    model['treeMap'][d] = model['treeMap']['palette'][i % model['treeMap']['palette'].length]
                    console.log(model['treeMap'][d])
                }
            )

            let graph = d3.select('#graphTreeMap');
            let annee = getValue(d3.select('.listAnnee'));
            let fait = getValue(d3.select('.listFait'));

            let filteredData = {
                name: annee,
                children: Object.keys(departementsParRegion).map(reg => ({
                    name: reg,
                    children: departements
                        .filter(dep => getRegionByDepartement(dep) === reg)
                        .map(dep => ({
                            name: dep,
                            value: refinedData[annee][fait][dep] || 0
                        }))
                }))
            };
            
            let root = d3.hierarchy(filteredData)
                .sum(d => d.value)
                .sort((a, b) => b.value - a.value);
            
            let treemap = d3.treemap()
                .size([largeur, hauteur])
                .padding(1);
            
            treemap(root);
            
            let color = d3.scaleOrdinal(d3.schemePaired);
            let svg = graph.select('svg');
            
            let nodes = svg
                .selectAll('g')
                .data(root.leaves())

            nodes.selectAll('g').data(root.leaves()).exit().remove()

            nodes.enter().append('g').merge(nodes)
                .on("mouseenter", (event, d) => {
                    tooltip.style("opacity", "100")
                        .html( d.data.name + ' - ' +nomDepartement[d.data.name]+"<br>"+ d.data.value + ' fait(s)');
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", (event.pageY + 10) + "px")
                        .style("left", (event.pageX + 10) + "px");
                })
                .on("mouseleave", () => {
                    tooltip.style("opacity", "0")
                })             
                .transition()
                .duration(duration)
                .attr('transform', d => `translate(${d.x0},${d.y0})`)
                .attr('valeur', d => d.data.value)
                .each( function(d,i){

                    let temp = d3.select(this).selectAll('rect').data(d)
                    temp.enter().append('rect').merge(temp)
                   
                        .transition()
                        .duration(duration)
                        .attr('width', d => d.x1 - d.x0)
                        .attr('height', d => d.y1 - d.y0)
                        .style('fill', d => model['treeMap'][getRegionByDepartement(d.data.name)])



                    let temp2 = d3.select(this).selectAll('text').data(d)
                        temp2.enter().append('text').merge(temp2)
                            .transition()
                            .duration(duration)
                            .attr('x', d => (d.x1 - d.x0) / 2 - 4)
                            .attr('y', d => (d.y1 - d.y0) / 2 + 4)
                            .text(d => d.data.name)
                            .attr('fill', d => d.data.value == 0 ? 'none' : 'black')
                            .style('font-size', '12px')
                            .style('overflow', 'hidden');                       
                        
                })

            nodes.selectAll('rect')
                
                
            d3.select('.listAnnee').on('change', creerTreeMap);
            d3.select('.listFait').on('change', creerTreeMap);

            //Création de la legend dans un svg voisin
            graph.select('.legend')
            .style('width', '300px')
            .selectAll()
            .data(Object.keys(departementsParRegion))
            .enter()
            .append('g') // Crée un groupe pour chaque élément (rect + text)
            .each(function (d, i) {
                d3.select(this)
                    .append('rect')
                    .style('fill', model['treeMap'][d])
                    .attr('height', '20px')
                    .attr('width', '20px')
                    .attr('y', 5 + 22 * i + 'px')
                    .attr('x', '0px')
        
                d3.select(this)
                    .append('text')
                    .text(d)
                    .attr('x', '25px') // Décalage à droite du rectangle
                    .attr('y', 15 + 22 * i + 'px') // Alignement vertical avec le rectangle
                    .attr('alignment-baseline', 'middle')
                    .style('font-size', '14px')
                    .style('fill', '#000');
            });
        }        

        function creerGraph5() {
            let graph = d3.select("#graph5");
            let axeX = graph.select("svg").append("g").classed("axeX", true);
            let axeY = graph.select("svg").append("g").classed("axeY", true);
            let fait = getValue(graph.select(".listFait"));
            let dep = getValue(graph.select(".listDep"));
        
            graph.select(".listFait").on("change", function () { updateGraph(); });
            graph.select(".listDep").on("change", function () { updateGraph(); });
        
            let max = d3.max(annees, d => Math.abs(getDifference(d, fait, dep))); 
            let xScale = d3.scaleBand().domain(annees.slice(1)).range([marge.gauche, largeur]);
            let yScale = d3.scaleLinear().domain([-max, max]).range([hauteur - marge.bas, marge.haut]);
        
            let xAxis = g => g
                .call(d3.axisBottom(xScale).tickSizeOuter(0))
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)

            let yAxis = g => g
                .call(d3.axisLeft(yScale))
                .attr("transform", `translate(${marge.gauche},0)`);
        
            graph.select("svg").selectAll("rect").data(annees).enter().append("rect")
                .attr("x", d => xScale(d))
                .attr("y", d => getDifference(d, fait, dep) >= 0 ? yScale(getDifference(d, fait, dep)) : yScale(0))
                .attr("height", d => Math.abs(yScale(0) - yScale(getDifference(d, fait, dep))))
                .attr("width", xScale.bandwidth() - 5)
                .style("fill", d => getDifference(d, fait, dep) >= 0 ? "blue" : "red");
        
            axeX.call(xAxis);
            axeY.call(yAxis);
        
            function updateGraph() {
                let graph = d3.select("#graph5");
                let fait = getValue(graph.select(".listFait"));
                let dep = getValue(graph.select(".listDep"));
                let max = d3.max(annees, d => Math.abs(getDifference(d, fait, dep))); 
                let yScale = d3.scaleLinear().domain([-max, max]).range([hauteur - marge.bas, marge.haut]);

                let yAxis = g => g
                    .call(d3.axisLeft(yScale))
                    .attr("transform", `translate(${marge.gauche},0)`);
        
                graph.selectAll("rect").data(annees)
                    .transition()
                    .duration(500)
                    .attr("y", d => getDifference(d, fait, dep) >= 0 ? yScale(getDifference(d, fait, dep)) : yScale(0))
                    .attr("height", d => Math.abs(yScale(0) - yScale(getDifference(d, fait, dep))))
                    .style("fill", d => getDifference(d, fait, dep) >= 0 ? "blue" : "red");
        
                graph.select(".axeY").transition().duration(500).call(yAxis);
            }
        }
        
        function getDifference(annee, fait, dep) {
            if (!refinedData[annee] || !refinedData[annee - 1]) return 0;
            return (refinedData[annee][fait][dep] || 0) - (refinedData[annee - 1][fait][dep] || 0);
        }        
    }).catch(function(error) {
    console.error("Erreur lors du chargement des fichiers :", error);
});