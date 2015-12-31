import pickle
from Predictor import Predictor
from keras.models import Sequential
from keras.layers.core import Dense, Dropout, Activation
from keras.optimizers import SGD
import numpy as np


class Mlp(Predictor):
    """docstring for Mlp"""
    def __init__(self, config=None):
        super(Mlp, self).__init__()
        if config == None:
            self.__model = Sequential()
            # Dense(64) is a fully-connected layer with 64 hidden units.
            # in the first layer, you must specify the expected input data shape
            self.__model.add(Dense(128, input_dim=500, init='uniform'))
            self.__model.add(Activation('tanh'))
            self.__model.add(Dropout(0.5))
            self.__model.add(Dense(128, init='uniform'))
            self.__model.add(Activation('tanh'))
            self.__model.add(Dropout(0.5))
            self.__model.add(Dense(128, init='uniform'))
            self.__model.add(Activation('tanh'))
            self.__model.add(Dropout(0.5))
            self.__model.add(Dense(128, init='uniform'))
            self.__model.add(Activation('tanh'))
            self.__model.add(Dropout(0.5))
            self.__model.add(Dense(2, init='uniform'))
            self.__model.add(Activation('softmax'))

            sgd = SGD(lr=0.1, decay=1e-6, momentum=0.9, nesterov=True)
            self.__model.compile(loss='mean_squared_error', optimizer=sgd)
        else:
            # On charge une sauvegarde
            pass

    def train(self, datas, classes):
        new_datas = np.resize(self.datas, (len(self.datas)+len(datas),500))
        new_datas[0:len(self.datas)] = self.datas
        new_datas[len(self.datas):len(self.datas)+len(datas)] = datas
        self.datas = new_datas

        new_classes = np.resize(self.classes, (len(self.classes)+len(classes),2))
        new_classes[0:len(self.classes)] = self.classes
        new_classes[len(self.classes):len(self.classes)+len(classes)] = classes
        self.classes = new_classes

        self.__model.fit(self.datas, self.classes, nb_epoch=100, batch_size=200)
        self.is_train_once = True

    def test():
        pass

    def predict(self, data):
        if self.is_train_once:
            classe = self.__model.predict_classes(np.array([data]))
            print(classe)
            if classe == 1:
                return (0,1)
            else:
                return (1,0)
        else:
            return (1,0)

    def serialize():
        pass

    def deserialize():
        pass
