import json
import rpy2.robjects
import tangelo

fn = rpy2.robjects.r('''fn <- function(dt, response, preds) {
  formu <- as.formula(paste(response, "~", paste(preds, collapse = " + ")))
  mod <- lm(formu, data = dt)
  d3mLm::extract_lm(mod)$as_json()
}''')


def make_frame(data):
    return rpy2.robjects.r['iris']


@tangelo.types(data=json.loads, predictor=json.loads, response=json.loads)
def run(data=None, predictor=None, response=None):
    if predictor is None or response is None or data is None:
        return None

    dataframe = make_frame(data)

    return json.loads(str(fn(dataframe, response, predictor)))
