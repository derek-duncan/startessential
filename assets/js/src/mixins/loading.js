module.exports = {
  getInitialState: function() {
    return {
      loading: false
    }
  },
  toggleLoading: function() {
    this.setState({
      loading: !this.state.loading
    });
  },
}

