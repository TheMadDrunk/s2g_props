// @ts-ignore
import { geoFromSVGXML } from 'svg2geojson';
import { DOMParser, XMLSerializer } from 'xmldom-qsa';
// @ts-ignore
import { v4 as uuidv4 } from "uuid";
import center from "@turf/center";
import {StyleSpecification} from "maplibre-gl";

const STYLESPEC: StyleSpecification = {
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
};


export interface SVGNode {
    class: string,
    prefix:string,
    classList?: Array<string>,
    id?: string,
    children?: Array<SVGNode>,
}

const GEOITEMSVG = `
        <svg xmlns="http://www.w3.org/2000/svg">
            <MetaInfo xmlns="http://www.prognoz.ru">
                <Geo>
                    <GeoItem X="-595.30" Y="-142.88" Latitude="37.375593" Longitude="-121.977795"/>
                    <GeoItem X="1388.66" Y=" 622.34" Latitude="37.369930" Longitude="-121.959404"/>
                </Geo>
            </MetaInfo>
        </svg>`

export function featuresToGeoJsonSource(features: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]) {
    let geojson: GeoJSON.FeatureCollection = {
        "type": "FeatureCollection",
        "features": features
    };
    return geojson;
}


export function featuresToStyleSpecification(features: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]) {
    let style = { ...STYLESPEC }
    style.sources.svg  = {
        "type": "geojson",
        "cluster": false,
        "data": featuresToGeoJsonSource(features)
    }
    return style;
}

export function convertFromStringv2(svgString: string, specs: SVGNode) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');

    const limit = 5;
    const rootElement = svgDoc.documentElement;
    const features = convertTree(rootElement, specs, limit, { class: specs.class });

    return features;
}

function convertTree(element: Element, specs: SVGNode, limit: number, treeProps: { [key: string]: string }): GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[] {
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
    let features: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[]= []


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
                        { ...treeProps, class: specs.class, [specs.class]: specs.prefix + (index + 1).toString() }))
                })
            })
        }
        else {

            childrenElements.forEach((group, index) => {
                features = features.concat(convertTree(group, specs, limit - 1,
                    { ...treeProps, class: specs.class, [specs.class]: specs.prefix + (index + 1).toString() }))
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

function convertElementToGeoJsonFeature(element: Node[], specprops: { [key: string]: string }): GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[] {
    let feature: GeoJSON.Feature<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>[] = [];

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




