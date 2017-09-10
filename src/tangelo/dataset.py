import csv
import gzip
import json
import os
import tangelo


def run(op, *args, **kwargs):
    if op == 'list':
        return listDatasets()
    elif op == 'data':
        return getDataset(*args, **kwargs)
    else:
        tangelo.http_status(404)
        return 'illegal operation "%s"' % (op) if op else 'missing operation'


def listDatasets():
    problems = []

    top = os.path.abspath('../data/d3m')
    walker = os.walk(top)
    for (dirpath, dirnames, filenames) in walker:
        if dirpath == top or 'problemSchema.json' not in filenames:
            continue

        # Stop os.walk() from recursing into the data or solution directories.
        dirnames = []

        # Open the schema file to discover the relevant metadata about this 
        with open(os.path.join(dirpath, 'problemSchema.json')) as f:
            schema = json.loads(f.read())

        # Open the description file.
        with open(os.path.join(dirpath, schema['descriptionFile'])) as f:
            description = f.read()

        problems.append({'problemId': schema['problemId'],
                         'description': description,
                         'dataFile': '%s' % (os.path.basename(dirpath))})

    return problems


def promote(value):
    try:
        value = int(value)
    except ValueError:
        try:
            value = float(value)
        except ValueError:
            pass

    return value


def getDataset(name):
    datafile = os.path.abspath(os.path.join('../data/d3m', name, 'data', 'trainData.csv.gz'))

    try:
        reader = csv.reader(gzip.GzipFile(datafile))
    except IOError:
        try:
            datafile = datafile[0:-3]
            reader = csv.reader(open(datafile))
        except IOError:
            tangelo.http_status(500)
            return {'error': 'Could not open datafile for dataset %s' % (name)}

    rows = list(reader)

    dicts = []
    for row in rows[1:]:
        dicts.append({k: promote(v) for k, v in zip(rows[0], row)})

    return dicts
