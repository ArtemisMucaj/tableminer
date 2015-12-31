var Image = React.createClass({
  componentDidMount: function(){
    console.log("Mounted");
    var img = $(".img-layer");
    img.on('load', function(){
      console.log("Ready ...");
      $("#canvasLayer").attr({"height":img.height()+"px", "width":img.width()+"px"});
    });

  },
  render: function() {
    return (
        <div className="center margin">
          <div className="small-12 large-12 medium-12 columns">
            <h5> Choose area of interest ... and <button id="validate" className="button hollow"> Validate </button> </h5>
          </div>
          <div className="small-12 large-12 medium-12 columns">
            <img className="img-layer thumbnail" src={this.props.source} />
            <canvas className="canvas-layer" id="canvasLayer">
            </canvas>
          </div>
        </div>
    );
  }
});

module.exports = Image;
