$(function() {
  $('a[href*=#]').on('click', function(e){
    e.preventDefault();
    $('html,body').animate({scrollTop:$(this.hash).offset().top}, 500);
  });

  if ($('#front').length) {
    var friend = $.getQueryParameters().friend;

    var data = {
      referral_id: friend,
      date_created: new Date().toISOString()
    }

    localStorage.setItem('friend', JSON.stringify(data));

    //////

    var joinButton = $('.join-submit');
    var joinEmail = $('.join-input');

    joinButton.on('click touchend', submitEmail)
    joinEmail.on('keydown', function(e){
      if (e.keyCode === 13) {
        submitEmail(e);
      }
    })

    function submitEmail(e) {
      e.preventDefault()
      toggleButtonState()
      if (joinEmail.val().length > 3) {
        $.ajax({
          method: "POST",
          url: "/api/v1/users",
          data: { email: joinEmail.val(), friend: friend },
          dataType: 'JSON'
        })
        .error(function(xhr) {
          emailError(xhr.status)
        })
        .success(function(usr) {
          localStorage.setItem('user', JSON.stringify(usr))
          window.location.href = "http://" + window.location.hostname + "/thankyou";
        })
      }
    }

    function emailError(code) {
      var msg = $('.join-msg')
      switch (code) {
        case 409:
          msg.text('This email address is already registered. You might try another one :)')
          break;
        case 400:
          msg.text('It doesn\'t look like you entered a valid email address. Try giving it another go')
          break;
        case 403:
          msg.text('You have registered too many email addresses on this IP address. Be sure to share with friends if you want more signups!')
          break;
        case 500:
          msg.text('There was an error on our side while registering your email. Try giving it another shot! We\'re so sorry.')
          break;
        default:
          msg.text('Something went wrong while registering your email. Could you give it another shot? Thanks!')
      }
      toggleButtonState()
    }

    function toggleButtonState() {
      if (joinButton.text().indexOf('Submitting') > -1) {
        joinButton.text('Step inside');
      } else {
        joinButton.text('Submitting...');
      }
    }
  }

  if ($('#thankyou').length) {
    var user = JSON.parse(localStorage.getItem('user'));
    var shareLink = $('.share-link')

    shareLink.val('http://startessential.com/?friend=' + user.referral_id)
    shareLink[0].setSelectionRange(0, 9999);
    shareLink.on('click touchend', function() {
      shareLink[0].setSelectionRange(0, 9999);
    })

    var user_id = $.getQueryParameters().id || user._id;

    $.ajax({
      method: "GET",
      url: "/api/v1/users/" + user_id,
      dataType: 'JSON'
    })
      .done(function(usr) {
        localStorage.setItem('user', JSON.stringify(usr))
        user = usr
        console.log(usr)
      })

    var option = $('.option');
    var dot = $('.dot-sec');
    for (i = 0; i < Math.ceil(user.friends.length/5); i++) {
      option.eq(i).addClass('yus');
      dot.eq(i).addClass('yus');
    }
  }
});

$.extend({
  getQueryParameters : function(str) {
	  return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
  }
});
