# import pickle
import cv2
import numpy as np

from Projection import Projection
from Content import Content


class ImageFactory(object):
    def __init__(self):
        super(ImageFactory, self).__init__()
        self.path = None
        self.image = None
        self.gray = None
        self.feature_extractor = Projection()
        self.content_extractor = Content()
        self.content_list = None
        self.feature_list = np.array([])
        self.class_list = np.array([])
        # for display purpose
        self.display = None

    def initialize(self, path_to_image):
        self.path = path_to_image
        self.image = cv2.imread(self.path)
        self.gray = self.__prepare_image_gray()
        self.content_list = self.content_extractor.new_leuven_dichotomie(self.image, self.gray)
        # run extract_features
        self.extract_features()

    def extract_features(self):
        length = len(self.content_list)
        self.feature_list = np.zeros((length,500))
        for x in range(0, length):
            subImage_tmp = self.image[self.content_list[x][0][1]:self.content_list[x][1][1]+1, self.content_list[x][0][0]:self.content_list[x][1][0]+1]
            subGray_tmp = self.gray[self.content_list[x][0][1]:self.content_list[x][1][1]+1, self.content_list[x][0][0]:self.content_list[x][1][0]+1]
            self.feature_list[x] = self.feature_extractor.compute(subImage_tmp, subGray_tmp)
            pass
        pass

    def __prepare_image_gray(self):
        gray = cv2.cvtColor(self.image, cv2.COLOR_BGR2GRAY)
        height,width,channel = self.image.shape
        for x in range(0,width):
            gray[0][x] = 255
            gray[height-1][x] = 255
        for y in range(0,height):
            gray[y][0] = 255
            gray[y][width-1] = 255
        for y in range(0,height):
            for x in range(0,width):
                if gray[y][x] >= 250:
                    gray[y][x] = 255
                    pass
                pass
            pass
        return gray

    def draw(self):
        self.display = self.image.copy()
        for x in range(0,len(self.class_list)):
            if self.class_list[x][1] == 1:
                self.display[self.content_list[x][0][1]:self.content_list[x][1][1]+1, self.content_list[x][0][0]:self.content_list[x][1][0]+1, 0] += 100
        for x in range(0,len(self.content_list)):
            cv2.rectangle(self.display, self.content_list[x][0], self.content_list[x][1], (255, 0, 0), 1)
