import cv2
import re

from Content import Content


class TableFactory(object):
    """docstring for TableFactory"""
    def __init__(self, path):
        super(TableFactory, self).__init__()
        self.path = path
        self.image = cv2.imread(self.path)
        self.image_display = self.image.copy()
        self.gray = self.__prepare_image_gray()
        self.gray_display = self.gray.copy()
        self.content_extractor = Content()
        self.tree_of_content = self.content_extractor.paris_dichotomie(self.image, self.gray)

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

    def serialize(self):
        pass

    def deserialize(self):
        pass

    def drawing_image_cv2(self):
        self.image_display = self.image.copy()
        self.tree_of_content.display_only_leaf_cv2(self.image_display)


def main():
    T = TableFactory("test/table.png")
    # clean output
    T.tree_of_content.remove_useless_leaf()
    T.tree_of_content.sort_subtree_by_frame()

    T.tree_of_content.compute_cores()
    csv = T.tree_of_content.ocr_me(T.image)

    print("Done computing ...")

    f = open("ans.csv",'w')
    for y in range(0,len(csv)):
        for x in range(0,len(csv[y])):
            if x == 0:
                f.write(re.sub('\n|;','',csv[y][x]))
            else:
                f.write(";")
                f.write(re.sub('\n|;','',csv[y][x]))
            pass
        f.write("\n")
        pass
    f.close()
    pass

    T.drawing_image_cv2()
    cv2.imshow("Image", T.image_display)
    cv2.waitKey(0)

if __name__ == '__main__':
    main()
