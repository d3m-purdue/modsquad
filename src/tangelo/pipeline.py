from google.protobuf.json_format import MessageToJson
from google.protobuf.json_format import Parse
import grpc
import json
import tangelo
import time

import core_pb2 as cpb
from core_pb2_grpc import CoreStub


@tangelo.restful
def post(op='', **kwargs):
    if op == '':
        return createPipeline(**kwargs)
    elif op == 'execute':
        return executePipeline(**kwargs)
    elif op == 'export':
        return exportPipeline(**kwargs)
    else:
        tangelo.http_status(404)


def get_stub(port):
    channel = grpc.insecure_channel('localhost:%d' % (int(port)))
    stub = CoreStub(channel)

    return stub


def createPipeline(port=None, session=None, data=None, predictor=None, response=None):
    stub = get_stub(int(port))

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

    return map(lambda x: json.loads(MessageToJson(x)), resp)


def executePipeline(port=None, session=None, pipeline=None, data=None, predictor=None):
    stub = get_stub(int(port))

    data_uri = 'file://%s' % (data)

    predictor = json.loads(predictor)

    resp = stub.ExecutePipeline(cpb.PipelineExecuteRequest(context=Parse(session, cpb.SessionContext()),
                                                           pipeline_id=pipeline,
                                                           predict_features=[cpb.Feature(feature_id=pred,
                                                                                         data_uri=data_uri) for pred in predictor]))

    return map(lambda x: json.loads(MessageToJson(x)), resp)


def exportPipeline(port=None, session=None, pipeline=None):
    stub = get_stub(int(port))

    exec_name = '%s-%s-%f.exe' % (session, pipeline, time.time())
    exec_uri = 'file://%s' % (exec_name)

    resp = stub.ExportPipeline(cpb.PipelineExportRequest(context=Parse(session, cpb.SessionContext()),
                                                         pipeline_id=pipeline,
                                                         pipeline_exec_uri=exec_uri))

    return map(lambda x: json.loads(MessageToJson(x)), resp)
