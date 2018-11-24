import flask

import os
import json

def _link_start(url, target = '_blank'):
    return flask.Markup('<a target="%s" href="%s">' % (target, url))

def _link(url, title, target = "_blank"):
    return flask.Markup('%s%s</a>' % (_link_start(url, target), title))

def _preprocess_variables(config, strings):
    strings['in_page'] = \
        flask.Markup(strings['in_page']) % _link('%s', '%s')

    strings.setdefault('tooltitle', 'Citation Hunt')

    if config.lead_section_policy_link:
        strings['lead_section_hint'] = \
            flask.Markup(strings['lead_section_hint']) % _link(
                config.lead_section_policy_link,
                config.lead_section_policy_link_title)
    else:
        strings['lead_section_hint'] = ''

    beginners_hint_link = _link(
        config.beginners_link,
        config.beginners_link_title)
    strings['beginners_hint'] = \
        flask.Markup(strings['beginners_hint']) % beginners_hint_link

    strings['page_not_found_text'] = \
        flask.Markup(strings['page_not_found_text']) % _link(
            'https://tools.wmflabs.org/citationhunt/' + config.lang_code,
            'Citation Hunt', "_self")

    strings.setdefault('instructions_goal', '')
    strings.setdefault('instructions_details', '')
    if strings['instructions_goal']:
        if hasattr(config, 'reliable_sources_link'):
            link_start, link_end = (
                _link_start(config.reliable_sources_link), '</a>')
        else:
            link_start = link_end = ''

        # Note that format() doesn't raise an exception if the string doesn't
        # have any formatters, so this is fine even if instructions_goal is
        # outdated and doesn't contain the {link_start}/{link_end} markers.
        strings['instructions_goal'] = flask.Markup(
            strings['instructions_goal'].format(
                link_start = link_start, link_end = link_end))

    if strings['instructions_details']:
        strings['instructions_details'] = flask.Markup(
                strings['instructions_details']) % (
                    flask.Markup('<b>' + strings['button_wikilink'] + '</b>'),
                    flask.Markup('<b>' + strings['button_next'] + '</b>'),
                    beginners_hint_link)

    strings.setdefault('footer', '')
    if strings['footer']:
        # We replace the URLs in the template itself
        strings['footer'] = flask.Markup(strings['footer']) % (
            strings['tooltitle'],
            _link('%s', 'Tools Labs'),
            _link('%s', 'translatewiki.net'))

    strings.setdefault('leaderboard_title', '')
    strings.setdefault('leaderboard_description', '')
    if strings['leaderboard_title'] and strings['leaderboard_description']:
        strings['leaderboard_title'] = strings['leaderboard_title'] % (
            strings['tooltitle'])
        strings['leaderboard_description'] = (
            strings['leaderboard_description'].format(
                tooltitle = strings['tooltitle'],
                days = '%s'))  # The template swaps in the actual number.

    strings.setdefault('intersection_intro', '')
    if strings['intersection_intro']:
        strings['intersection_intro'] = flask.Markup(
            strings['intersection_intro'].format(
                em_start = '<b>',
                em_end = '</b>',
                tooltitle = strings['tooltitle']))

    strings.setdefault('import_articles_prompt', '')
    if strings['import_articles_prompt']:
        strings['import_articles_prompt'] = flask.Markup(
            strings['import_articles_prompt'].format(
                em_start = '<b>',
                em_end = '</b>'))

    strings.setdefault('import_petscan_intro', '')
    if strings['import_petscan_intro']:
        strings['import_petscan_intro'] = flask.Markup(
            strings['import_petscan_intro'].format(
                em_start = '<b>',
                em_end = '</b>'))

    strings.setdefault('import_petscan_prompt', '')
    if strings['import_petscan_prompt']:
        strings['import_petscan_prompt'] = flask.Markup(
            strings['import_petscan_prompt'].format(
                link_start = _link_start(config.petscan_url),
                link_end = '</a>'))

    strings.setdefault('intersection_notice', '')
    if strings['intersection_notice']:
        strings['intersection_notice'] = flask.Markup(
            strings['intersection_notice'].format(
                tooltitle = strings['tooltitle'],
                link_start = _link_start(config.lang_code, ''),
                link_end = '</a>'))

    return strings

def _partition_js_strings(strings):
    # Separate js- strings into its own sub-key. These are meant for
    # client-side use.
    strings['js'] = {}
    for k, v in strings.items():
        if k.startswith('js-'):
            strings['js'][k[3:]] = strings.pop(k)

def get_localized_strings(config, lang_tag):
    strings_dir = os.path.dirname(__file__)
    json_path = os.path.join(strings_dir, lang_tag.lower() + '.json')
    try:
        strings = json.load(file(json_path))
    except:
        return {}
    strings = _preprocess_variables(config, strings)
    _partition_js_strings(strings)
    return strings
