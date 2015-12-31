var express = require('express');
var multer = require('multer');

var sharp = require('sharp');

var upload =  multer({ dest: './public/uploads/'});

var router = express.Router();

// use sharp to resize image when uploaded (for a smaller format)

router.post('/', function(req,res){
  (upload.single('toConvert'))(req, res, function (err) {
   if (err) {
     return res.send("Error uploading file.");
   }
   // return filename and use it as identifier
   // console.log(req);
   image = sharp('./public/uploads/'+req.file.filename);
   image.metadata().then(function(metadata){
     // metadata
     width = metadata.width;
     height = metadata.height;
     if (width > height){
       // resize with 500 of height
       image.resize(null, 500).toFile('./public/uploads/'+req.file.filename+'_show',function(err){
         return res.send(req.file.filename+'_show')
       })
     }
     else{
       // resize with 500 of height
       image.resize(500, null).toFile('./public/uploads/'+req.file.filename+'_show',function(err){
         return res.send(req.file.filename+'_show')
       })
     }
   });
   // return res.send(req.file.filename);
   // return res.send("File uploaded.");
 });
});

module.exports = router;
