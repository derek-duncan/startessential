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
    var joinNumber = $('.join-input');
    var joinSampleLink = $('.join-sample-link');

    joinButton.on('click touchend', submitNumber)
    joinNumber.on('keyup', function(e){
      if ($.isNumeric(this.value) === false) {
         this.value = this.value.slice(0, -1);
      }
      if (this.value.length > 7) {
         this.value = this.value.slice(0, -1);
      }
      if (this.value.length === 7) {
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
  // $.ajaxSetup({ cache: true });
  // $.getScript('//connect.facebook.net/en_US/sdk.js', function(){
  //   FB.init({
  //     appId: '1589098114709228',
  //     version: 'v2.3', // or v2.0, v2.1, v2.0
  //   });
    // $('.post-now a').on('click', function(e) {
    //   e.preventDefault();
    //   FB.api('/' + User.id + '/photos', 'post', {
    //     caption: Post.content,
    //     url: Post.image_url,
    //     access_token: User.token
    //   }, function(response) {
    //     console.log(response)
    //   });
    // })
  // });
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

$.extend({
  getQueryParameters : function(str) {
	  return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
  }
});
