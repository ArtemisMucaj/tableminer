import cv2
# import numpy as np


class Feature(object):
    """docstring for Feature"""
    def __init__(self):
        super(Feature, self).__init__()

    def ouverture(self,matrice,kernel, itera):
        matriceTmp = cv2.erode(matrice, kernel, iterations=itera)
        return cv2.dilate(matriceTmp, kernel, iterations=itera)

    def fermeture(self,matrice,kernel, itera):
        matriceTmp = cv2.dilate(matrice, kernel, iterations=itera)
        return cv2.erode(matriceTmp, kernel, iterations=itera)
