import cv2
import numpy as np

from Feature import Feature


class Projection(Feature):
    def __init__(self):
        super(Projection, self).__init__()

    def compute(self,img,gray):
        # matrice = cv2.Canny(gray, 150, 255, apertureSize=3)
        ret, matrice = cv2.threshold(gray,150,255,cv2.THRESH_BINARY)
        matrice = cv2.Laplacian(matrice, cv2.CV_8U)

        kernel = np.matrix('1; 1; 1')
        matriceVerti = super(Projection, self).ouverture(matrice,kernel,10)
        kernel = np.matrix('1 1 1')
        matriceVerti = super(Projection, self).fermeture(matriceVerti,kernel,1)

        kernel = np.matrix('1 1 1')
        matriceHori = super(Projection, self).ouverture(matrice,kernel,10)
        kernel = np.matrix('1; 1; 1')
        matriceHori = super(Projection, self).fermeture(matriceHori,kernel,1)

        # cv2.imshow('image', matriceHori)
        # cv2.waitKey(0)
        features = np.zeros(100*5)
        height, width = matrice.shape
        cptFeatures = 0
        # Blue
        ans = cv2.calcHist([img], [0], None, [100], [20, 236])
        for x in range(0, len(ans)):
            features[cptFeatures] = 100*ans[x][0]/float(height*width)
            cptFeatures += 1
            pass
        # Green
        ans = cv2.calcHist([img], [1], None, [100], [20, 236])
        for x in range(0, len(ans)):
            features[cptFeatures] = 100*ans[x][0]/float(height*width)
            cptFeatures += 1
            pass
        # Red
        ans = cv2.calcHist([img], [2], None, [100], [20, 236])
        for x in range(0, len(ans)):
            features[cptFeatures] = 100*ans[x][0]/float(height*width)
            cptFeatures += 1
            pass
        # Ligne Horizontal and Vertical not in the same histo
        ans = np.zeros(height + width)
        for i in range(0, height):
            for j in range(0, width):
                ans[i] += matriceHori[i][j]
                ans[j + height] += matriceVerti[i][j]
        # Horizontal
        hist = np.histogram(ans[0:height], bins=100, range=(255, 255*width))[0]
        for x in range(0, len(hist)):
            features[cptFeatures] = 100*hist[x]/float(width)
            cptFeatures += 1
            pass
        # Vertical
        hist = np.histogram(ans[height:height + width], bins=100, range=(255, 255*height))[0]
        for x in range(0, len(hist)):
            features[cptFeatures] = 100*hist[x]/float(height)
            cptFeatures += 1
            pass

        return features


def main():
    projection = Projection()
    img = cv2.imread('images/test.tif')
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hist = projection.compute(img,gray)
    # show
    plt.plot(hist)
    plt.show()
    pass

if __name__ == '__main__':
    import matplotlib.pyplot as plt
    main()
