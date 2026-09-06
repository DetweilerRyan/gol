Feature: Camera pan and zoom
  As a player exploring a large pattern
  I want to pan and zoom the viewport
  So that I can navigate the infinite grid without moving the underlying pattern

  Scenario: Panning moves the viewport without changing the zoom level
    Given a camera centered on the origin at the default zoom
    When I pan the camera by 40 pixels right and 20 pixels down
    Then the camera should have moved left and up over the grid
    And the zoom level should be unchanged

  Scenario: Zooming in once glides up to the next zoom percentage
    Given a camera centered on the origin at the default zoom
    When I zoom in once
    Then the zoom percentage should be 125
    And the zoom percentage should have passed through the percentages in between
    And the zoom percentage should never have gone past 125

  Scenario: Zooming out once glides down to the next zoom percentage
    Given a camera centered on the origin at the default zoom
    When I zoom out once
    Then the zoom percentage should be 80
    And the zoom percentage should have passed through the percentages in between
    And the zoom percentage should never have gone past 80

  Scenario: Two quick zoom-in clicks glide on to the level two steps up
    Given a camera centered on the origin at the default zoom
    When I zoom in twice in quick succession
    Then the zoom percentage should be 156
    And the zoom percentage should never have gone past 156

  Scenario: Zooming snaps straight to the next level for a player who prefers reduced motion
    Given I prefer reduced motion
    And a camera centered on the origin at the default zoom
    When I zoom in once
    Then the zoom percentage should be 125
    And the zoom percentage should not have passed through any percentages in between

  Scenario: Zooming in stops at the maximum zoom
    Given a camera centered on the origin at the default zoom
    When I zoom in repeatedly until the zoom stops changing
    Then the zoom percentage should be 300

  Scenario: Zooming out stops at the minimum zoom
    Given a camera centered on the origin at the default zoom
    When I zoom out repeatedly until the zoom stops changing
    Then the zoom percentage should be 40

  Scenario: Zooming out answers the first click after the maximum is reached
    Given a camera centered on the origin at the default zoom
    And I have gone on clicking zoom in past the maximum zoom
    When I zoom out once
    Then the zoom percentage should be 240

  Scenario: Resetting the view while a zoom is still gliding returns to the default view
    Given a camera centered on the origin at the default zoom
    When I zoom in and immediately reset the view
    Then the zoom percentage should be 100
    And the coordinate labels in view should be balanced around the origin

  Scenario: Resetting the view returns to the default centered zoom
    Given a camera centered on the origin at the default zoom
    And I have panned and zoomed away from that view
    When I reset the view for an 800 by 600 pixel viewport
    Then the coordinate labels in view should be balanced around the origin
    And the zoom percentage should be 100

  # THE ZOOM CLAUSE IS PART OF THE CLAIM, NOT SCENERY. An empty board is also
  # what a press that landed on nothing leaves behind, so without a clause
  # saying the control answered, this scenario would be satisfied by a button
  # that was never reached. The percentage is that clause: it says the press
  # arrived. It is written first for the same reason -- under the layering
  # this scenario guards, a broken build reds here and reports a missed press
  # as a missed press, rather than at the aliveness clause, which would name
  # the wrong quantity.
  #
  # THERE IS ALWAYS A CELL UNDERNEATH. The toolbar is drawn on the board
  # rather than beside it, so a press on a zoom control is always also a press
  # over some cell of the grid. Which cell that is depends on the size of the
  # window and is deliberately not named here -- the promise is about the
  # board, not about any one cell of it.
  #
  # IF THE TOOLBAR EVER MOVED OFF THE BOARD this scenario would go on passing
  # while guarding nothing, and that is accepted rather than overlooked: the
  # same move ends the class of defect it guards against, since a control with
  # no board under it has nothing to leak into. There is no precondition step
  # for the covering, deliberately -- it can only be observed by hit-testing
  # or by measuring boxes, which is not the altitude of this contract.
  #
  # THIS IS THE STATED GUARD for the grid overlay being a sibling of the
  # board's own content rather than an ancestor of it -- src/components/
  # Grid.tsx's layering. Other scenarios happen to fail when that inverts;
  # this is the one that says so on purpose.
  Scenario: Pressing a zoom control brings no cell to life underneath it
    Given an empty grid
    And a camera centered on the origin at the default zoom
    When I zoom in once
    Then the zoom percentage should be 125
    And no cell should be alive
