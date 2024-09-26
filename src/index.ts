// @ts-ignore
import { geoFromSVGXML } from 'svg2geojson';
import { DOMParser, XMLSerializer } from 'xmldom-qsa';
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import center from "@turf/center";


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
    "source"?: string,
    "filter"?: any,
    "minzoom"?: any,
    "layout"?: any,
    paint: any,
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
        },
        {
            "id": "seat",
            "type": "fill",
            "source": "svg",
            "minzoom": 18,
            "paint": {
                "fill-color": "#A9A9A9"
            },
            "filter": [
                "==",
                "class",
                "seat"
            ]
        },
        {
            "id": "seat-symbol",
            "type": "symbol",
            "source": "svg",
            "minzoom": 18,
            "layout": {
                "text-field": [
                    "get",
                    "id"
                ],
                "text-font": [
                    "Roboto Regular"
                ],
                "text-size": 12,
                "text-justify": "center",
                "text-transform": "uppercase"
            },
            "paint": {
                "text-color": "#4D4D4D",
                "text-halo-color": "white",
                "text-halo-width": 1.5
            },
            "filter": [
                "==",
                "class",
                "seat"
            ]
        },
        {
            "id": "symbol-section",
            "type": "symbol",
            "source": "svg",
            "layout": {
                "text-field": [
                    "get",
                    "section"
                ],
                "text-font": [
                    "Roboto Regular"
                ],
                "text-size": 12,
                "text-transform": "uppercase",
                "text-letter-spacing": 0.05,
                "text-offset": [
                    0,
                    1.5
                ]
            },
            "paint": {
                "text-color": "#4D4D4D",
                "text-halo-color": "white",
                "text-halo-width": 2
            },
            "filter": [
                "==",
                "class",
                "section"
            ]
        }
    ],
    id: "90jrguv",

};


const GEOITEMSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
            <MetaInfo xmlns="http://www.prognoz.ru">
                <Geo>
                    <GeoItem X="-595.30" Y="-142.88" Latitude="37.375593" Longitude="-121.977795"/>
                    <GeoItem X="1388.66" Y=" 622.34" Latitude="37.369930" Longitude="-121.959404"/>
                </Geo>
            </MetaInfo>
        </svg>`

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

export function featuresToGeoJsonSource(features: Feature[]) {
    let geojson = {
        "type": "FeatureCollection",
        "creator": "svg2geojson + properties",
        "features": [...features]
    };
    return geojson;
}

export function featuresToStyleSpecification(features: Feature[]) {
    let style = { ...STYLESPEC }
    style.sources.svg = {
        "type": "geojson",
        "cluster": false,
        "data": featuresToGeoJsonSource(features)
    }
    return style;
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
        // @ts-ignore
        geoFromSVGXML(newSVGString, layer => {
            layer.features.forEach((feature: { properties: { class: string; id: string; }; }) => {
                feature.properties = spec.properties
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
    if (!images)
        return { sources: sources, layers: layers }
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

        geoFromSVGXML(newSVGString, (layer: { features: string | any[]; }) => {
            if (layer.features.length != 1)
                return;
            let coordinates = layer.features[0].geometry.coordinates[0].slice(0, 4)
            console.log(coordinates)
            sources[image.id] = <ImageSource>{ url: image.imageURL, coordinates: coordinates, type: 'image' };
            layers.push({ paint: undefined, id: image.id, type: "raster", source: image.id })
        })
    })
    return { sources: sources, layers: layers }
}

export interface SVGNode {
    class: string,
    classList?: Array<string>,
    id?: string,
    properties?: { [key: string]: string },
    children?: Array<SVGNode>,
}

export function convertFromStringv2(svgString: string, specs: SVGNode) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    const limit = 5;
    const rootElement = svgDoc.documentElement;
    const features = convertTree(rootElement, specs, limit, { class: specs.class });

    return features;
}


function convertTree(element: Element, specs: SVGNode, limit: number, treeProps: { [key: string]: string }): Feature[] {
    console.log(
        "--".repeat(limit) + "> "
        + "." + element.getAttribute('class')
        + "#" + element.getAttribute('id')
        + " on " + specs.class)

    if (limit <= 0) {
        console.log("Limit reached")
        return [];
    }

    if (!specs.classList && !specs.id) {
        console.log("No classList or id found")
        return [];
    }
    let features: Feature[] = []


    if (specs.classList) {
        const svgSelector = specs.classList.map(className => "g." + className).join(', ');
        const childrenElements = element.querySelectorAll(svgSelector)
        let componentElements = Array.from(element.childNodes).filter(child => {
            return child.nodeType === 1 && !(child as Element).matches(svgSelector);
        });

        console.log("all:", element.childNodes.length);
        console.log("componentElements:", componentElements?.length)
        console.log("childrenElements:", childrenElements.length)
        if (specs.children) {
            specs.children.forEach(child => {
                childrenElements.forEach((group, index) => {
                    features = features.concat(convertTree(group, child, limit - 1,
                        { ...treeProps, class: specs.class, [specs.class]: specs.class.substring(0, 3).toUpperCase() + (index + 1).toString() }))
                })
            })
        }
        else {

            childrenElements.forEach((group, index) => {
                features = features.concat(convertTree(group, specs, limit - 1,
                    { ...treeProps, class: specs.class, [specs.class]: specs.class.substring(0, 3).toUpperCase() + (index + 1).toString() }))
            })

        }

        if (componentElements.length > 0)
            features = features.concat(convertElementToGeoJsonFeature(componentElements, treeProps))
        /*if (!specs.children && childrenElements.length > 0)
            features = features.concat(convertElementToGeoJsonFeature(Array.from(childrenElements), { ...treeProps, class: specs.class }))
*/
    }
    else if (specs.id) {
        const svgElement = element.querySelector(`#${specs.id}`)
        if (!svgElement) {
            console.log(`Id '${specs.id}' not found`)
            return [];
        }
        features = convertElementToGeoJsonFeature([svgElement], { ...treeProps, class: specs.class })
    }

    //console.log("features:", features.map(f => f.properties))


    return features;
}



export function convertFromString
    (svgString: string,
        specs: {
            specifications: Array<Specification>,
            images?: Array<ImageIdURL>
        },
        styleSpec: StyleSpec = STYLESPEC
    ) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    //convertCirclesIntoPaths(svgDoc)
    //console.log("converted circles to paths")

    const geosjon = convertGroupsToGeoJson(svgDoc, specs.specifications)
    const testg = JSON.stringify(geosjon)
    const geojson = JSON.parse(testg)
    geojson.features.forEach((feature: { properties: { id: any; }; }) => {
        feature.properties.id = uuidv4();
    })
    console.log("converted svg to geojson")

    const style = { ...styleSpec }
    style.sources.svg = {
        "type": "geojson",
        "cluster": false,
        "data": geojson
    }

    /* const { sources, layers } = convertRectToGeoJson(svgDoc, specs.images!)

    Object.keys(sources)?.forEach(src => {
        style.sources[src] = sources[src]
    })
    layers.forEach(layer => {
        style.layers.push(layer)
    }) */


    return style;
}





function convertElementToGeoJsonFeature(element: Node[], specprops: { [key: string]: string }): Feature[] {
    let feature: Feature[] = [];

    const docGeoPos = new DOMParser().parseFromString(GEOITEMSVG, 'image/svg+xml');

    // Clone the element and append it to the docGeoPos
    element.forEach(node => {
        const clonedElement = node.cloneNode(true);
        docGeoPos.documentElement.appendChild(clonedElement);
    });

    const newSVGString = new XMLSerializer().serializeToString(docGeoPos);
    try {
        // @ts-ignore
        geoFromSVGXML(newSVGString, layer => {
            if (layer.features.length > 0) {
                layer.features.forEach((feat: any, index: number) => {
                    if (layer.features.length > 1)
                        feat.properties = {
                            [specprops.class]: specprops.class.substring(0, 3).toUpperCase() + (index + 1).toString()
                        };

                    const featId = uuidv4();
                    feat.properties = {
                        ...specprops,
                        id:featId
                    };

                    feat.id = featId;

                });

                if(specprops.class == "seat"){
                    const pointFeature = layer.features.map((feat: GeoJSON.Feature) => {
                        const point = center(feat)
                        point.properties = feat.properties;
                        return point;
                    })
                    feature = feature.concat(pointFeature)
                }
                else
                feature = feature.concat(layer.features);
            }
        }, { layers: false });
    } catch (error) {
        console.error(error);
    }

    /* if (!feature) {
        throw new Error("Failed to convert element to GeoJSON Feature");
    } */

    return feature;
}




