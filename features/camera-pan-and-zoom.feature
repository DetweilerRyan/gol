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
