import json
import os
import tangelo


def run(op, *args, **kwargs):
    if op == 'list':
        return listDatasets()
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
                         'description': description})

    return problems
