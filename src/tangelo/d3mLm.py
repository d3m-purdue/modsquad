import json
import rpy2.robjects
import tangelo

# Load the d3mLm library and "export" some functions from it.
rpy2.robjects.r('library("d3mLm")')
run_lm = rpy2.robjects.r['run_lm']
run_quadratic = rpy2.robjects.r['run_quadratic']
run_loess = rpy2.robjects.r['run_loess']


def make_frame(data):
    for k in data:
        data[k] = rpy2.robjects.FloatVector(data[k])

    return rpy2.robjects.DataFrame(data)


def select_method(method):
    fn = None

    if method == 'linear':
        fn = run_lm
    elif method == 'quadratic':
        fn = run_quadratic
    elif method == 'loess':
        fn = run_loess

    return fn


def run(method=None, data=None, predictor=None, response=None, quadratic=None):
    if method is None or predictor is None or response is None or data is None:
        tangelo.http_status(400, 'Required argument missing')
        return None

    fn = select_method(method)
    if fn is None:
        tangelo.http_status(400, 'Required argument missing')
        return None

    if fn == run_quadratic:
        if quadratic is None:
            tangelo.http_status(400, 'Required argument missing')
            return None
        else:
            quadratic = json.loads(quadratic)

    data = json.loads(data)
    predictor = json.loads(predictor)
    response = json.loads(response)

    dataframe = make_frame(data)

    return str(fn(dataframe, response, predictor))
