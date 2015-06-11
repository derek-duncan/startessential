$(function() {
  $('a[href*=#]').on('click', function(e){
    e.preventDefault();
    $('html,body').animate({scrollTop:$(this.hash).offset().top}, 500);
  });

  stickFooter()
  $(window).resize(stickFooter)

  function stickFooter() {
    var footer = $('.footer');
    var push = $('.push');
    var footer_h = footer.outerHeight();
    var header_h = $('.header').outerHeight()
    var all_content = $('.all-content')
    all_content.css('margin-bottom', -(footer_h))
    footer.add(push).height(footer_h)
  }

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
    var joinNumber = $('.join-input');
    var joinSampleLink = $('.join-sample-link');

    joinButton.attr('disabled', 'disabled');

    joinButton.on('click touchend', submitNumber)
    joinNumber.on('keyup', function(e){
      if ($.isNumeric(this.value) === false) {
        this.value = this.value.slice(0, -1);
      }
      if (this.value.length > 7) {
        this.value = this.value.slice(0, -1);
      }
      if (this.value.length < 7) {
        joinButton.attr('disabled', 'disabled');
      }
      if (this.value.length === 7) {
        joinButton.removeAttr('disabled');
        joinSampleLink.addClass('show')
        var text =
          'We created a signup link so you can quickly signup people!' +
          '<a href="/n/'+this.value+'" target="_blank">http://startessential.com/n/'+this.value+'</a>' +
          'Click <b>Get Started</b> to get access to the rest of Start Essential'
        joinSampleLink.html(text);
      }
      if (e.keyCode === 13) {
        submitNumber(e);
      }
    })

    function submitNumber(e) {
      e.preventDefault();
      var number = joinNumber.val();
      toggleButtonState();
      //document.cookie = 'se_member_number='+number+';path=/register;max-age=60*60;'
      window.location.href = window.location.origin + '/register?se_member_number=' + number;
    }

    function toggleButtonState() {
      if (joinButton.text().indexOf('Submitting') > -1) {
        joinButton.text('Step inside');
      } else {
        joinButton.text('Submitting...');
      }
    }

    // GA Events //
    var ctaTop = $('.cta-top');
    var joinSubmit = $('.join-submit');

    ctaTop.on('click touchend', function(e) {
      ga('send', 'event', 'button', 'click', 'top cta')
    })
    joinSubmit.on('click touchend', function(e) {
      ga('send', 'event', 'button', 'click', 'join submit')
    })
  }

  if ($('#register').length) {
    var NumberBlock = {
      label: $('.number-label'),
      data: $('.number-data')
    }

    NumberBlock.data.text($.getQueryParameters().se_member_number)
  }

  if ($('#thankyou').length) {
    var shareLink = $('.share-link')

    shareLink[0].setSelectionRange(0, 9999);
    shareLink.on('click touchend', function() {
      shareLink[0].setSelectionRange(0, 9999);
    })

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
  //$('.post-now a').on('click', function(e) {
  //  e.preventDefault();
  //  toggleSaving()
  //})
}

if ($('#posts').length) {
  var post = $('.post');

  $('img').load(function() {
    post.each(function() {
      var wrap = $(this).find('.post-image-wrap');
      var wrapHeight = wrap.outerHeight();
      var postImage = wrap.find('.post-image');
      var postImageHeight = postImage.height()
      postImage.css({
        top: 'auto',
        bottom: -postImageHeight + wrapHeight
      })
      if (postImageHeight > wrapHeight) {
        var heightDifference = postImageHeight - wrapHeight
        if ($('html.no-touch').length) {
          wrap.on('mouseover', function() {
            postImage.addClass('scroll')
          })
          wrap.on('mouseout', function() {
            postImage.removeClass('scroll')
          })
        } else {
          wrap.on('touchstart', function() {
            if (postImage.hasClass('scroll')) postImage.removeClass('scroll')
            else postImage.addClass('scroll')
          })
        }
      }
    })
  })
}

if ($('#account').length) {
  $('.remove-form button').on('click', function(e) {
    var c = confirm('Are you sure you would like to remove your account to Start Essential?')
    return c;
  })
}

window.fbAsyncInit = function() {
  FB.init({
    appId: '1589098114709228',
    xfbml: true,
    version: 'v2.3'
  });
};
function fbShare(url) {
  toggleSaving();
  FB.ui({
    method: 'share',
    href: url
  }, function(response){
    toggleSaving()
  });
}

function toggleSaving() {
  var overlay = $('.saving-overlay');
  overlay.toggle();
}

$.extend({
  getQueryParameters : function(str) {
	  return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
  }
});
