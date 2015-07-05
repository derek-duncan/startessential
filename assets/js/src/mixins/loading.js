module.exports = {
  getInitialState: function() {
    return {
      loading: false
    }
  },
  toggleLoading: function(value) {
    this.setState({
      loading: typeof value !== 'undefined' ? value : !this.state.loading
    });
  },
}

