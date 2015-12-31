import cv2
import sys
import numpy as np

import json

from Kppv import Kppv

from ImageFactory import ImageFactory

import multiprocessing as mp


class CorePy(object):
    def __init__(self, path, predictorType):
        super(CorePy, self).__init__()
        self.image = ImageFactory()
        self.path = path
        if predictorType == "kppv":
            self.predictor = Kppv()
        # elif predictorType == "mlp":
        #    self.predictor = Mlp()
        else:
            self.predictor = None
        self.max_distance = 0

    def setImage(self, path_to_image):
        self.image.initialize(path_to_image)

    def predict_current(self):
        predicted_classes, result = np.zeros((len(self.image.feature_list), 2)), 0
        for x in range(0,len(self.image.feature_list)):
            predicted_classes[x], distance = self.predictor.predict(self.image.feature_list[x])
            result += predicted_classes[x]
            if distance >= 0:
                self.max_distance = max(self.max_distance, distance)
        self.image.class_list = predicted_classes
        pass

    def train_predictor(self):
        self.predictor.train(self.image.feature_list, self.image.class_list)


def run(path,Core):
    # set new image - this will compute the features
    Core.setImage(path)
    Core.predict_current()
    pass


def getContentBoxes(path, Core):
    Core.setImage(path)
    pass


# {
# 	"data": [{
# 	  "positions":[{"x":"0", "y":"0"},{"x":"0", "y":"0"}],
# 	  "class":{"0":"0", "1":"1"}
# 	},
# 	{  "positions":[{"x":"0", "y":"0"},{"x":"0", "y":"0"}],
# 	  "class":{"0":"0", "1":"1"}
# 	}]
# }
def tojson(data):
    length = len(data[0])
    json_string = '{"data":['
    for x in range(0,length):
        pos, classe = data[0][x], data[1][x]
        # sys.stdout.write(str(pos)+ " / ")
        # sys.stdout.write("x top : "+str(pos[0][0])+", y  top: "+str(pos[0][1])+", x bot : "+str(pos[1][0])+", y  bot : "+str(pos[1][1])+"\n")
        json_string += '{"pos":[{"x":"'+str(pos[0][0])+'", "y":"'+str(pos[0][1])+'"},{"x":"'+str(pos[1][0])+'","y":"'+str(pos[1][1])+'"}],'+'"class":["'+str(classe[0])+'","'+str(classe[1])+'"]}'
        if x != length - 1:
            json_string += ','
        pass
    json_string += ']}'
    return json_string


def update_class_list(output, cor):
    for i in range(len(output["data"])):
        if output["data"][i]["class"][0] == u'0.0':
            cor.image.class_list[i][0] = 0
            cor.image.class_list[i][1] = 1


def waitForUrls(qUrl):
    # listen to urls and socketID
    # qUrl.put data
    # if getContentBoxesWorker isn't running, run it
    pass


def waitForContentBoxes(qBoxes):
    # wait for incomming content boxes + socketID from nodejs server
    # qBoxes.put data
    # if getCsvFileWorker isn't running, run it
    pass


def getCsvFileWorker(Core, qBoxes):
    pass


def getContentBoxesWorker(Core, qUrl):
    while True:
        if qUrl.empty():
            # better break here to be honest
            pass
        else:
            # get arguments from qUrl
            args = qUrl.get()
            # args[0] : socketId, args[1] : url
            getContentBoxes(Core, args[1])
            # send [args[0], tojson([Core.image.content_list, Core.image.class_list])] to nodejs server
        qUrl.task_done()
    pass


def main():
    # import Queue
    import Queue
    Core = CorePy("","kppv")

    processes = [mp.Process(target=self.worker, args=(x, inputs, output)) for x in range(4)]

    urls = Queue()

    # get urls and add to queue
    getUrls = Talk(1)

    # send content boxes
    sendContentBoxes = Talk(1)

    # recieve selected content boxes
    # extract sub-images from the higher dimension Image
    # see TableFactory.py for the rest

    # once we have the csv file -> send it back

    url = ""
    getContentBoxes(Core,url)
    sendContentBoxes.send("content boxes")



    # Core = CorePy("","kppv")
    # sys.stdout.write("CorePy initialized ...\n")
    # send_to_electron = Talk(1)
    #
    # send_to_electron.send(b'SYNC')
    #
    # urls = send_to_electron.recv()
    # urls = json.loads(urls)
    #
    # sys.stdout.write("\nNumber of files: "+str(len(urls)))
    # sys.stdout.write(str(urls))
    #
    # for i in range(0, len(urls)):
    #     run(urls[i], Core)
    #     data = tojson([Core.image.content_list, Core.image.class_list])
    #     # send data to electron and receive output
    #     send_to_electron.send(str(data))
    #     output = send_to_electron.recv()
    #     # get the right format!
    #     output = json.loads(output)
    #     update_class_list(output,Core)
    #     Core.train_predictor()
    #
    # send_to_electron.close()
    pass

if __name__ == '__main__':
    # publish data using zeroMQ
    from Talk import Talk
    main()
