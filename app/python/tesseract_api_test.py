import os
import sys
import ctypes
from ctypes import pythonapi, util, py_object

import cv2

# Demo variables
lang = "eng"
output = "dump.config"
filename = "test/table.png"
libpath = "/usr/local/lib/"
tessdata = "/usr/local/share/"

libname = libpath + "libtesseract.so.3.0.2"
libname_alt = "libtesseract.so.3"

try:
	tesseract = ctypes.cdll.LoadLibrary(libname)
except:
	tesseract = ctypes.cdll.LoadLibrary(libname_alt)

tesseract.TessVersion.restype = ctypes.c_char_p
tesseract_version = tesseract.TessVersion()

print("Found tesseract-ocr library version %s." % tesseract_version)

api = tesseract.TessBaseAPICreate()

rc = tesseract.TessBaseAPIInit3(api, tessdata, lang)
if (rc):
	tesseract.TessBaseAPIDelete(api)
	print("Could not initialize tesseract.\n")
	exit(3)

img = cv2.imread(filename)

subimage = img[0:100][0:70]

# cv2.imshow('Img', subimage)
# cv2.waitKey(0)

height, width, channels = subimage.shape
print(str(height)+", "+str(width))
bytesPerPixel = channels

data = str(subimage.data)

tess_set_image = tesseract.TessBaseAPISetImage(api, data, width, height, bytesPerPixel, bytesPerPixel*width)
text_out = tesseract.TessBaseAPIGetUTF8Text(api)
result = ctypes.string_at(text_out)
print(result)
