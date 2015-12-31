import numpy as np


class Predictor(object):
	"""docstring for Predictor"""
	def __init__(self):
		super(Predictor, self).__init__()
		self.datas = np.zeros((0,500))
		self.classes = np.zeros((0,2))
