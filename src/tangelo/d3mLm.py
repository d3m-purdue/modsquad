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


def run(method=None, data=None, **kwargs):
    if data is None:
        tangelo.http_status(400, 'Required argument missing')
        return None

    fn = select_method(method)
    if fn is None:
        tangelo.http_status(400, 'Required argument missing')
        return None

    data = json.loads(data)
    dataframe = make_frame(data)

    if fn == run_quadratic:
        predictor_variables = kwargs.get('predictor_variables')
        response = kwargs.get('response')
        quadratic_variables = kwargs.get('quadratic_variables')

        if predictor_variables is None or response is None or quadratic_variables is None:
            tangelo.http_status(400, 'Required argument missing')
            return None

        args = map(json.loads, [response, predictor_variables, quadratic_variables])
    elif fn in [run_lm, run_loess]:
        predictor_variables = kwargs.get('predictor_variables')
        response = kwargs.get('response')

        if predictor_variables is None or response is None:
            tangelo.http_status(400, 'Required argument missing')
            return None

        args = map(json.loads, [response, predictor_variables])
    else:
        tangelo.http_status(500, 'Impossible condition')

    return str(fn(dataframe, *args))
