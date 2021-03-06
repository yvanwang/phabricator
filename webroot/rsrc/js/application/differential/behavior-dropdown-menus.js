/**
 * @provides javelin-behavior-differential-dropdown-menus
 * @requires javelin-behavior
 *           javelin-dom
 *           javelin-util
 *           javelin-stratcom
 *           phuix-dropdown-menu
 *           phuix-action-list-view
 *           phuix-action-view
 *           phabricator-phtize
 */

JX.behavior('differential-dropdown-menus', function(config) {
  var pht = JX.phtize(config.pht);

  function show_more(container) {
    var nodes = JX.DOM.scry(container, 'tr', 'context-target');
    for (var ii = 0; ii < nodes.length; ii++) {
      var show = JX.DOM.scry(nodes[ii], 'a', 'show-more');
      for (var jj = 0; jj < show.length; jj++) {
        if (JX.Stratcom.getData(show[jj]).type != 'all') {
          continue;
        }
        var event_data = {
          context : nodes[ii],
          show : show[jj]
        };
        JX.Stratcom.invoke('differential-reveal-context', null, event_data);
      }
    }
  }

  JX.Stratcom.listen(
    'click',
    'differential-reveal-all',
    function(e) {
      var containers = JX.DOM.scry(
        JX.$('differential-review-stage'),
        'div',
        'differential-changeset');
      for (var i=0; i < containers.length; i++) {
        show_more(containers[i]);
      }
      e.kill();
    });

  var buildmenu = function(e) {
    var button = e.getNode('differential-view-options');
    var data = JX.Stratcom.getData(button);

    if (data.menu) {
      return;
    }

    e.prevent();

    var menu = new JX.PHUIXDropdownMenu(button);
    var list = new JX.PHUIXActionListView();

    var add_link = function(icon, name, href, local) {
      if (!href) {
        return;
      }

      var link = new JX.PHUIXActionView()
        .setIcon(icon)
        .setName(name)
        .setHref(href)
        .setHandler(function(e) {
          if (local) {
            window.location.assign(href);
          } else {
            window.open(href);
          }
          menu.close();
          e.prevent();
        });

      list.addItem(link);
      return link;
    };

    var reveal_item = new JX.PHUIXActionView()
      .setIcon('preview');
    list.addItem(reveal_item);

    var visible_item = new JX.PHUIXActionView()
      .setHandler(function(e) {
        var diff = JX.DOM.scry(
          JX.$(data.containerID),
          'table',
          'differential-diff');

        JX.Stratcom.invoke('differential-toggle-file', null, {diff: diff});
        e.prevent();
        menu.close();
      });
    list.addItem(visible_item);

    add_link('file', pht('Browse in Diffusion'), data.diffusionURI);
    add_link('transcript', pht('View Standalone'), data.standaloneURI);
    add_link('arrow_left', pht('Show Raw File (Left)'), data.leftURI);
    add_link('arrow_right', pht('Show Raw File (Right)'), data.rightURI);
    add_link('edit', pht('Open in Editor'), data.editor, true);
    add_link('wrench', pht('Configure Editor'), data.editorConfigure);


    menu.setContent(list.getNode());

    menu.listen('open', function() {

      // When the user opens the menu, check if there are any "Show More"
      // links in the changeset body. If there aren't, disable the "Show
      // Entire File" menu item since it won't change anything.

      var nodes = JX.DOM.scry(JX.$(data.containerID), 'a', 'show-more');
      if (nodes.length) {
        reveal_item
          .setDisabled(false)
          .setName(pht('Show Entire File'))
          .setHandler(function(e) {
            show_more(JX.$(data.containerID));
            e.prevent();
            menu.close();
          });
      } else {
        reveal_item
          .setDisabled(true)
          .setName(pht('Entire File Shown'))
          .setHandler(function(e) { e.prevent(); });
      }

      visible_item.setDisabled(true);
      visible_item.setName(pht("Can't Toggle Unloaded File"));
      var diffs = JX.DOM.scry(
        JX.$(data.containerID),
        'table',
        'differential-diff');

      if (diffs.length > 1) {
        JX.$E(
          'More than one node with sigil "differential-diff" was found in "'+
          data.containerID+'."');
      } else if (diffs.length == 1) {
        diff = diffs[0];
        visible_item.setDisabled(false);
        if (JX.Stratcom.getData(diff).hidden) {
          visible_item
            .setName(pht('Expand File'))
            .setIcon('unmerge');
        } else {
          visible_item
            .setName(pht('Collapse File'))
            .setIcon('merge');
        }
      } else {
        // Do nothing when there is no diff shown in the table. For example,
        // the file is binary.
      }

    });
    data.menu = menu;
    menu.open();
  };

  JX.Stratcom.listen('click', 'differential-view-options', buildmenu);
});
