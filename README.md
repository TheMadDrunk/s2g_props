
# svg2geojson-properties

This package provides a function `convertFromString` to convert SVG data into GeoJSON format and add properties, including a UUID, to the features based on provided configurations.

## Installation

You can install the package via npm:

```bash
npm install svg2geojson-properties
```

## Usage

```javascript
const fs = require('fs');
const { convertFromString } = require('svg2geojson-properties');

const svgString = fs.readFileSync('path/to/your/svg/file.svg').toString();
const props = fs.readFileSync('path/to/your/props.json').toString();
const propsParsed = JSON.parse(props);

const geojsonData = convertFromString(svgString, propsParsed);

fs.writeFileSync('output.geojson', JSON.stringify(geojsonData));
```

### Parameters

- `svgString` (string): SVG data to convert.
- `config` (object): Configuration object containing class names and properties.

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
    ]
}
```

## Output

The function returns a GeoJSON object with added properties, including a UUID, based on the configurations provided.

```json
{
    "type": "FeatureCollection",
    "creator": "svg2geojson + properties",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "class": "stadium",
                "uuid": "11715a49-62fc-4375-9cff-29c30048b039"
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [...]
            }
        },
        ...
    ]
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
