const { geoFromSVGXML } = require('svg2geojson');
const fs = require('fs');
const { DOMParser, XMLSerializer } = require('xmldom-qsa');
const { features } = require('process');

function circleToPath(circle) {
    const cx = parseFloat(circle.getAttribute('cx'));
    const cy = parseFloat(circle.getAttribute('cy'));
    const r = parseFloat(circle.getAttribute('r'));

    // Constants
    const numSegments = 64; // Number of line segments for precision
    const angleIncrement = (Math.PI * 2) / numSegments;

    // Generate path data
    let pathData = "";
    const startX = cx + r;
    const startY = cy;
    pathData += `M ${startX} ${startY} `;

    // Iterate over each segment to generate the path
    for (let i = 1; i <= numSegments; i++) {
        const angle = angleIncrement * i;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        pathData += `L ${x.toFixed(6)} ${y.toFixed(6)} `;
    }

    // Close the path
    pathData += "Z "

    const pathElement = `<path d="${pathData}" />`;

    const parser = new DOMParser();
    const path = parser.parseFromString(pathElement, 'image/svg+xml').documentElement;

    return path;
}

function convertCirclesIntoPaths(doc) {
    const circleList = doc.querySelectorAll('circle')
    if(circleList.length == 0)
        return;
    circleList.forEach(circle => {

        path = circleToPath(circle)

        circle.parentNode.replaceChild(path, circle);
    });
}

// 1 -opens the file
// 2 - replace circles with paths
// 3 - convert by layers to geojson
var stringSVG = fs.readFileSync('stade test (1).svg') + "";
const parser = new DOMParser();
const doc = parser.parseFromString(stringSVG, 'image/svg+xml');
console.log('1 - SVG loaded.');

convertCirclesIntoPaths(doc)
console.log('2 - Converted circles into paths');

const dataobjstring = fs.readFileSync('props.json', 'utf8');
const dataobj = JSON.parse(dataobjstring);
let geojsonResult = {
    "type": "FeatureCollection",
    "creator": "s2gprops",
    "features": []
};

dataobj.classProps.forEach(feat => {
    const docGeoPos = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg"><MetaInfo xmlns="http://www.prognoz.ru"><Geo>
    <GeoItem X="-595.30" Y="-142.88" Latitude="37.375593" Longitude="-121.977795"/>
    <GeoItem X="1388.66" Y=" 622.34" Latitude="37.369930" Longitude="-121.959404"/>
    </Geo></MetaInfo></svg>`, 'image/svg+xml');

    const svglayer = doc.querySelectorAll("g."+feat.className)

    if(svglayer.length == 0){
        console.log("No group '"+feat.className+"' found")
        return;
    }

    svglayer.forEach(group => {
        const clonedGroup = group.cloneNode(true);
        docGeoPos.documentElement.appendChild(clonedGroup);
    });

    const newSVGString = new XMLSerializer().serializeToString(docGeoPos);
    geoFromSVGXML( newSVGString, layer => {
        layer.features.forEach(feature => {
            feature.properties = feat.properties
        })
        
        geojsonResult.features = geojsonResult.features.concat(layer.features)

        console.log("Added properties to "+feat.className)
    } );
})

fs.writeFileSync('gjResult.geojson',JSON.stringify(geojsonResult));

