import csv
import json
import os
import tangelo
import d3mds
import copy

#dataRoot = os.environ.get('TA3_OUTDIR', '../writeable')


def run(op,*args,**kwargs):
    if op == 'data':
        return getDataset()
    elif op == 'listfeatures':
        return listDatasetFeatures()
    elif op == 'metadata':
        return listFeatureMetadata()
    elif op == 'problems':
        return getProblems()
    else:
        tangelo.http_status(404)
        return 'illegal operation "%s"' % (op) if op else 'missing operation'

def getDataset():       
    problem_schema_path = os.environ.get('PROBLEM_ROOT')
    dataset_schema_path = os.environ.get('TRAINING_DATA_ROOT')
    datasupply = d3mds.D3MDS(dataset_schema_path,problem_schema_path)
    # fill nan with zeros, or should it be empty strings?
    data_as_df = datasupply.get_data_all().fillna(0)
    list_of_dicts = copy.deepcopy(data_as_df.T.to_dict().values())
    #print 'train data excerpt: ',list_of_dicts
    #print 'end of data'
    return list_of_dicts

def listDatasetFeatures():       
    featurelist = []
    # get the data handy by reading it
    dataset = getDataset()

    # Iterate over first entry, assuming the data is uniform ( no missing fields)
    for feat in dataset[0].keys():
        featurelist.append(feat)
    return featurelist


def listFeatureMetadata():       
    dataset_schema_path = os.environ.get('TRAINING_DATA_ROOT')
    datasupply = d3mds.D3MDataset(dataset_schema_path)
    return datasupply.get_learning_data_columns()


def getProblems():
    problem_schema_path = os.environ.get('PROBLEM_ROOT')
    problem_supply = d3mds.D3MProblem(problem_schema_path)
    targets = problem_supply.get_targets()
    metrics = problem_supply.get_performance_metrics()
    taskType = problem_supply.get_taskType()
    subType =  problem_supply.get_taskSubType()
    targets = problem_supply.get_targets()
    problems = []
    problems.append({'problemId': problem_supply.get_problemID(),
                        #'description': problem_supply.get_problemDescription(),
                        'taskType': taskType,
                        'taskSubType': subType,
                         'metrics' : metrics,
                         'targets': targets
                         })

    return problems
"""

def listTestingDataset(configString,*args,**kwargs):
    config = json.loads(configString)
    if 'training_data_root' in config:
        print 'using training data root'
        datasupply = d3mds.D3MDS(config['training_data_root'],config['problem_root'])
    else:
        print 'using test data root'
        datasupply = d3mds.D3MDS(config['test_data_root'],config['problem_root'])


    return [{'problemId': datasupply.get_problemID(),
             'description': datasupply.get_problemDescription(),
             #'metadata': schema,
             #'dataFile': config['test_data_root']
             }]
"""

def promote(value):
    try:
        value = int(value)
    except ValueError:
        try:
            value = float(value)
        except ValueError:
            pass

    return value
"""
def getTestingDataset():
    global dataRoot
    dataRoot = os.path.dirname(os.environ.get('TRAINING_DATA_ROOT'))
    dataRoot, dataset = os.path.split(dataRoot)

    return getDataset(dataset)

    os.environ['PROBLEM_SCHEMA_PATH'] = config['problem_schema']
    os.environ['DATASET_SCHEMA_PATH'] = config['dataset_schema']
"""
