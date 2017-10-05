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
        return json.loads(text)
    except ValueError as e:
        tangelo.http_status(500)
        return {'error': 'Could not parse JSON - %s' % (str(e))}
