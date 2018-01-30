from google.protobuf.json_format import MessageToJson
from google.protobuf.json_format import Parse
import grpc
import json
import re
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


def toConstCase(s):
    def corner_cases(tag):
        if tag == 'MULTI_CLASS':
            return 'MULTICLASS'
        else:
            return tag

    return corner_cases('_'.join(map(lambda x: x.upper(), re.findall('[a-zA-Z][^A-Z]*', s))))


def get_stub(port):
    channel = grpc.insecure_channel('localhost:%d' % (int(port)))
    stub = CoreStub(channel)

    return stub


def createPipeline(port=None, session=None, data=None, predictor=None, response=None, task_type=None, task_subtype=None, output_type=None, metric=None):
    stub = get_stub(int(port))

    data_uri = 'file://%s' % (data)

    predictor = json.loads(predictor)
    response = json.loads(response)


"""
message PipelineCreateRequest {
    SessionContext context = 1;
    string dataset_uri = 2;                     // URI pointing to a raw CSV file, or datasetDoc.json (indicating a D3M dataset).
    TaskType task = 3;
    TaskSubtype task_subtype = 4;               // can be set to NONE = 1
    string task_description = 5;                // textual description of the task, if available
    OutputType output = 6;
    repeated PerformanceMetric metrics = 7;     // specify a list of evaluation metrics
    repeated Feature target_features = 8; // specify a list of targets to predict
    repeated Feature predict_features = 9;// specify a list of predictor features to possibly include in model.  If omitted, use all features located in dataset_uri.
    int32 max_pipelines = 10;                   // optional maximum number of pipelines to return
                                                // Note that TA2 may still return more pipelines, so TA3 should keep a list
                                                // of the top results sorted by the relevant metric if required
}
"""


    resp = stub.CreatePipelines(cpb.PipelineCreateRequest(context=Parse(session, cpb.SessionContext()),
                                                          train_features=[cpb.Feature(feature_id=pred,
                                                                                      data_uri=data_uri) for pred in predictor],
                                                          target_features=[cpb.Feature(feature_id=targ,
                                                                                       data_uri=data_uri) for targ in response],
                                                          task=cpb.TaskType.Value(task_type.upper()),
                                                          task_subtype=cpb.TaskSubtype.Value(toConstCase(task_subtype)),
                                                          output=cpb.OutputType.Value(toConstCase(output_type)),
                                                          metrics=[cpb.Metric.Value(toConstCase(metric))],
                                                          task_description='TA2 pipeline creation',
                                                          max_pipelines=5))

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
