import * as plantuml from 'node-plantuml';
import * as fs from 'fs';
import * as csvparse from 'csv-parse';
import * as assert from 'assert';
import * as _ from 'lodash';

// TODO: get from argv
const input = 'input.csv';

const nodes: string[] = [];
const dependencies: string[] = [];
const nodeStyles: any = {};
const edgeStyles: any = {};

function parseItem(record: string[]) {
    assert(record.length >= 2);
    // TODO: apply style
    nodes.push(`${record[0].trim()} [label="${record[1].trim()}"]`);
}

function parseDependency(record: string[]) {
    assert(record.length >= 2);
    // TODO: apply style
    dependencies.push(`${record[0]} -> ${record[1]}`);
}

// TODO: partial apply (nodeStyles)
function parseNodeStyle(record: string[]) {
    assert(record.length >= 3);
    _.merge(nodeStyles, {[record[0].trim()]: {[record[1].trim()]: record[2].trim()}});
}

function parseEdgeStyle(record: string[]) {
    assert(record.length >= 3);
    _.merge(edgeStyles, {[record[0].trim()]: {[record[1].trim()]: record[2].trim()}});
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
rankdir=LR
    `;
    dot += nodes.join('\n');
    dot += dependencies.join('\n');
    dot += `
}
@enddot
    `;

    console.log('Generate output ...');

    // TODO: configurable
    const generator = plantuml.generate(dot, {format: 'svg'});
    generator.out.pipe(fs.createWriteStream("output.svg"));
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
            parseRecord = parseNodeStyle;
            sectionBegin = true;
        } else if (record[0] === '[edge-styles]') {
            parseRecord = parseEdgeStyle;
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

fs.createReadStream(input).pipe(parser);
