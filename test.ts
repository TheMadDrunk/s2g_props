import {convertFromString} from "./index";
import * as fs from "fs";

const svgString = fs.readFileSync('svg_examples/stadetest.svg').toString()
const props = fs.readFileSync('props.json').toString()
const propsParsed = JSON.parse(props);

const out = convertFromString(svgString,propsParsed)
const parsedgj = JSON.stringify(out);

fs.writeFileSync('out.json',parsedgj);

