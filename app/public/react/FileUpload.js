var FileUpload = React.createClass({
  handleSubmit: function(e){
    e.preventDefault();
    // Show progressbar
    var progress = function(e){
      // show progress bar
      if(e.lengthComputable){
          var max = e.total;
          var current = e.loaded;
          var Percentage = (current * 100)/max;
          $(".progress"+"-meter").width(Percentage+'%')
          $(".progress"+"-meter-text").text(parseInt(Percentage)+'%')
          if(Percentage >= 100)
          {
             // var filename =   $("#filename").text();
             // console.log("finished");
             // process completed
          }
      }
    };
    $("#progressbar")[0].className = "progress";
    var file_data = new FormData(document.getElementById("uploadForm"));
    file_data.append("label", "WEBUPLOAD");
    $.ajax({
      url: "/upload",
      type: "POST",
      data: file_data,
      xhr: function() {
         var settings = $.ajaxSettings.xhr();
         if(settings.upload){
             settings.upload.addEventListener('progress',progress, false);
         }
         return settings;
      },
      enctype: 'multipart/form-data',
      processData: false,
      contentType: false
    }).done(function(data) {
        // run next step here : ask server side
        window.renderFile("uploads/"+data.toString());
        // console.log(window.fileToRender);
    });
  },
  showFilename: function(e){
    e.preventDefault();
    $("#filename").text(e.target.files[0].name);
  },
  render: function() {
    return (
      <div>
          <h5> Choose a file you want to extract a table from (image or pdf)</h5>
          <form id="uploadForm" method="post" encType="multipart/form-data" onSubmit={this.handleSubmit}>
            <label className="button hollow">
              <input className="hide" type="file" name="toConvert" onChange={this.showFilename}/>
              <span> Select a file </span>
            </label>
            <input className="button" type="submit" value="Upload" name="submit"/>
            <label id="filename"></label>
          </form>
          <div id="progressbar" className="progress hide" role="progressbar">
            <div className="progress-meter">
              <p className="progress-meter-text"> 0 % </p>
            </div>
          </div>
      </div>
    );
  }
});

module.exports = FileUpload;
