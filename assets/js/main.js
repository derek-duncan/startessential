$(function() {

  $.extend({
    getQueryParameters : function(str) {
      return (str || document.location.search).replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
    }
  });

  $('a[href*=#]').on('click', function(e){
    e.preventDefault();
    $('html,body').animate({scrollTop:$(this.hash).offset().top}, 500);
  });

  if ($.getQueryParameters().message) {
    toggleMessages()
  }

  $(document).on('click', '.graphic-save, .details-save', function() {
    toggleMessages(true)
  })

  stickFooter()
  recordCounterArrange()

  $(window).resize(function() {
    stickFooter()
    recordCounterArrange()
  })

  function stickFooter() {
    var footer = $('.footer');
    var push = $('.push');
    var footer_h = footer.outerHeight();
    var header_h = $('.header').outerHeight()
    var all_content = $('.all-content')
    all_content.css('margin-bottom', -(footer_h))
    footer.add(push).height(footer_h)
  }

  function recordCounterArrange() {
    var wWidth, counter, logo;
    wWidth = $(window).width()
    counter = $('.record-counter')
    logo = $('.logo-wrap')

    if (wWidth <= 520) {
      counter.insertAfter(logo.find('a'))
    }
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

  if ($('#post').length) {
    $('.post-now button').on('click', function(e) {
      toggleMessages()
    })
  }
  if ($('#posts').length) {
    var $grid;
    var numberLoaded = 0;
    var isLoading = false;

    // Masonry magic
    $grid = $('.grid').masonry({
      itemSelector: '.grid-item',
      gutter: '.gutter-sizer',
      percentPosition: true,
      //transitionDuration: 0
    })

    getNextGraphics()

    $(window).scroll(function() {
      var wHeight = $(window).height()
      var scrollTop = $(window).scrollTop()
      var bottomOfDoc = $(document).height() - wHeight
      if (scrollTop + wHeight * 0.5 >= bottomOfDoc) {
        if (!isLoading) {
          getNextGraphics();
        }
      }
    })
    // Ajax graphics
    function getNextGraphics() {
      $.ajax({
        url: '/api/v1/posts',
        beforeSend: function(xhr) {
          isLoading = true
          xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('api_token'))
        },
        dataType: 'json',
        data: {
          limit: 4,
          //offset: 0
          offset: numberLoaded
        },
        success: function(graphics) {
          if (graphics.posts.length) {
            createGraphics(graphics)
          } else {
            $('.graphics-end').addClass('show')
          }
        }
      })

      function createGraphics(graphics) {
        var elements = []
        numberLoaded += graphics.posts.length
        $.each(graphics.posts, function(i) {
          var graphic = graphics.posts[i]

          var wrapper = $('<div class="grid-item"/>')

          var link = $('<a/>', {
            href: '/posts/' + graphic.url_path,
            title: graphic.title
          })

          var imageWrap = $('<div class="graphic-image-wrap"/>')
          var image = $('<img/>', {
            src: graphic.image.small.Location,
            class: 'graphic-image'
          })
          imageWrap.append(image)

          var info = $('<div class="graphic-info"/>')

          var title = $('<h4/>', {
            class: 'graphic-title',
            text: graphic.title
          })
          info.append(title)

          var tags = $('<div class="graphic-tags"/>')
          var category = $('<span/>', {
            class: 'graphic-category',
            text: graphic.category
          })
          tags.append(category)
          var line = $('<span/>', {
            html: '&nbsp;|&nbsp;'
          })
          tags.append(line)
          var date = $('<span/>', {
            class: 'graphic-date',
            text: moment(graphic.date_created).fromNow()
          })
          tags.append(date)
          info.append(tags)

          var actions = $('<div class="graphic-actions">')
          var form = $('<form/>', {
            action: '/posts/' + graphic._id + '/save',
            method: 'POST'
          })
          var csrfToken = $('<input />', {
            type: 'hidden',
            name: 'crumb',
            value: window.csrf
          })
          form.append(csrfToken)
          var graphicLink = $('<a/>', {
            title: graphic.title,
            href: '/posts/' + graphic.url_path,
            text: 'View Graphic'
          })
          form.append(graphicLink)
          var graphicSave = $('<button/>', {
            class: 'graphic-save',
            type: 'submit',
            text: graphic.isSaved ? 'Saved' : 'Save',
            disabled: graphic.isSaved
          })
          form.append(graphicSave)
          actions.append(form)

          info.append(actions)

          link.append(imageWrap)
          link.append(info)
          wrapper.append(link)

          elements.push(wrapper)
        })
        elements = $($.map(elements, function(el) {
          return el.get()
        }))
        $grid.append(elements).masonry('appended', elements);
        toggleLoaderState()
        refreshLayout()
      }
      function refreshLayout() {
        $grid.imagesLoaded().progress( function() {
          $grid.masonry('layout');
          stickFooter()
        });
      }

      function toggleLoaderState() {
        var loader = $('.graphics-loader')
        if (isLoading) {
          isLoading = false
          loader.addClass('hide')
        } else {
          isLoading = true
          loader.removeClass('hide')
        }
      }
    }

  }

  if ($('#account').length) {
    $('.remove-form button').on('click', function(e) {
      var c = confirm('Are you sure you would like to remove your account to Start Essential?')
      return c;
    })
  }

  if ($('#preview').length) {

    var shareBtn = $('.share-facebook');
    shareBtn.on('click', function(e) {
      var self = $(this);
      fbShare(self.attr('data-code'))
    })
  }

  if ($('#preview, #post').length) {
    calcMargin();
    $(window).resize(calcMargin)

    $(window).load(function() {
      $('.graphic-details').stick_in_parent({
        offset_top: 85
      })
    })

    function calcMargin() {
      if ($(window).width() > 520) {
        var img = $('.graphic-image-wrap');
        var details = $('.graphic-details');
        details.css('margin-left', img.width() + 30);
      }
    }
  }

  function fbShare(code) {
    FB.ui({
      method: 'share',
      href: window.location.origin + '/preview/' + code
    }, function(response){
      window.location.href = window.location.origin + '/publish/' + code;
    });
  }

  function toggleMessages(noHide) {
    var body = $('body')
    body.toggleClass('messages')
    if (!noHide) {
      if (body.hasClass('messages')) {
        setTimeout(function() {
          toggleMessages()
        }, 7000)
      }
    }
  }

});
