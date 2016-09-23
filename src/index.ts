import * as plantuml from 'node-plantuml';
import * as fs from 'fs';
import * as csvparse from 'csv-parse';
import * as assert from 'assert';

// TODO: get from argv
const input = 'input.csv';

const nodes: string[] = [];
const dependencies: string[] = [];

function parseItem(record: string[]) {
    assert(record.length >= 2);
    nodes.push(`${record[0].trim()} [label="${record[1].trim()}"]`);
}

function parseDependency(record: string[]) {
    assert(record.length >= 2);
    dependencies.push(`${record[0]} -> ${record[1]}`);
}

function generateGraph() {
    let dot = `
@startdot
digraph DI {
rankdir=LR
node [shape="box"]
edge [color="blue"]
    `;
    dot += nodes.join('\n');
    dot += dependencies.join('\n');
    dot += `
}
@enddot
    `;

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
    exit(1);
});

parser.on('readable', () => {
    let record;
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
