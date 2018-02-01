from google.protobuf.json_format import MessageToJson
import grpc
import tangelo
import os

import core_pb2 as core_pb2
import core_pb2_grpc as core_pb2_grpc


@tangelo.restful
def post(port=None):
	# get the protocol version
	version = core_pb2.DESCRIPTOR.GetOptions().Extensions[core_pb2.protocol_version]

	# get the address from an environment variable.  This must be set in the executing shell.
	# During automated evaluation runs, the environment variable will be set by Kubernetes
	server_channel_address = os.environ.get('TA2_SERVER_CONN')

	# complain in the return if we didn't get an address to connect to
	if server_channel_address is None:
		tangelo.http_status(500)
		return {'error': 'TA2_SERVER_CONN environment variable is not set!'}

	#channel = grpc.insecure_channel('localhost:%d' % (int(port)))
	channel = grpc.insecure_channel(server_channel_address)
	stub = core_pb2_grpc.CoreStub(channel)

	resp = stub.StartSession(core_pb2.SessionRequest(user_agent='modsquad',
                                                version=version))

	return MessageToJson(resp)
