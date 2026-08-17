Feature: Camera pan and zoom
  As a player exploring a large pattern
  I want to pan and zoom the viewport
  So that I can navigate the infinite grid without moving the underlying pattern

  Scenario: Panning moves the viewport without changing the zoom level
    Given a camera centered on the origin at the default zoom
    When I pan the camera by 40 pixels right and 20 pixels down
    Then the camera should have moved left and up in world coordinates
    And the cell size should be unchanged

  Scenario: Zooming in centers on the cursor position
    Given a camera centered on the origin at the default zoom
    When I zoom in at pixel (100, 50) by a factor of 2
    Then the cell size should double
    And the world point that was under the cursor should still be under the cursor

  Scenario Outline: Zoom is clamped to a sane range
    Given a camera centered on the origin at the default zoom
    When I zoom repeatedly by a factor of <factor> until the cell size stops changing
    Then the cell size should be <expected size>

    Examples:
      | factor | expected size |
      | 1000   | 60             |
      | 0.001  | 8              |

  Scenario: Resetting the view returns to the default centered zoom
    Given a camera centered on the origin at the default zoom
    When I pan the camera by 500 pixels right and 500 pixels down
    And I zoom in at pixel (0, 0) by a factor of 3
    And I reset the view for an 800 by 600 pixel viewport
    Then the camera should be centered on the origin at the default zoom
