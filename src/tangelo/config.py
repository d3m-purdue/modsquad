import json
import os
import tangelo


def run():
    config_file = os.environ.get('JSON_CONFIG_PATH')
    if config_file is None:
        tangelo.http_status(500)
        return {'error': 'JSON_CONFIG_PATH is not set!'}

    try:
        with open(config_file) as f:
            text = f.read()
    except IOError as e:
        tangelo.http_status(500)
        return {'error': str(e)}

    try:
        config = json.loads(text)
    except ValueError as e:
        tangelo.http_status(500)
        return {'error': 'Could not parse JSON - %s' % (str(e))}

    os.environ['PROBLEM_SCHEMA'] = config['problem_schema']
    os.environ['DATASET_SCHEMA'] = config['dataset_schema']
    os.environ['TRAINING_DATA_ROOT'] = config['training_data_root']

    return config
