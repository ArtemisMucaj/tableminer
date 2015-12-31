import zmq
import sys


class Talk(object):
    def __init__(self, expected_subscribers):
        self.context = zmq.Context()
        self.responder = self.context.socket(zmq.REP)
        # setup pub and syncservice
        self.setup()
        self.wait_for_sync()

    def setup(self):
        # Setup publisher
        self.responder.bind('tcp://*:8888')

    def wait_for_sync(self):
        sys.stdout.write("Waiting for sync ...\n")
        # wait for sync request
        self.responder.recv()

    def close(self):
        self.responder.close()
        self.context.term()

    def send(self, message):
        self.responder.send(message)

    def recv(self):
        return self.responder.recv()
