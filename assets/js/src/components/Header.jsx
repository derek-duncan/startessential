// Requires
var { Link } = Router;

// Components
var SaveCounter = require('../components/SaveCounter.jsx');
var Message = require('../components/Message.jsx');

var Header = React.createClass({
  render: function() {
    return (
      <header className='header'>
        <div className='saving-overlay'>
          <div className='saving-overlay-text'>
            <Message />
          </div>
        </div>
        <div className='header-content'>
          <div className='logo-wrap'>
            <Link to='explore' title='Start Essential Logo'>
              <img className='logo' src='/images/logo-color.png' width='150' />
            </Link>
          </div>
          <nav className='nav'>
            <SaveCounter />
            <ul className='nav-list'>
              <li className='nav-item' id='#posts-link'>
                <Link to='explore'>Explore</Link>
              </li>
              <li className='nav-item' id='#account-link'>
                <Link to='account'>Account</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    )
  }
})

module.exports = Header;
