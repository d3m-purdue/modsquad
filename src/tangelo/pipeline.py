from google.protobuf.json_format import MessageToJson
from google.protobuf.json_format import Parse
import grpc
import json
import tangelo

import core_pb2 as cpb
from core_pb2_grpc import CoreStub

@tangelo.restful
def post(port=None, session=None, data=None, predictor=None, response=None):
    channel = grpc.insecure_channel('localhost:%d' % (int(port)))
    stub = CoreStub(channel)

    data_uri = 'file://%s' % (data)

    predictor = json.loads(predictor)
    response = json.loads(response)

    resp = stub.CreatePipelines(cpb.PipelineCreateRequest(context=Parse(session, cpb.SessionContext()),
                                                          train_features=[cpb.Feature(feature_id=pred,
                                                                                      data_uri=data_uri) for pred in predictor],
                                                          target_features=[cpb.Feature(feature_id=targ,
                                                                                       data_uri=data_uri) for targ in response],
                                                          task=cpb.TaskType.Value('REGRESSION'),
                                                          task_description='Linear model creation'))

    # TODO - send back all the responses using a tangelo stream
    r = None
    for r in resp:
        if r.pipeline_id:
            break

    return MessageToJson(r)
