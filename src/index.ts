
import * as plantuml from 'node-plantuml';
import * as fs from 'fs';
import * as csvparse from 'csv-parse';
import * as assert from 'assert';
import * as _ from 'lodash';
import * as path from 'path';

let input: path.ParsedPath;
let exportSrc = false;
let format = 'svg';

const nodes: string[][] = [];
const dependencies: string[][] = [];
const nodeStyles: any = {};
const edgeStyles: any = {};

function parseItem(record: string[]) {
    assert(record.length >= 2);
    nodes.push(record);
}

function parseDependency(record: string[]) {
    assert(record.length >= 2);
    dependencies.push(record);
}

function parseStyle(allStyles:any, record: string[]) {
    assert(record.length >= 3);
    _.merge(allStyles, {[record[0].trim()]: {[record[1].trim()]: record[2].trim()}});
}

function packStyles(styles: any) {
    _.forOwn(styles, (pairs: any, name: string) => {
        styles[name] = _.keys(pairs).map((attr: string) => `${attr}=${pairs[attr]}`).join(' ');
    });
}

function generateGraph() {
    packStyles(nodeStyles);
    packStyles(edgeStyles);
    let dot = `
@startdot
digraph DI {
rankdir=LR`;
    dot += '\n';
    dot += nodes.map((record: string[]) => {
        const styleName = record[1].trim() || 'default';
        const style = nodeStyles[styleName] || '';
        return `${record[0].trim()} [${style} label="${record[2].trim()}"]`;
    }).join('\n');
    dot += '\n';
    dot += dependencies.map((record: string[]) => {
        const styleName = record[2] || 'default';
        const style = `[${edgeStyles[styleName.trim()]}]` || '';
        return `${record[0]} -> ${record[1]} ${style}`;
    }).join('\n');
    dot += `
}
@enddot`;

    if (exportSrc) {
        console.log(dot);
    }

    const generator = plantuml.generate(dot, {format});
    generator.out.pipe(fs.createWriteStream(path.resolve(input.dir, input.name + '.' + format)));
}

let sectionBegin = false;
let parseRecord: (record: string[]) => void;

const parser = csvparse({
    relax_column_count: true,
});

parser.on('error', (err: any) => {
    console.error('Unable to parse the input file. Is it in valid CSV format?');
    console.error(err);
    process.exit(1);
});

parser.on('readable', () => {
    let record: string[];
    while (record = parser.read()) {
        if (record[0].length === 0) {
            continue;
        }
        if (record[0] === '[items]') {
            parseRecord = parseItem;
            sectionBegin = true;
        } else if (record[0] === '[dependencies]') {
            parseRecord = parseDependency;
            sectionBegin = true;
        } else if (record[0] === '[node-styles]') {
            parseRecord = _.partial(parseStyle, nodeStyles);
            sectionBegin = true;
        } else if (record[0] === '[edge-styles]') {
            parseRecord = _.partial(parseStyle, edgeStyles);
            sectionBegin = true;
        } else if (sectionBegin) {
            sectionBegin = false;
        } else {
            parseRecord(record);
        }
    }
});

parser.on('end', () => {
    generateGraph();
});

export function generate(options: any) {
    input = options.input;
    exportSrc = options.exportSrc;
    format = options.format;
    fs.createReadStream(path.resolve(input.dir, input.base)).pipe(parser);
}
