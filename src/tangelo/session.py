from google.protobuf.json_format import MessageToJson
import grpc
import tangelo

import core_pb2 as cpb
from core_pb2_grpc import CoreStub

version = cpb.DESCRIPTOR.GetOptions().Extensions[cpb.protocol_version]

@tangelo.restful
def post(port=None):
    channel = grpc.insecure_channel('localhost:%d' % (int(port)))
    stub = CoreStub(channel)

    resp = stub.StartSession(cpb.SessionRequest(user_agent='modsquad',
                                                version=version))

    return MessageToJson(resp)
