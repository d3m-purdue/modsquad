import csv
import json
import os
import tangelo

dataRoot = os.environ.get('TA3_OUTDIR', '../data/d3m')


def run(op, *args, **kwargs):
    if op == 'list':
        return listDatasets()
    elif op == 'listtesting':
        return listTestingDataset()
    elif op == 'data':
        return getDataset(*args, **kwargs)
    elif op == 'datatesting':
        return getTestingDataset()
    else:
        tangelo.http_status(404)
        return 'illegal operation "%s"' % (op) if op else 'missing operation'


def listDatasets():
    global dataRoot
    problems = []

    top = os.path.abspath(dataRoot)
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
                         'metadata': schema,
                         'dataFile': '%s' % (os.path.basename(dirpath))})

    return problems


def listTestingDataset():
    problemSchemaFile = os.environ.get('PROBLEM_SCHEMA')

    with open(problemSchemaFile) as f:
        schema = json.loads(f.read())

    dataPath = os.path.dirname(problemSchemaFile)
    with open(os.path.join(dataPath, schema['descriptionFile'])) as f:
        description = f.read()

    return [{'problemId': schema['problemId'],
             'description': description,
             'metadata': schema,
             'dataFile': '%s' % (os.path.basename(dataPath))}]


def promote(value):
    try:
        value = int(value)
    except ValueError:
        try:
            value = float(value)
        except ValueError:
            pass

    return value

def returnMatchTrain(index,trainData,name):
    for row in trainData:
        if row['d3mIndex'] == index:
          return row[name]
    return {}


def getTestingDataset():
    global dataRoot
    dataRoot = os.path.dirname(os.environ.get('TRAINING_DATA_ROOT'))
    dataRoot, dataset = os.path.split(dataRoot)

    return getDataset(dataset)


def getDataset(name):
    global dataRoot
    dataPath = os.path.abspath(os.path.join(dataRoot, name, 'data'))
    datafile = os.path.join(dataPath, 'trainData.csv')
    targetfile = os.path.join(dataPath, 'trainTargets.csv')

    try:
        reader = csv.reader(open(datafile))
    except IOError:
        tangelo.http_status(500)
        return {'error': 'Could not open datafile for dataset %s' % (name)}

    try:
        treader = csv.reader(open(targetfile))
    except IOError:
        tangelo.http_status(500)
        return {'error': 'Could not open training data for dataset %s' % (name)}

    rows = list(reader)
    trows = list(treader)

    # read in the initial training data
    dicts = []
    for row in rows[1:]:
        dicts.append({k: promote(v) for k, v in zip(rows[0], row)})

    # read the training target variable
    tdicts = []
    for trow in trows[1:]:
        tdicts.append({k: promote(v) for k, v in zip(trows[0], trow)})
    trainName = tdicts[0].keys()[1]

    # add the training variable to the datatable
    for row in dicts:
        indexToFix = row['d3mIndex']
        row[trainName] = returnMatchTrain(indexToFix,tdicts,trainName)

    schemaFile = os.path.join(dataPath, 'dataSchema.json')

    schema = None
    try:
        with open(schemaFile) as f:
            schema = json.loads(f.read())
    except IOError:
        tangelo.http_status(500)
        return {'error': 'Could not open schemafile for dataset %s' % (name)}
    except ValueError as e:
        tangelo.http_status(500)
        return {'error': 'Error while parsing schemafile for dataset %s: %s' % (name, e)}

    return {'data': dicts,
            'meta': schema,
            'path': dataPath,
            'name': name}
