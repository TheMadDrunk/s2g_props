# svg2geojson-properties

This package provides a function `convertFromString` to convert SVG data into a map style format compatible with tools like Mapbox and MapLibre. It adds properties, including a UUID, to the features based on provided configurations and includes additional images with layers to make them visible on the map.

## Installation

You can install the package via npm:

```bash
npm install s2g_props
```

## Usage

```javascript
const fs = require('fs');
const { convertFromString } = require('svg2geojson-properties');

const svgString = fs.readFileSync('path/to/your/svg/file.svg').toString();
const props = fs.readFileSync('path/to/your/config.json').toString();
const propsParsed = JSON.parse(props);

const mapStyleData = convertFromString(svgString, propsParsed);

fs.writeFileSync('output_map_style.json', JSON.stringify(mapStyleData));
```

### Parameters

- `svgString` (string): SVG data to convert.
- `config` (object): Configuration object containing class names, properties, and images.

### Example `props.json`

```json
{
    "specifications" : [
        {
            "classList": ["stadium"],
            "properties":{
                "class":"stadium"
            }
        },
        {
            "classList":["field"],
            "properties":{
                "class":"field"
            }
        },
        {
            "classList":["grandstand1","grandstand2","grandstand3","grandstand4"],
            "properties":{
                "class":"grandstand"
            }
        }
    ],
    "images" : [
        {
            "id": "image",
            "imageURL": "yourimageurl.jpg"
        }
    ]
}
```

## Output

The function returns a map style object containing the converted SVG to GeoJSON and additional images with layers to make them visible on the map.

```json
{
  "metadata": {
    "maputnik:renderer": "mlgljs"
  },
  "sources": {
    "svg": {
      "type": "geojson",
      "cluster": false,
      "data": // the converted svg to geojson
    },
    "image": {
      "url": "yourimageurl.jpg",
      "coordinates": //coordinates that we got from a path with id = image (like in the config)
      "type": "image"
    }
  },
  "sprite": "",
  "glyphs": "https://orangemug.github.io/font-glyphs/glyphs/{fontstack}/{range}.pbf",
  "layers": [
    {
      "id": "visisbleSvg",
      "type": "fill",
      "source": "svg",
      "paint": {
        "fill-opacity": 0.7,
        "fill-color": "rgba(97, 92, 92, 1)",
        "fill-translate-anchor": "map"
      }
    },
    {
      "id": "image",
      "type": "raster",
      "source": "image"
    }
  ],
  "id": "90jrguv"
}
```

## License

This project is licensed under the MIT License
