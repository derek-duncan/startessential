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

    var joinFacebook = $('.join-facebook');
    joinFacebook.attr('href', joinFacebook.attr('href') + '?friend=' + data.referral_id)

    //////

    var joinButton = $('.join-submit');
    var joinEmail = $('.join-input');

    joinButton.on('click touchend', submitEmail)
    joinEmail.on('keydown', function(e){
      if (e.keyCode === 13) {
        submitEmail(e);
      }
    })

    // Steps //
    var step = $('.howto-step')
    var stepNumber = step.find('.step-number')
    stepNumber.css({
      height: stepNumber.outerWidth()
    });
    $(window).resize(function() {
      stepNumber.css({
        height: stepNumber.outerWidth()
      });
    })

    // GA Events //
    var ctaTop = $('.cta-top');
    var joinSubmit = $('.join-submit');

    ctaTop.on('click touchend', function(e) {
      console.log('clicked')
      ga('send', 'event', 'button', 'click', 'top cta')
    })
    joinSubmit.on('click touchend', function(e) {
      ga('send', 'event', 'button', 'click', 'join submit')
    })

    function submitEmail(e) {
      e.preventDefault()
      if (joinEmail.val().length > 3) {
        toggleButtonState()
        $.ajax({
          method: "POST",
          url: "/api/v1/users",
          data: { email: joinEmail.val(), friend: friend },
          dataType: 'JSON',
          headers: {
            'Authorization': 'Bearer 123'
          }
        })
        .error(function(xhr) {
          console.log(xhr);
          _emailError(xhr.status)
        })
        .success(function(usr) {
          localStorage.setItem('user', JSON.stringify(usr))
          window.location.href = "http://" + window.location.hostname + "/thankyou";
        })
      }
    }

    function _emailError(code) {
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
        case 401:
          msg.text('Invalid credentials')
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
    })

    var option = $('.option');
    var dot = $('.dot-sec');
    for (i = 1; i <= user.friends.length; i++) {
      var k = Math.floor(i/5)*5;
      if (k % 5 == 0 && k !== 0) {
        var index = k / 5 - 1;
        option.eq(index).addClass('yus');
        dot.eq(index).addClass('yus');
      }
    }

    var shareStatus = $('.share-status');
    if (user.friends.length) {
      var plural;
      if (user.friends.length === 1) {
        plural = ' friend has joined!'
      } else {
        plural = ' friends have joined!'
      }
      shareStatus.text(user.friends.length + plural + ' Great job... you\'re getting closer to the prize!');
    }
    // GA Events //
    var shareFB = $('.share-fb');
    var shareTW = $('.share-tw');
    var shareLink = $('.share-link');

    shareFB.on('click touchend', function(e) {
      ga('send', 'event', 'share', 'click', 'facebook')
    })
    shareTW.on('click touchend', function(e) {
      ga('send', 'event', 'share', 'click', 'twitter')
    })
  }
});

if ($('#post').length) {
  // var mnInput = $('.member-number');
  // var postNow = $('.post-now');
  // var lsNumber = localStorage.getItem('memberNumber') || '';
  // if (lsNumber.length) {
  //   mnInput.val(lsNumber);
  // } else {
  //   postNow.on('click touchend', function(e) {
  //     localStorage.setItem('memberNumber', mnInput.val());
  //   })
  // }
}

if ($('#posts').length) {
  var post = $('.post');
  var postImageWrap = post.find('.post-image-wrap');

  $('img').load(function() {
    postImageWrap.each(function() {
      var wrap = $(this);
      var wrapHeight = $(this).outerHeight();
      var postImage = wrap.find('.post-image');
      var postImageHeight = postImage.height()
      postImage.css({
        top: 'auto',
        bottom: -postImageHeight + wrapHeight
      })
      if (postImageHeight > wrapHeight) {
        var heightDifference = postImageHeight - wrapHeight
        if ($('html.no-touch').length) {
          wrap.hover(function() {
            postImage.toggleClass('scroll')
          })
        } else {
          wrap.on('touchend', function() {
            postImage.toggleClass('scroll')
          })
        }
      }
    })
  })
}

$.extend({
  getQueryParameters : function(str) {
	  return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
  }
});
