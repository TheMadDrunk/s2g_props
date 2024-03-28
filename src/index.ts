// @ts-ignore
import {geoFromSVGXML} from 'svg2geojson';
import {DOMParser, XMLSerializer} from 'xmldom-qsa';
import {v4 as uuidv4} from "uuid";


export type Feature = {
    "type": "Feature",
    "properties": {
        "class": string,
        "id": string
    },
    "geometry": Object
}

export type GeoJson = {
    "type": string,
    "creator": string,
    "features": Array<Feature>
}

export type Specification = {
    "classList": Array<string>,
    "properties": {
        "class": string,
        id: string,
    }
}

export type ImageIdURL = {
    "id": string,
    "imageURL": string
}

export type ImageSource = {
    "url": string,
    "type": "image",
    "coordinates": Array<Array<number>>
}

export type StyleLayer = {
    "id": string,
    "type": string,
    "source": string,
    paint: any
}

type StyleSpec = {
    version: number;
    name: string;
    metadata: { [key: string]: string };
    sources: { [key: string]: any };
    sprite: string;
    glyphs: string;
    layers: StyleLayer[];
    id: string;
};

const STYLESPEC: StyleSpec = {
    version: 8,
    name: "Empty Style",
    metadata: { "maputnik:renderer": "mlgljs" },
    sources: {},
    sprite: "",
    glyphs: "https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf",
    layers: [
        {
            id: "visisbleSvg",
            type: "fill",
            source: "svg",
            paint: {
                "fill-opacity": 0.7,
                "fill-color": "rgba(97, 92, 92, 1)",
                "fill-translate-anchor": "map"
            }
        }
    ],
    id: "90jrguv"
};


const GEOITEMSVG = `
        <svg xmlns="http://www.w3.org/2000/svg"><MetaInfo xmlns="http://www.prognoz.ru"><Geo>
        <GeoItem X="-595.30" Y="-142.88" Latitude="37.375593" Longitude="-121.977795"/>
        <GeoItem X="1388.66" Y=" 622.34" Latitude="37.369930" Longitude="-121.959404"/>
        </Geo></MetaInfo></svg>`

function circleToPath(circle: SVGCircleElement) {
    const cx = parseFloat(<string>circle.getAttribute('cx'));
    const cy = parseFloat(<string>circle.getAttribute('cy'));
    const r = parseFloat(<string>circle.getAttribute('r'));

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

function convertCirclesIntoPaths(doc: Document) {
    const circleList = doc.querySelectorAll('circle')
    if (circleList.length === 0)
        return;
    circleList.forEach(circle => {

        let path = circleToPath(circle)

        circle.parentNode?.replaceChild(path, circle);
    });
}

function convertGroupsToGeoJson(doc: Document, specifications: Array<Specification>): GeoJson {

    let geojson = {
        "type": "FeatureCollection",
        "creator": "svg2geojson + properties",
        "features": []
    };

    specifications.forEach(spec => {
        const docGeoPos = new DOMParser().parseFromString(GEOITEMSVG, 'image/svg+xml');

        const selector = spec.classList.map(className => "g." + className).join(', ');
        const svglayer = doc.querySelectorAll(selector)

        if (svglayer.length === 0) {
            console.log("No group '", spec.classList, "' found")
            return;
        }

        svglayer.forEach(group => {
            const clonedGroup = group.cloneNode(true);
            docGeoPos.documentElement.appendChild(clonedGroup);
        });

        const newSVGString = new XMLSerializer().serializeToString(docGeoPos);
        geoFromSVGXML(newSVGString, layer => {
            layer.features.forEach(feature => {
                feature.properties = spec.properties
                feature.properties.id = uuidv4();
            })

            geojson.features = geojson.features.concat(layer.features)

            console.log("Added properties to ", spec.classList)
        });
    })

    return geojson;
}

function convertRectToGeoJson(svgDoc: Document, images: Array<ImageIdURL>) {

    const sources: { [id: string]: ImageSource } = {};
    const layers: Array<StyleLayer> = []
    if(images)
    images.forEach(image => {
        const docGeoPos = new DOMParser().parseFromString(GEOITEMSVG, 'image/svg+xml');
        const rect = svgDoc.getElementById(image.id)

        if (!rect) {
            console.log(`Id '${image.id}' not found`)
            return;
        }

        const cloneRect = rect.cloneNode(true)
        docGeoPos.documentElement.appendChild(cloneRect);

        const newSVGString = new XMLSerializer().serializeToString(docGeoPos);

        geoFromSVGXML(newSVGString, layer => {
            if (layer.features.length != 1)
                return;
            let coordinates = layer.features[0].geometry.coordinates[0].slice(0, 4)
            console.log(coordinates)
            sources[image.id] = <ImageSource>{url: image.imageURL, coordinates: coordinates, type: 'image'};
            layers.push({paint: undefined, id: image.id, type: "raster", source: image.id})
        })
    })
    return {sources: sources, layers: layers}
}

export function convertFromString(svgString: string,
                                  specs: {
                                      specifications: Array<Specification>,
                                      images: Array<ImageIdURL>
                                  },
                                  styleSpec: StyleSpec = STYLESPEC
) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    convertCirclesIntoPaths(svgDoc)
    console.log("converted circles to paths")

    const geosjon = convertGroupsToGeoJson(svgDoc, specs.specifications)
    console.log("converted svg to geojson")

    const style = {...styleSpec}
    style.sources.svg = {
        "type": "geojson",
        "cluster": false,
        "data": geosjon
    }

    const {sources, layers} = convertRectToGeoJson(svgDoc, specs.images)

    Object.keys(sources)?.forEach(src => {
        style.sources[src] = sources[src]
    })
    layers.forEach(layer => {
        style.layers.push(layer)
    })

    return style;
}




