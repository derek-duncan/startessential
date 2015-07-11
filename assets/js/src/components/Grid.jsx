// Require
var { Link } = Router;
var MasonryMixin = require('react-masonry-mixin');
var moment = require('moment');

// Util
var isSaved = require('../util/isSaved.js');

var masonryOptions = {
  transitionDuration: 0
};

var Grid = React.createClass({
  mixins: [MasonryMixin('grid', masonryOptions)],
  getDefaultProps: function() {
    return {
      items: []
    }
  },
  handleClick: function(graphic_id) {
    Actions.saveGraphic(graphic_id, AuthStore.auth.uid);
  },
  getGraphicsToRender: function() {
    var self = this;
    var cx = require('classnames');
    return this.props.items.map(function(item) {
      var saveStatus = isSaved(item._id);
      var graphicClass = cx({
        'grid-item': true,
        'saved': saveStatus
      });
      return (
        <div className={graphicClass} key={item._id}>
          <div className='graphic-inner'>
            <div className='graphic-image-wrap'>
              <img className='graphic-image' src={item.image.small.Location} width='200' />
            </div>
            <div className='graphic-info'>
              <h4 className='graphic-title'>{item.title}</h4>
              <div className='graphic-tags'>
                <span className='graphic-category'>{item.category}</span>
                <span>&nbsp;|&nbsp;</span>
                <span className='graphic-date'>{moment(item.date_created).fromNow()}</span>
              </div>
              <div className='graphic-actions'>
                <Link className='graphic-link' to='graphic' params={{ graphic_url: item.url_path }}>View Graphic</Link>
                <button className='graphic-save' disabled={saveStatus ? 'disabled' : false} onClick={saveStatus ? false : self.handleClick.bind(null, item._id)}>{saveStatus ? 'Saved' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )
    })
  },
  render: function() {
    var self = this;

    return (
      <div ref='grid' className='grid'>
        <div className='gutter-sizer'></div>
        {self.getGraphicsToRender()}
      </div>
    )
  }
})

module.exports = Grid;

