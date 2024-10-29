# svg2geojson-properties

This package provides a function `convertFromString` to convert SVG data into a GeoJSON format with hierarchical
properties. It's particularly useful for converting venue/stadium layouts where elements have a natural hierarchy (e.g.,
Stadium → Section → Row → Seat).

## Installation

You can install the package via npm:

```bash
npm install s2g_props
```

## Usage

```typescript
const fs = require('fs');
const {convertFromString} = require('s2g_props');

const svgString = fs.readFileSync('path/to/your/svg/file.svg', 'utf8');
const specs = {
  class: "stadium",
  classList: ["Stadium"],
  prefix: "",
  children: [{
    class: "section",
    classList: ["Section"],
    prefix: "",
    children: [{
      prefix: "",
      class: "row",
      classList: ["Row"],
      children: [{
        prefix: "",
        class: "seat",
        classList: ["Seat"],
      }]
    }]
  }]
} as SVGNode;

const geoJSON = convertFromString(svgString, specs);
fs.writeFileSync('output.json', JSON.stringify(geoJSON));
```

### Parameters

- `svgString` (string): SVG data to convert
- `specs` (SVGNode): Configuration object defining the hierarchy and properties

### Configuration Structure (SVGNode)

The configuration uses a tree structure where each node can have the following properties:

```typescript
interface SVGNode {
  class: string;        // The property name to assign
  classList: string[];  // SVG class names to match
  prefix: string;       // Optional prefix for generated IDs
  children?: SVGNode[]; // Optional child nodes for hierarchy
}
```

#### Example Configuration

```typescript
const specs = {
  class: "stadium",           // Will create a "stadium" property
  classList: ["Stadium"],     // Matches SVG elements with class "Stadium"
  prefix: "",
  children: [{
    class: "section",
    classList: ["Section"],
    prefix: "",
    children: [{
      class: "row",
      classList: ["Row"],
      children: [{
        class: "seat",
        classList: ["Seat"],
      }]
    }]
  }]
};
```

### SVG Requirements

Your SVG file should use classes that match the `classList` values in your configuration. For example:

```svg

<svg>
    <path class="Stadium" d="..."/>
    <path class="Section" d="..."/>
    <path class="Row" d="..."/>
    <path class="Seat" d="..."/>
</svg>
```

### Output

The function returns a GeoJSON object where each feature includes properties based on the hierarchical configuration.
For example:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          ...
        ]
      },
      "properties": {
        "stadium": "stadium1",
        "section": "section1",
        "row": "row1",
        "seat": "seat1",
        "id": "unique-generated-id"
      }
    }
  ]
}
```

## Migration from Previous Versions

If you're upgrading from a previous version that used the flat configuration format with `specifications` and `images`,
you'll need to:

1. Replace the flat specifications array with a hierarchical configuration
2. Remove the `images` configuration as it's no longer supported
3. Update your code to handle the new GeoJSON output format

## License

This project is licensed under the MIT License