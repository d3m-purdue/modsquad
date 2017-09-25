import tangelo

@tangelo.restful
def post(session=None, data=None, predictor=None, response=None):
    data_uri = 'file://%s' % (data)
    return {'context': session,
            'train_features': [{'feature_id': predictor,
                                'data_uri': data_uri}],
            'target_features': [{'feature_id': response,
                                 'data_uri': data_uri}]}

