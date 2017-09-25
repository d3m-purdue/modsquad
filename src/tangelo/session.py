import tangelo

@tangelo.restful
def post():
    return {'user_agent': 'modsquad',
            'version': 'version'}
