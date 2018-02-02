from google.protobuf.json_format import MessageToJson
from google.protobuf.json_format import Parse
import grpc
import json
import re
import tangelo
import time
import os

import core_pb2 as core_pb2
import core_pb2_grpc as core_pb2_grpc

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


def toConstCase(s):
    def corner_cases(tag):
        if tag == 'MULTI_CLASS':
            return 'MULTICLASS'
        else:
            return tag

    return corner_cases('_'.join(map(lambda x: x.upper(), re.findall('[a-zA-Z][^A-Z]*', s))))


def get_stub():
  server_channel_address = os.environ.get('TA2_SERVER_CONN')
  # complain in the return if we didn't get an address to connect to
  if server_channel_address is None:
    tangelo.http_status(500)
    return {'error': 'TA2_SERVER_CONN environment variable is not set!'}
  channel = grpc.insecure_channel(server_channel_address)
  stub = core_pb2_grpc.CoreStub(channel)
  return stub



def createPipeline(context=None, data_uri=None, task_type=None, task_subtype=None, target_features=None, predict_features=[],metrics=None,max_pipelines=10):

  stub = get_stub()
  task = cpb.TaskType.Value(task_type.upper())
  taskSubtype = cpb.TaskSubtype.Value(toConstCase(task_subtype))

  #metrics = cpb.Metric.Value(toConstCase(metrics))
  metrics=[
    core_pb2.ACCURACY,
    core_pb2.ROC_AUC,
    core_pb2.F1,
    core_pb2.ROOT_MEAN_SQUARED_ERROR
  ]

  print target_features

  
  
  #targets = [cpb.Feature(resource_id=targ['targetIndex'],feature_name=targ['colName']) for targ in target_features]
  targets = [core_pb2.Feature(resource_id='0',feature_name='out1')]

  resp = stub.CreatePipelines(cpb.PipelineCreateRequest(context=(cpb.SessionContext(context)),
                                                          dataset_uri=data_uri,
                                                          task=task,
                                                          task_subtype=taskSubtype,
                                                          metrics=metrics,
                                                          task_description='Modsquad pipeline create request',
                                                          target_features=targets,                                                       
                                                          predict_features=[],
                                                          max_pipelines=10))

  return map(lambda x: json.loads(MessageToJson(x)), resp)



def executePipeline(port=None, session=None, pipeline=None, data=None, predictor=None):
    stub = get_stub()

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
