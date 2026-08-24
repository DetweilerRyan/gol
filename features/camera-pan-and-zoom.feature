Feature: Camera pan and zoom
  As a player exploring a large pattern
  I want to pan and zoom the viewport
  So that I can navigate the infinite grid without moving the underlying pattern

  Scenario: Panning moves the viewport without changing the zoom level
    Given a camera centered on the origin at the default zoom
    When I pan the camera by 40 pixels right and 20 pixels down
    Then the camera should have moved left and up over the grid
    And the zoom level should be unchanged

  Scenario: Zooming in centers on the cursor position
    Given a camera centered on the origin at the default zoom
    When I zoom in at pixel (100, 50) by a factor of 2
    Then the zoom percentage should be 200
    And the point under the cursor should not move

  Scenario: Zooming out one step halves the zoom percentage
    Given a camera centered on the origin at the default zoom
    When I zoom out at pixel (100, 50) by a factor of 0.5
    Then the zoom percentage should be 50

  Scenario: Zooming in stops at the maximum zoom
    Given a camera centered on the origin at the default zoom
    When I zoom in repeatedly until the zoom stops changing
    Then the zoom percentage should be 300

  Scenario: Zooming out stops at the minimum zoom
    Given a camera centered on the origin at the default zoom
    When I zoom out repeatedly until the zoom stops changing
    Then the zoom percentage should be 40

  Scenario: Resetting the view returns to the default centered zoom
    Given a camera centered on the origin at the default zoom
    And I have panned and zoomed away from that view
    When I reset the view for an 800 by 600 pixel viewport
    Then the origin should sit at the center of the viewport
    And the zoom percentage should be 100
