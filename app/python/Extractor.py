import json

from ImageFactory import ImageFactory
from TableFactory import TableFactory

import re

import multiprocessing as mp
import zmq

import cv2
import numpy as np


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


def waitForUrls():
    # insantiate a subscriber
    context = zmq.Context()
    sub = context.socket(zmq.SUB)
    sub.setsockopt(zmq.SUBSCRIBE, b'')
    sub.connect("tcp://127.0.0.1:5555")
    # listen to urls and socketID
    while True:
        message = sub.recv()
        if message:
            obj = json.loads(str(message))
            print("msg")
            # print("socketID : "+str(obj["socketID"])+", filename : "+str(obj["filename"]))
            # run getContentBoxesWorker as a subprocess (be careful not to spawn
            # too many)
            subprocess = mp.Process(target=getContentBoxesWorker, args=(obj["socketID"], obj["filename"]))
            subprocess.start()
    pass


def waitForContentBoxes():
    # insantiate a subscriber
    context = zmq.Context()
    sub = context.socket(zmq.SUB)
    sub.setsockopt(zmq.SUBSCRIBE, b'')
    sub.connect("tcp://127.0.0.1:5557")
    while True:
        message = sub.recv()
        if message:
            obj = json.loads(str(message))
            # print("socketID : "+str(obj["socketID"])+", filename : "+str(obj["filename"])+", contentBoxes")
            path = "../public/"+obj["filename"].replace('_show','')
            img = cv2.imread(path)
            height, width, channels = img.shape
            if width > height:
                # subimage height is 500
                bottom = height
                ratio = 500.0/height
                pass
            else:
                # subimage width is 500
                bottom = width
                ratio = 500.0/width
                pass
            data = obj["contentBoxes"]
            for i in range(len(data["data"])):
                if data["data"][i]["class"][0] == u'0.0':
                    # create subimage and break the loop
                    x1 = data["data"][i]["pos"][0]["x"]
                    y1 = data["data"][i]["pos"][0]["y"]
                    x2 = data["data"][i]["pos"][1]["x"]
                    y2 = data["data"][i]["pos"][1]["y"]
                    # print("ratio : 500/"+str(bottom)+", ("+str(x1)+", "+str(y1)+"), ("+str(x2)+", "+str(y2)+")")
                    # print(ratio)
                    break
            # extract sub-image
            # subimage = image[self.frame[0][1]:self.frame[1][1],self.frame[0][0]:self.frame[1][0]]
            subimage = img[int(int(y1)*(1/ratio)):int(int(y2)*(1/ratio)), int(int(x1)*(1/ratio)):int(int(x2)*(1/ratio))]
            cv2.imwrite(path+"_sub.png",subimage)
            # run getCsvFileWorker as a subprocess (be careful not to spawn
            # too many)
            subprocess = mp.Process(target=getCsvFileWorker, args=(obj["socketID"], path+"_sub.png"))
            subprocess.start()
            subprocess.join()
    pass


def getCsvFileWorker(socketID, filename):
    # instantiate a publisher
    print("connection with port 5558 established")
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind("tcp://127.0.0.1:5558")
    # tableFactory
    print("running csv file worker")
    csv = TableFactory(filename)
    # preprocess tree of content
    csv.tree_of_content.remove_useless_leaf()
    csv.tree_of_content.sort_subtree_by_frame()
    # extract text
    csv.tree_of_content.compute_cores()
    csv_string = csv.tree_of_content.ocr_me(csv.image)
    # create and save to csv file
    csv_filepath = filename.replace('png','csv')
    f = open(csv_filepath,'w')
    for y in range(0,len(csv_string)):
        for x in range(0,len(csv_string[y])):
            if x == 0:
                f.write(re.sub('\n|;','',csv_string[y][x]))
            else:
                f.write(";")
                f.write(re.sub('\n|;','',csv_string[y][x]))
            pass
        f.write("\n")
        pass
    f.close()
    print("sending message ...")
    # send csv file's path to nodejs server
    # json_string = '{"socketID":"'+socketID+'", "csv":{"csv_filepath" :"'+csv_filepath+'","csv_string":"'+json.dumps(csv_string)+'"}}'
    json_string = '{"socketID":"'+socketID+'", "csv":{"csv_filepath" :"'+csv_filepath+'"}}'
    print("json string generated ...")
    socket.send_string(json_string)
    print(json_string)
    print("sent ...")
    pass


def getContentBoxesWorker(socketID, filename):
    # instantiate a publisher (send to nodejs server)
    context = zmq.Context()
    socket = context.socket(zmq.PUB)
    socket.bind("tcp://127.0.0.1:5556")
    # msg["socketID"] is clientID, msg["filename"] is path
    Im = ImageFactory()
    path = "../public/"+filename
    Im.initialize(path)
    # initialize class_list
    Im.class_list = np.zeros((len(Im.feature_list), 2))
    for x in range(0,len(Im.feature_list)):
        Im.class_list[x][0] = 1.0
    # create JSON string before ...
    json_string = '{"socketID":"'+socketID+'", "contentBoxes" :'+tojson([Im.content_list, Im.class_list])+'}'
    socket.send_string(json_string)
    pass


def main():
    # processes = [mp.Process(target=self.worker, args=(x, inputs, output)) for x in range(4)]
    # qUrl = mp.Queue()

    # run as a subprocess
    process = mp.Process(target=waitForUrls, args=())
    process_csv = mp.Process(target=waitForContentBoxes, args=())

    process.start()
    process_csv.start()

    # while True:
    #     pass

    process.join()
    process_csv.join()

    pass

if __name__ == '__main__':
    main()
