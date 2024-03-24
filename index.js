const { geoFromSVGXML } = require('svg2geojson');
const fs = require('fs');
const { DOMParser,XMLSerializer } = require('xmldom-qsa');




// var stringSVG = fs.readFileSync('svgsrc.svg') + "";
// const parser = new DOMParser();
// const doc = parser.parseFromString(stringSVG, 'image/svg+xml');



// const seatGroups = doc.querySelectorAll('g.SEAT')

// const newDoc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg"><MetaInfo xmlns="http://www.prognoz.ru"><Geo>
// <GeoItem X="-595.30" Y="-142.88" Latitude="37.375593" Longitude="-121.977795"/>
// <GeoItem X="1388.66" Y=" 622.34" Latitude="37.369930" Longitude="-121.959404"/>
// </Geo></MetaInfo></svg>`, 'image/svg+xml');


// seatGroups.forEach(group => {
//     const clonedGroup = group.cloneNode(true); 
//     newDoc.documentElement.appendChild(clonedGroup);
// });

// const newSVGString = new XMLSerializer().serializeToString(newDoc);
// console.log(newSVGString)
// geoFromSVGXML( newSVGString, layer => {
//     //console.log(layer)
//     let json = JSON.stringify(layer); // Turn JS object into JSON string
//      fs.writeFileSync('extracted_seats.geojson', json, 'utf-8');
//      console.log('Extracted seats saved to extracted_seats.svg');
// },{tolerance:0.001} );








function circleToPath(circleString) {
    // Parse the circle string to extract attributes
    const parser = new DOMParser();
    const circleDOM = parser.parseFromString(circleString, 'image/svg+xml').documentElement;
    const cx = parseFloat(circleDOM.getAttribute('cx'));
    const cy = parseFloat(circleDOM.getAttribute('cy'));
    const r = parseFloat(circleDOM.getAttribute('r'));

    // Constants
    const numSegments = 64; // Number of line segments for precision
    const angleIncrement = (Math.PI * 2) / numSegments;

    // Generate path data
    const pathData = [];
    const startX = cx + r;
    const startY = cy;
    pathData.push(`M ${startX},${startY}`);

    // Iterate over each segment to generate the path
    for (let i = 1; i <= numSegments; i++) {
        const angle = angleIncrement * i;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        pathData.push(`L ${x},${y}`);
    }

    // Close the path
    pathData.push('Z');

    // Combine path segments into a single string
    pathData.join(' ');

     // Construct the <path> element string
     const pathElement = `<path d="${pathData}" />`;

     // Return the <path> element string
     return pathElement;
}

const circleString = '<circle cx="50" cy="50" r="40" />';
const pathString = circleToPath(circleString);
console.log(pathString);
















// fs.writeFileSync('extracted_seats.svg', newSVGString, 'utf-8');

// console.log('Extracted seats saved to extracted_seats.svg');

// var x = 1;
// geoFromSVGFile( 'svgsrc.svg', layers => {
//     layers.forEach( layer => {
//         console.log("layer:",x)
//         console.log(`Layer Named: "${layer.name}"`);
//         x++
//     });
// }, {layers:true} ); 


