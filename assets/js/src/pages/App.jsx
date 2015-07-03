var { Link, RouteHandler, Navigation } = Router;

var App = React.createClass({
  render: function() {
    return (
      <div>
        <div id='fb-root'></div>
        <h1>Welcome to Start Essential</h1>
        <RouteHandler {...this.props} />
      </div>
    )
  }
})

module.exports = App;
