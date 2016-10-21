# Digraph Generator

CLI utility to generate directed graph. The description of the digraph is from CSV file.

## Example

Prepare input in a CSV file:

![](https://raw.githubusercontent.com/aleung/depgraph/master/doc/example_csv.png)

Will generate directed graph:

![](https://raw.githubusercontent.com/aleung/depgraph/master/doc/example.png)

## Usage

```
$ digraph --help
/usr/local/bin/digraph [options] <csv-file>

Options:
  -s, --export-source  Export plantuml source
  --example            Create an example csv file in current directory
  --version            Show version number
  --help               Show help
```

## Install

### Prerequisite

You need to have these software installed:

- [Node.js](https://nodejs.org)
- Java runtime or JDK
- [Graphviz](http://www.graphviz.org/)

### Install

``` shell
$ npm install digraph-generator -g
```
