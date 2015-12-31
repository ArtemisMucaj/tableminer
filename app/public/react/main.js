var socket = io();
// js
window.fileToRender = "";

window.renderFile = function(str){
  // send data to server socket once the image is loaded
  obj = {
    "socketID":socket.id,
    "filename":str
  };
  socket.emit('requestContentBox', JSON.stringify(obj))
  // render
  window.fileToRender = str;
  ReactDOM.render(
    <Image source={str}  />,
    document.getElementById('content')
  );
};
// Load React classes
var Image = require('./Image');

var FileUpload = require('./FileUpload');

var SpreadsheetComponent = require('./Spreadsheet/spreadsheet');

// Default rendering
ReactDOM.render(
  <FileUpload />,
  document.getElementById('content')
);

// Display csv file
socket.on('csvFilepath', function(msg){
  console.log(msg);
  rows = msg.length - 1;
  columns = msg[0].length;
  var config = {
    // Initial number of row
    rows: rows,
    // Initial number of columns
    columns: columns,
    // True if the first column in each row is a header (th)
    hasHeadColumn: false,
    // True if the data for the first column is just a string.
    // Set to false if you want to pass custom DOM elements.
    isHeadColumnString: true,
    // True if the first row is a header (th)
    hasHeadRow: false,
    // True if the data for the cells in the first row contains strings.
    // Set to false if you want to pass custom DOM elements.
    isHeadRowString: true,
    // True if the user can add rows (by navigating down from the last row)
    canAddRow: false,
    // True if the user can add columns (by navigating right from the last column)
    canAddColumn: false,
    // Override the display value for an empty cell
    emptyValueSymbol: '-',
    // Fills the first column with index numbers (1...n) and the first row with index letters (A...ZZZ)
    hasLetterNumberHeads: true
  };
  initialData = [];
  for (var i = 0; i < msg.length - 1; i++) {
    initialData.push(msg[i])
  }
  // set data
  var data = {
    rows: initialData
  };
  // render
  ReactDOM.render(
   <SpreadsheetComponent initialData={data} config={config} spreadsheetId="1" />,
   document.getElementById('content')
  );
});

// Display Content boxes
socket.on('contentBox', function(msg){
  console.log(msg);
  var canvasLayer = $("#canvasLayer")[0];
  var ctx = canvasLayer.getContext("2d");
  var draw = function(){
    ctx.clearRect(0,0,canvasLayer.width,canvasLayer.height);
    msg["data"].forEach(function(elt){
      var top = elt["pos"][0];
      var bot = elt["pos"][1];
      var width = bot["x"] - top["x"];
      var height = bot["y"] - top["y"];
      ctx.lineWidth = 2;
      ctx.strokeRect(top["x"], top["y"], width, height)
      if (elt["class"][0] == "0.0"){
        ctx.fillStyle="rgba(243, 228, 0, 0.55)"
        ctx.fillRect(top["x"],top["y"],
        bot["x"] - top["x"],bot["y"] - top["y"])
      }
    });
  }
  // Draw boxes
  draw()
  // listen for mouse position and highlight the area
  // hightlight for good when clicked
  $("#canvasLayer").on('mousemove', function(event){
    bound = canvasLayer.getBoundingClientRect()
    cX = event.clientX - bound.left
    cY = event.clientY - bound.top
    draw()
    msg["data"].forEach(function(elt){
      var top = elt["pos"][0];
      var bot = elt["pos"][1];
      var width = bot["x"] - top["x"];
      var height = bot["y"] - top["y"];
      ctx.lineWidth = 2;
      ctx.strokeRect(top["x"], top["y"], width, height)
      if (cX >= top["x"] && cX <= bot["x"] &&
      cY >= top["y"] && cY <= bot["y"]){
          if (elt["class"][0] == "1.0"){
            ctx.fillStyle="rgba(243, 228, 103, 0.55)"
            ctx.fillRect(top["x"],top["y"],
            bot["x"] - top["x"],bot["y"] - top["y"])
          }
      }
    });
  });
  $("#canvasLayer").on('click', function(event){
    bound = canvasLayer.getBoundingClientRect()
    cX = event.clientX - bound.left
    cY = event.clientY - bound.top
    draw()
    msg["data"].forEach(function(elt){
      var top = elt["pos"][0];
      var bot = elt["pos"][1];
      var width = bot["x"] - top["x"];
      var height = bot["y"] - top["y"];
      ctx.lineWidth = 2;
      ctx.strokeRect(top["x"], top["y"], width, height)
      if (cX >= top["x"] && cX <= bot["x"] &&
      cY >= top["y"] && cY <= bot["y"]){
          if (elt["class"][0] == "1.0"){
            elt["class"][0] = "0.0"
            elt["class"][1] = "1.0"
            ctx.fillStyle="rgba(243, 228, 0, 0.55)"
            ctx.fillRect(top["x"],top["y"],
            bot["x"] - top["x"],bot["y"] - top["y"])
          }
          else if (elt["class"][0] == "0.0") {
            elt["class"][0] = "1.0"
            elt["class"][1] = "0.0"
          }
      }
    });
  });
  // On click on validate : emit event to nodejs server
  $("#validate").on("click", function(){
    $("#validate")[0].className="button hollow disabled";
    obj = {
      "socketID":socket.id,
      "filename":window.fileToRender,
      "contentBoxes":msg
    };
    socket.emit('requestCsv', JSON.stringify(obj));
    // remove mousemove and click event
    $("#canvasLaer").off()
    $("#validate").off()
  });
});
