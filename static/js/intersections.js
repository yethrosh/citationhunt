// global for debugging
var wizard = null;

$(function() {
  function sendCreationRequest(payload) {
    return $.ajax({
      type: 'POST',
      url: wizard.getLangCode() + '/intersection',
      data: payload,
      dataType: 'JSON',
      contentType: 'application/json',
      success: (response) => {
        wizard.advanceToCard('intersection-card-end', response);
      },
    });
  }

  var Card = {
    getId: function() {
      // Get the ID of this card.
      return null;
    },
    start: function(container) {
      // Put this card's HTML content inside a container.
    },
    end: function($container) {
      // Remove this card from a container.
    },
    // If set, callback for submiting data to the server. Should return a Promise.
    submit: null,
  };

  function LandingCard(wizard) {
    var id = 'intersection-landing-card';
    this.getId = () => id;

    var $html = $('#' + id).detach();
    $html.find('#import-article-titles-link').click((e) => {
      e.preventDefault();
      wizard.advanceToCard('import-article-titles-card');
    });
    $html.find('#import-petscan-link').click((e) => {
      e.preventDefault();
      wizard.advanceToCard('import-petscan-card');
    });

    this.start = function($container) {
      $container.append($html);
    };

    this.end = function($container) {
      $html.detach();
    };
  }
  LandingCard.prototype = Card;

  function ImportArticlesCard(wizard) {
    var id = 'import-article-titles-card';
    this.getId = () => id;
    var $html = $('#' + id).detach();

    this.start = function($container) {
      $container.append($html);
      $html.find('textarea').focus();
    };

    this.end = function($container) {
      $html.detach();
    };

    this.submit = function() {
      var rawInput = $html.find('textarea').val();
      var payload = JSON.stringify({
        page_titles: rawInput.split(/\r?\n/g).map(title => title.trim()),
      });
      return sendCreationRequest(payload);
    };
  }
  ImportArticlesCard.prototype = Card;

  function ImportPetScanCard(wizard) {
    var id = 'import-petscan-card';
    this.getId = () => id;
    var $html = $('#' + id).detach();

    this.start = function($container) {
      $container.append($html);
    };

    this.end = function($container) {
      $html.detach();
    };

    this.submit = function() {
      var psid = extractPetScanID($html.find('input').val());
      // TODO handle invalid input
      var payload = JSON.stringify({
        psid: psid,
      });
      return sendCreationRequest(payload);
    }

    function extractPetScanID(input) {
      var psid = input;
      var urlParser = document.createElement('a');
      urlParser.href = input;
      if (urlParser.hostname === 'petscan.wmflabs.org') {
        var searchParamsParser = new URLSearchParams(urlParser.search);
        psid = searchParamsParser.get('psid');
      }
      if (psid && psid.match(/^[0-9]+$/)) {
        return psid;
      }
      return null;
    };
  }
  ImportPetScanCard.prototype = Card;

  function IntersectionCreatedCard(wizard) {
    var id = 'intersection-card-end';
    this.getId = () => id;
    var $html = $('#' + id).detach();

    this.start = function($container, response) {
      $container.append($html);

      // TODO handle errors and empty intersections here.
      $html.find('#intersection-narticles').text(response.page_ids.length)
      var intersectionURL = (
        document.location.origin + '/' + wizard.getLangCode() +
        '?inter=' + response['id']);
      var l = $html.find('#intersection-created-link')
      l.val(intersectionURL);
      l.attr('size', intersectionURL.length);
      l.focus();
      l[0].setSelectionRange(0, intersectionURL.length);

      var strings = wizard.getStrings();
      if (!strings.intersectionCreated) return;
      $container.find('#intersection-created').text(
        $.i18n(strings.intersectionCreated,
          response['page_ids'].length, response['ttl_days']));
    };

    this.end = function($container) {
      $html.detach();
    };
  }
  IntersectionCreatedCard.prototype = Card;

  function Wizard($container, $buttonBack, $buttonSubmit) {
    this._switchToCard = function(nextCardId, argsFromPrevious) {
      var nextCard = this.cards.filter((c) => c.getId() == nextCardId)[0];
      if (this._currentCard !== null) {
        this._currentCard.end(this.$container);
      }
      nextCard.start(this.$container, argsFromPrevious);
      this._currentCard = nextCard;
    }

    this._setUpButtons = function() {
      $buttonBack.hide();
      if (this._cardHistory.length)  {
        $buttonBack.show();
      }
      $buttonSubmit.hide();
      if (this._currentCard.submit !== null) {
        $buttonSubmit.show();
      }
    };

    this.advanceToCard = function(nextCardId, argsFromPrevious) {
      if (this._currentCard !== null) {
        this._cardHistory.push(this._currentCard);
      }
      this._switchToCard(nextCardId, argsFromPrevious);
      this._setUpButtons();
    };

    this.landAtCard = function(cardId) {
      this._cardHistory = [];
      this._switchToCard(cardId);
      this._setUpButtons();
    };

    this.getLangCode = () => document.documentElement.dataset.chLangCode;
    this.getStrings = () => document.getElementById('js-strings').dataset;
    this.$container = $container;
    this.cards = [
      LandingCard,
      ImportArticlesCard,
      ImportPetScanCard,
      IntersectionCreatedCard,
    ].map((ctor) => new ctor(this), this);

    $buttonBack.click((e) => {
      e.preventDefault();
      var previousCard = this._cardHistory.pop();
      this._switchToCard(previousCard.getId());
      this._setUpButtons();
    });
    $buttonSubmit.click((e) => {
      // TODO progress indicator and disable submit button
      e.preventDefault();
      this._currentCard.submit();
    });

    this._cardHistory = [];
    this._currentCard = null;
  }

  wizard = new Wizard(
    $('#intersection-card-container'),
    $('#intersection-button-back'),
    $('#intersection-button-submit'));
  wizard.landAtCard('intersection-landing-card');
  $('#intersection-modal-trigger').change(() => {
    wizard.landAtCard('intersection-landing-card');
  });
});
