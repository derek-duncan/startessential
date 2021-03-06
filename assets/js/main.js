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
          'We created a signup link so you can quickly signup people &mdash; try it out!' +
          '<a href="/n/'+this.value+'" target="_blank">http://startessential.com/n/'+this.value+'</a>' +
          'Start your free trial to get access to the rest of Start Essential'
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

    $(window).load(function() {
      // Oil animation
      var oilsWrapper = $('.middle-oils');
      var oils = oilsWrapper.find('.oil');
      var oilsLen = oils.length;

      var setOilHeight = function() {
        var offset = $(window).width() > 520 ? 0.7 : 1;
        var heightVal = oils.height() * offset;
        oilsWrapper.css('maxHeight', heightVal)
      }
      setOilHeight();
      $(window).resize(setOilHeight)

      var removeState = function(el) {
        setTimeout(function() {
          el.removeClass('up')
        }, 400)
      }

      var lastIndex;
      var getRand = function() {
        var num = Math.floor(Math.random() * oilsLen);
        if (num === lastIndex) return getRand();
        else return num;
      }
      setInterval(function() {
        var randOil = getRand();
        var el = oils.eq(randOil);
        el.addClass('up');
        removeState(el);
      }, 4500)
    })

    // GA Events //
    var ctaTop = $('.cta-top');
    var ctaMiddle = $('.middle-cta');
    var joinSubmit = $('.join-submit');

    ctaTop.on('click touchend', function(e) {
      ga('send', 'event', 'homepage', 'join', 'top')
    })
    ctaMiddle.on('click touchend', function(e) {
      ga('send', 'event', 'homepage', 'join', 'middle')
    })
    joinSubmit.on('click touchend', function(e) {
      ga('send', 'event', 'homepage', 'join', 'submit')
    })
  }

  if ($('#register').length) {
    var fbRegister = $('.fb-login');
    fbRegister.on('click touchend', function(e) {
      ga('send', 'event', 'register', 'button')
    })

    var showCoupon = $('.show-coupon');
    var hiddenCoupon = $('.form-block-hidden');
    showCoupon.on('click touchend', function(e) {
      var visible = hiddenCoupon.hasClass('show');

      if (visible) {
        hiddenCoupon.removeClass('show');
      } else {
        hiddenCoupon.addClass('show');
      }
    });

    var showFBDesc = $('.fb-login-desc-toggle');
    var hiddenFBDesc = $('.fb-login-desc');
    showFBDesc.on('click touchend', function(e) {
      var visible = hiddenFBDesc.hasClass('show');

      if (visible) {
        hiddenFBDesc.removeClass('show');
      } else {
        hiddenFBDesc.addClass('show');
      }
    });
  }

  if ($('#thankyou').length) {
    var shareLink = $('.share-link')

    shareLink[0].setSelectionRange(0, 9999);
    shareLink.on('click touchend', function() {
      shareLink[0].setSelectionRange(0, 9999);
    })

    $('.share-fb').on('click touchend', function(e) {
      var self = $(this);
      e.preventDefault()
      fbShare(self.attr('data-url'))
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
            $('.graphics-suggestion').addClass('focus')
            $('.graphics-end').addClass('show')
          }
        }
      })

      function createGraphics(graphics) {
        var elements = []
        numberLoaded += graphics.posts.length
        $.each(graphics.posts, function(i) {
          var graphic = graphics.posts[i]

          var wrapper = $('<div/>', {
            class: graphic.free ? "grid-item free" : "grid-item"
          });

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

          //var free = $('<h6/>', {
          //  class: 'graphic-free',
          //  text: graphic.free ? 'Free to save' : ''
          //})
          //info.append(free)

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
            text: moment(graphic.date_published).fromNow()
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
            text: graphic.isSaved ? 'Saved' : ( graphic.free ? 'Save for free' : 'Save' ),
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

    getNextGraphics()

    $(window).scroll(function() {
      var wHeight = $(window).height()
      var scrollTop = $(window).scrollTop()
      var bottomOfDoc = $('.graphics-suggestion').offset().top - wHeight;
      if (scrollTop + wHeight >= bottomOfDoc) {
        if (!isLoading) {
          getNextGraphics();
        }
      }
    })

    // Suggestion Form

    var suggestion = {};
    suggestion.el = $('.graphics-suggestion');
    suggestion.text = suggestion.el.find('.suggestion-description');
    suggestion.submit = suggestion.el.find(".suggestion-submit");
    suggestion.messages = suggestion.el.find(".suggestion-messages");

    suggestion.text.keyup(function(e) {
      while($(this).outerHeight() < this.scrollHeight + parseFloat($(this).css("borderTopWidth")) + parseFloat($(this).css("borderBottomWidth"))) {
        $(this).height($(this).height()+1);
      };
    });

    suggestion.submit.on('click touchend', function(e) {
      e.preventDefault();
      $.ajax({
        url: '/api/v1/suggestions',
        method: 'POST',
        beforeSend: function(xhr) {
          suggestion.messages.text('Sending suggestion...');
          xhr.setRequestHeader('Authorization', 'Bearer ' + Cookies.get('api_token'))
        },
        dataType: 'json',
        data: {
          crumb: suggestion.el.find('.suggestion-crumb').val(),
          description: suggestion.text.val()
        },
        error: function(err) {
          suggestion.messages.text(err.statusText);
        },
        success: function(response) {
          suggestion.text.val('');
          suggestion.text.blur();
          suggestion.messages.text(response.message)
        }
      })
    })
  }

  if ($('#post').length) {
    //$('.share-fb').on('click touchend', function(e) {
    //  fbShare($(this).attr('href'));
    //})
  }

  if ($('#account').length) {
    $('.remove-form button').on('click', function(e) {
      var c = confirm('Are you sure you would like to remove your account to Start Essential?')
      return c;
    })
    $('.share-fb').on('click touchend', function(e) {
      var self = $(this);
      e.preventDefault()
      fbShare(self.attr('data-url'))
    })
  }

  if ( $('#site').length ) {

    function createSortable() {
      $('.form-dynamics').sortable({
        items: '.input-group--dynamic',
        placeholder: '<div class="input-group--dynamic dynamic-placeholder"></div>'
      });
    }
    createSortable();

    var collapsedForm = $('.form--collapsed');

    collapsedForm.each(function() {

      var form = $( this );
      var openTriggers = form.find( '.form-info, .form-preview, .form-action a' );
      var formAction = form.find('.form-action a');
      var formActionInitial = formAction.text();

      openTriggers.on( 'click', function(e) {
        e.preventDefault();
        form.toggleClass( 'open' );
        if (form.hasClass('open')) {
          formAction.text('Close');
        } else {
          formAction.text(formActionInitial);
        }
        form.find('textarea').elastic();
      });
    });

    var addInputGroupButton = $('.add-input-group');

    addInputGroupButton.each(function() {

      var self = $(this);
      self.on('click', function() {

        var formInputContainer = self.parents('.form-edit').find('.form-dynamics');
        var dynamicInputGroups = formInputContainer.find('.input-group--dynamic');

        var target = $(self.data('group'));
        var inputGroupTemplate = target.clone();
        var inputGroupTemplateInputs = inputGroupTemplate.find('input, textarea');

        inputGroupTemplateInputs.each(function() {

          var self = $(this);
          var name = self.data('name');
          name = name.replace(/INDEX/g, dynamicInputGroups.length);
          self.attr('name', name);
        });
        inputGroupTemplate.attr('class', 'input-group input-group--dynamic');

        formInputContainer.append(inputGroupTemplate);
        createSortable();
      });
    });

    $(document).on('click touchend', '.input-group-close', function() {
      var self = $(this);
      var inputGroup = self.parents('.input-group--dynamic');
      var areYouSure = confirm('Are you sure you would like to remove this link?');
      if (areYouSure) {
        inputGroup.remove();
        createSortable();
      }
    });

    var unsaved = false;
    $(document).on('input change', 'input, textarea', function() {
      unsaved = true;
    });

    var submitted = false;
    $('.form-submit').on('click touchend', function() {

      submitted = true;
    });

    $(window).on('beforeunload', function(e){
      if (unsaved && !submitted) {
        return 'You have unsaved changes, be sure to press the Save button.';
      }
    });

    // Custom Elements
    var colorForm = $('.colors');
    var colorBlocks = colorForm.find('.color');
    var colorInputMain = colorForm.find('input[name=color]');
    var colorInputSecondary = colorForm.find('input[name=secondary]');
    var handleColorClick = function(e) {

      var self = $(this);
      var color = self.data('color');
      var secondary = self.data('secondary');
      colorInputMain.val(color);
      colorInputSecondary.val(secondary);
      colorBlocks.removeClass('active');
      self.addClass('active');
    };
    var setColor = function() {

      var self = $(this);
      var color = self.data('color');
      self.css('background-color', color);
    };
    colorBlocks.on('click touchend', handleColorClick);
    colorBlocks.each(setColor);

    var colorBlocksActive = colorBlocks.filter('.active');
    if (colorBlocksActive.length) {

      colorBlocksActive.trigger('click');
    } else {

      colorBlocks.first().trigger('click');
    }

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

  function fbShare(url) {
    FB.ui({
      app_id: '1589098114709228',
      method: 'share',
      href: url
    }, function(response) {
      if (!response.error_code) {
        window.location.href = window.location.href + '?message=Successfully%20shared';
      }
    });
  }

  function toggleMessages(noHide) {
    var body = $('body')
    body.toggleClass('messages')
    if (!noHide) {
      if (body.hasClass('messages')) {
        setTimeout(function() {
          toggleMessages()
          var noQueryURL = window.location.origin + window.location.pathname;
          history.pushState(null, null, noQueryURL);
        }, 7000)
      }
    }
  }

});
