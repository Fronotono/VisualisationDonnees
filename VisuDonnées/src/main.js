import * as d3 from 'd3';

var marge = {haut: 20, droite: 20, bas: 20, gauche: 50};
var hauteur = 500;
var largeur = 1000;

const annees = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010'];
const csvFiles = ['faits2002.csv', 'faits2003.csv', 'faits2004.csv', 'faits2005.csv', 'faits2006.csv', 'faits2007.csv', 'faits2008.csv', 'faits2009.csv', 'faits2010.csv'];
const promises = csvFiles.map(file => d3.dsv(";",file));

Promise.all(promises)
    .then(function(datas) {
        let faits = getFaits();
        let departements = getDepartements();
        let refinedData = refiningData();

        /**
         * Remplissage des selects 
         */
        let selectAnneeMap = d3.select('#selectAnneeMap')
        selectAnneeMap.selectAll('option').data(annees).enter().append('option').attr('value', (d,i) => i).text(d => d)
        
        let selectFaitMap = d3.select('#selectFaitMap')
        selectFaitMap.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 
        
        let selectGraph1 = d3.select('#selectGraph1')
        selectGraph1.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 
        
        let selectGraph2Fait = d3.select('#selectGraph2Fait')
        selectGraph2Fait.selectAll('option').data(faits).enter().append('option').attr('value', d => d).text(d => d) 
        
        let selectGraph2Dep = d3.select('#selectGraph2Dep')
        selectGraph2Dep.selectAll('option').data(departements).enter().append('option').attr('value', d => d).text(d => d) 

        /**
         * Attache des evenements aux selects
         */
        function getValue(d3Obj){return d3Obj._groups[0][0].value;}
        selectAnneeMap.on('change', function(){dessinerCarte(getValue(selectAnneeMap), getValue(selectFaitMap))})
        selectFaitMap.on('change', function(){dessinerCarte(getValue(selectAnneeMap), getValue(selectFaitMap))})
        selectGraph1.on('change', function(){dessinerGraphGlobal(getValue(selectGraph1))})


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
                            unit[departement] = datas[indiceAnnee][ind][departement]
                    }
                    refined[datas[indiceAnnee][ind]['Faits']] = unit
                }
                refinedData[annees[indiceAnnee]] = refined
            }
            return refinedData
        }

        function getTabFaits(annee, fait){
            for(let ind in datas[annee]){
                if(datas[annee][ind]['Faits'] === fait){
                    return datas[annee][ind]
                }
            }
            return undefined;
        }

        /***
         * Fonction qui retourne le nombre d'un fait pour un departement
         * @param datas : L'object contenant les données d'un fait
         */
        function getNbFait1(datas, departement)
        {
            return datas[departement];
        }

        /***
         * Fonction qui retourne le nombre de fait pour un departement
         * @param datas : Le tableau de l'année X recherché
         */
        function getNbFait(datas, departement, fait)
        {
            for(let d in datas) {
                if(datas[d]['Faits'] === fait)
                    return getNbFait1(datas[d],departement)
            }
            return undefined;
        }

        /***
         * Fonction qui retourne le nombre de fait pour un departement pour une année
         */
        function getNbFaitAnnee(annee, departement, fait)
        {
            return getNbFait(datas[annee],departement,fait)
        }

        /***
         * Fonction qui retourne le total d'un fait
         */
        function getTotal(datas)
        {
            let total = 0
            ///console.log(datas)
            for (let donne in datas) {
                if (donne !== "Faits") {
                    total += +(datas[donne].replaceAll(" ", ""));
                }
            }
            ///console.log("Pour le fait x il y a eu un total sur l'année y : "+total+" faits")
            return total;
        }

        /***
         * Fonction qui retourne un objet contenant les totaux des faits pour une année
         */
        function getTotauxFaits(datas){
            let totaux = {}
            delete datas.columns
            for(let indDonne in datas) {
                let temp = getTotal(datas[indDonne])
                totaux[datas[indDonne]['Faits']] = temp;
            }
            return totaux;
        }

        /***
         * Fonction qui retourne les totaux des faits sur toutes les années
         */
        function getTotauxAll(datas){
            let totauxAll = {}
            for(let donne in datas) {
            let temp = getTotauxFaits(donne)
            for(fait in getFaits())
                if(!(fait in totauxAll))
                    totauxAll[fait] = 0
                totauxAll[fait] += temp[fait]
            }
            return totauxAll
        }

        creerGraph2();

        function creerGraph2(){
            let graph = d3.select('#graph2')
            let axeX = graph.select('svg').append('g').classed('axeX', true)
            let axeY = graph.select('svg').append('g').classed('axeY', true)

            var xScale = d3.scaleBand().domain(annees).range([marge.gauche, largeur]);
            var yScale = d3.scaleLinear().domain([0, 
                d3.max(datas, (d,i) => 
                    ///getTotauxFaits(d)[getValue(selectGraph2Fait)]
                    refinedData[i][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)]
                )])
                .range([hauteur - marge.bas, marge.haut]);
            var xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));
            var yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            graph.select('svg').selectAll('rect').data(datas).enter().append('rect')
                .attr('x', (d,i)=>100*i)
                .attr('y', 100)
                .attr('height', (d,i)=>yScale(0)-yScale(refinedData[annees[i]][getValue(selectGraph2Fait)][getValue(selectGraph2Dep)]))
                .attr('width', 100)
                .style('fill','blue')
        }
        function updateGraph2(){


        }


        //d3.select("svg").append("g").attr("id", "axeX")
        //d3.select("svg").append("g").attr("id", "axeY")

        function dessinerGraphGlobal(subject) {
            if(subject === undefined) {
                subject = "Recels";
            }
            
            var xScale = d3.scaleBand().domain(annees).range([marge.gauche, largeur]);
            var yScale = d3.scaleLinear().domain([0, 
                d3.max(datas, d => getTotauxFaits(d)[subject])]).range([hauteur - marge.bas, marge.haut]);
            var xAxis = g => g
                .attr("transform", `translate(0, ${hauteur - marge.bas})`)
                .call(d3.axisBottom(xScale).tickSizeOuter(0));
            var yAxis = g => g
                .attr("transform", `translate(${marge.gauche},0)`)
                .call(d3.axisLeft(yScale))

            var a = d3.select("#graph1")
                .selectAll("rect")
                .data(datas);
            a.enter()
                .append("rect")
                .merge(a)
                .transition()
                .duration(1000)
                .delay(500)
                .style("fill", "blue")
                .attr("height", function (d, i) {
                    return yScale(0) - yScale(getTotauxFaits(d)[subject]);
                })
                .attr('width', xScale.bandwidth() - 1)
                .attr('x', function (d, i) {
                    return xScale(annees[i]);
                })
                .attr('y', function (d, i) {
                    return yScale(getTotauxFaits(d)[subject]);
                })

            d3.select('#axeX')
                .call(xAxis);

            d3.select('#axeY')
                .transition()
                .duration(1000)
                .delay(500)
                .call(yAxis);
        }

        dessinerGraphGlobal();


        dessinerCarte(getValue(selectAnneeMap), getValue(selectFaitMap));

        function dessinerCarte(indAnnee, subject) {
            // Définir les dimensions
            const width = 800, height = 600;
            const svg = d3.select("#map");

            let temp = Object.values(getTabFaits(indAnnee, subject)).filter(element => element !== subject)
            temp = temp.map(d=>+d.replaceAll(" ",""))
            ///console.log(d3.max(temp))
            
            var echelleLineaireMulti = d3.scaleLinear()
            .domain([0, d3.max(temp)*2/10,d3.max(temp)/2, d3.max(temp)])
            .range(['green', 'yellow','orange','red'])

            // Définir la projection géographique
            const projection = d3.geoMercator()
                .center([2.454071, 46.279229]) // Centrage sur la France
                .scale(2000) // Zoom
                .translate([width / 2, height / 2]); 

            const path = d3.geoPath().projection(projection);

            // Charger le fichier GeoJSON
            d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson")
                .then(france => {
                    ///console.log(france);
                    let c = svg.selectAll("path")
                        .data(france.features)
                    c.enter()
                        .append("path")
                        .merge(c)
                        .transition()
                        .duration(1000)
                        .delay(500)
                        .attr("d", path)
                        .attr("fill", function(data) {
                            return echelleLineaireMulti(+getNbFaitAnnee(indAnnee,data.properties['code'].replace(/^0+/, ''),subject).replaceAll(" ",""));
                        })
                        .attr("stroke", "#333");
                })
                .catch(error => console.log("Erreur de chargement :", error));
        }
    }).catch(function(error) {
    console.error("Erreur lors du chargement des fichiers :", error);
});


