$(function() {
  var langCode = document.documentElement.dataset.chLangCode;
  var trigger = $('#intersection-modal-trigger');
  trigger.change(() => {
    $('.intersection-card-active').removeClass('intersection-card-active');
    $('#intersection-begin-card').addClass('intersection-card-active');
  });

  $('#intersections-submit').click(() => {
    var rawInput = $('#import-article-titles-card textarea').val();
    var payload = JSON.stringify({
      page_titles: rawInput.split(/\r?\n/g).map(title => title.trim()),
    });

    $.ajax({
      type: 'POST',
      url: langCode + '/intersection',
      data: payload,
      dataType: 'JSON',
      contentType: 'application/json',
      success: (response) => {
        // TODO handle errors and empty intersections here.
        $('.intersection-card-active').removeClass('intersection-card-active');
        $('#intersection-card-end').addClass('intersection-card-active');
        var intersectionURL = (
          document.location.origin + '/' + langCode + '?inter=' + response['id']);
        $('#intersection-created-link').val(intersectionURL);
        $('#intersection-created-link').attr('size', intersectionURL.length);
        $('#intersection-created-link')[0].setSelectionRange(0, intersectionURL.length);
      },
    });
    return false;
  });

  $('#import-article-titles-link').click(() => {
    $('#intersection-begin-card').removeClass('intersection-card-active');
    $('#import-article-titles-card').addClass('intersection-card-active');
    $('#import-article-titles-card textarea').focus();
    return false;
  });
});
